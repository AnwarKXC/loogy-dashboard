import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export function signJwt(payload: object, options?: jwt.SignOptions) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', ...options })
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

export function decodeJwt(token: string) {
  return jwt.decode(token)
}

export function getJwtPayloadFromEvent(event: any): any {
  const authHeader = event.node?.req?.headers?.['authorization'] || event.req?.headers?.['authorization']
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const payload = verifyJwt(token)
  if (!payload) return null
  return payload
}
