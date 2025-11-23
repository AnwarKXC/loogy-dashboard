import prisma from '../../db'
import { eventHandler, readBody } from 'h3'
import { signJwt } from '../../utils/jwt'

export default eventHandler(async (event) => {
  const body = await readBody(event)
  const { accessToken } = body

  if (!accessToken) {
    return { error: 'Missing accessToken' }
  }

  // Fetch user info from Google
  let googleRes: {
    sub?: string
    name?: string
    email?: string
    picture?: string
    [key: string]: any
  } = {}
  try {
    googleRes = await $fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
  } catch (err: any) {
    return { error: 'Invalid Google access token', details: err?.response?.data || err?.message || String(err) }
  }

  if (!googleRes?.sub || !googleRes?.email) {
    return { error: 'Google user info missing required fields' }
  }

  // Find user by Google ID (sub)
  let user = await prisma.user.findUnique({
    where: { authProviderId: googleRes.sub }
  })

  // If not found, create user
  if (!user) {
    user = await prisma.user.create({
      data: {
        authProviderId: googleRes.sub,
        name: googleRes.name,
        email: googleRes.email,
        avatar: googleRes.picture,
        authProvider: 'google',
        isActive: true
      }
    })
  }

  // Generate JWT
  const token = signJwt({ userId: user.id, email: user.email, role: user.role })

  return { user, token }
})
