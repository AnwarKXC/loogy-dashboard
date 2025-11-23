import jwt, { TokenExpiredError } from 'jsonwebtoken'
import type { H3Event } from 'h3'
import { createError } from 'h3'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface JwtPayload {
  userId: number
  email: string
  role: string
  [key: string]: unknown
}

export function signJwt(payload: JwtPayload, options?: jwt.SignOptions): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', ...options })
}

export function verifyJwt(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      console.warn('JWT expired:', token)
      throw createError({ statusCode: 401, statusMessage: 'Token expired' })
    }
    console.warn('JWT invalid:', token)
    throw createError({ statusCode: 401, statusMessage: 'Token invalid' })
  }
}

export function decodeJwt(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null
}

export function getTokenFromEvent(event: H3Event): string {
  const authHeader = event.node?.req?.headers?.['authorization'] || event.req?.headers?.['authorization']
  if (!authHeader) {
    throw createError({ statusCode: 401, statusMessage: 'No Authorization token provided' })
  }
  return authHeader.replace('Bearer ', '')
}

export function isUser(event: H3Event): number {
  const token = getTokenFromEvent(event)
  const payload = verifyJwt(token)
  if (!payload || typeof payload !== 'object' || typeof payload.userId !== 'number') {
    throw createError({ statusCode: 401, statusMessage: 'Token invalid' })
  }
  return payload.userId
}
