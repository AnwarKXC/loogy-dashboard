import multiparty, { type File as MultipartyFile } from 'multiparty'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readFile } from 'node:fs/promises'
import { lookup as lookupMime } from 'mime-types'
import { createError, defineEventHandler } from 'h3'

import prisma from '../../db'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB safety cap

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const bucket = runtimeConfig.s3Bucket
  const accessKey = runtimeConfig.s3AccessKey
  const secretKey = runtimeConfig.s3SecretAccessKey
  const region = typeof runtimeConfig.s3Region === 'string'
    ? runtimeConfig.s3Region
    : 'eu-north-1'

  if (!bucket || !accessKey || !secretKey) {
    throw createError({ statusCode: 500, statusMessage: 'S3 storage is not configured' })
  }

  const form = new multiparty.Form()
  const { fields, files } = await new Promise<{
    fields: Record<string, string[] | undefined>
    files: Record<string, MultipartyFile[] | undefined>
  }>((resolve, reject) => {
    form.parse(event.node.req, (err, parsedFields, parsedFiles) => {
      if (err) {
        reject(err)
        return
      }

      resolve({ fields: parsedFields, files: parsedFiles })
    })
  })

  const conversationId = Array.isArray(fields?.conversationId) ? fields?.conversationId[0] : fields?.conversationId?.[0] ?? fields?.conversationId as string
  const rawUserId = Array.isArray(fields?.userId) ? fields?.userId[0] : fields?.userId?.[0] ?? fields?.userId as string

  if (!conversationId) {
    throw createError({ statusCode: 400, statusMessage: 'conversationId is required' })
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId }, select: { userId: true } })
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }

  const session = event.context.session
  const isAdmin = !!session?.superAdmin || session?.user?.role === 'ADMIN'

  if (!isAdmin) {
    const userId = rawUserId ? Number(rawUserId) : NaN
    if (!userId || Number.isNaN(userId) || conversation.userId !== userId) {
      throw createError({ statusCode: 403, statusMessage: 'Not allowed to upload for this conversation' })
    }
  }

  const uploads = Object.values(files).flatMap(fileList => fileList ?? [])

  if (!uploads.length) {
    throw createError({ statusCode: 400, statusMessage: 'No files provided' })
  }

  const client = new S3Client({
    region: String(region),
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    }
  })

  const baseUrl = region === 'us-east-1'
    ? `https://${bucket}.s3.amazonaws.com`
    : `https://${bucket}.s3.${region}.amazonaws.com`

  const buildKey = (filename: string) => {
    const baseName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const key = `${Date.now()}-${Math.random().toString(16).slice(2)}-${baseName}`
    return `chat/${key}`
  }

  const links: string[] = []

  for (const file of uploads) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'File too large' })
    }

    const filename = file.originalFilename || 'upload.bin'
    const key = buildKey(filename)
    const body = await readFile(file.path)
    const contentType = (file.headers?.['content-type'] as string | undefined) || lookupMime(filename) || 'application/octet-stream'

    const isImage = contentType.startsWith('image/')
    const isVoice = contentType.startsWith('audio/') || contentType === 'video/webm'

    if (!isImage && !isVoice) {
      throw createError({ statusCode: 400, statusMessage: 'Only images or voice notes are allowed' })
    }

    try {
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ACL: 'public-read',
        ContentType: contentType
      }))
    } catch (error) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Failed to upload file to storage',
        data: {
          message: error instanceof Error ? error.message : String(error)
        }
      })
    }

    links.push(`${baseUrl}/${key}`)
  }

  return { links }
})
