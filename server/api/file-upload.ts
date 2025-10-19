import multiparty, { type File as MultipartyFile } from 'multiparty'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readFile } from 'node:fs/promises'
import { lookup as lookupMime } from 'mime-types'
import { createError, defineEventHandler } from 'h3'

import { requireSuperAdmin } from '../utils/superadmin-session'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  const bucket = runtimeConfig.s3Bucket
  const accessKey = runtimeConfig.s3AccessKey
  const secretKey = runtimeConfig.s3SecretAccessKey
  const region = runtimeConfig.s3Region || 'eu-north-1'

  await requireSuperAdmin(event)

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

  const uploads = Object.values(files).flatMap(fileList => fileList ?? [])

  if (!uploads.length) {
    throw createError({ statusCode: 400, statusMessage: 'No files provided' })
  }

  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    }
  })

  const prefixField = fields?.prefix
  const defaultPrefix = Array.isArray(prefixField) ? prefixField[0] : undefined
  const prefix = runtimeConfig.s3KeyPrefix || defaultPrefix || ''
  const sanitizedPrefix = typeof prefix === 'string' && prefix.length
    ? prefix.replace(/^\/+|\/+$/g, '')
    : ''

  const buildKey = (filename: string) => {
    const baseName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const key = `${Date.now()}-${Math.random().toString(16).slice(2)}-${baseName}`
    return sanitizedPrefix ? `${sanitizedPrefix}/${key}` : key
  }

  const baseUrl = region === 'us-east-1'
    ? `https://${bucket}.s3.amazonaws.com`
    : `https://${bucket}.s3.${region}.amazonaws.com`

  const links: string[] = []

  for (const file of uploads) {
    const filename = file.originalFilename || 'upload.bin'
    const key = buildKey(filename)
    const body = await readFile(file.path)
    const contentType = lookupMime(filename) || 'application/octet-stream'

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
