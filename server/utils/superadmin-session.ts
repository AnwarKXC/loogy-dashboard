import { randomUUID } from 'crypto'
import process from 'process'

import type { H3Event } from 'h3'
import { createError, deleteCookie, getCookie, getRequestIP, getRequestHeader, setCookie } from 'h3'

import type { SuperAdmin, SuperAdminRole } from '~/generated/prisma'
import { prisma } from './prisma'

export const SUPERADMIN_SESSION_COOKIE = 'superadmin_session'
export const SUPERADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function hashPassword(password: string) {
  const bcrypt = await import('bcryptjs')

  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  const bcrypt = await import('bcryptjs')

  return bcrypt.compare(password, hash)
}

export async function createSuperAdminSession(event: H3Event, superAdminId: number) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SUPERADMIN_SESSION_MAX_AGE * 1000)
  const token = randomUUID()

  const session = await prisma.superAdminSession.create({
    data: {
      token,
      superAdminId,
      expiresAt,
      userAgent: getRequestHeader(event, 'user-agent') ?? null,
      ipAddress: getRequestIP(event) ?? null
    },
    include: {
      superAdmin: true
    }
  })

  setCookie(event, SUPERADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SUPERADMIN_SESSION_MAX_AGE,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })

  event.context.superAdmin = session.superAdmin
  event.context.superAdminSession = session

  return session.superAdmin
}

export async function loadSuperAdminFromSession(event: H3Event): Promise<SuperAdmin | null> {
  if (event.context.superAdmin) {
    return event.context.superAdmin
  }

  const token = getCookie(event, SUPERADMIN_SESSION_COOKIE)
  if (!token) {
    return null
  }

  const session = await prisma.superAdminSession.findUnique({
    where: { token },
    include: { superAdmin: true }
  })

  if (!session) {
    deleteCookie(event, SUPERADMIN_SESSION_COOKIE, { path: '/' })
    return null
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.superAdminSession.delete({ where: { id: session.id } })
    deleteCookie(event, SUPERADMIN_SESSION_COOKIE, { path: '/' })
    return null
  }

  // Sliding expiration
  const shouldRefresh = session.expiresAt.getTime() - Date.now() < (SUPERADMIN_SESSION_MAX_AGE * 1000) / 2
  if (shouldRefresh) {
    const newExpiresAt = new Date(Date.now() + SUPERADMIN_SESSION_MAX_AGE * 1000)
    await prisma.superAdminSession.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt }
    })

    setCookie(event, SUPERADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      maxAge: SUPERADMIN_SESSION_MAX_AGE,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    })
  }

  event.context.superAdmin = session.superAdmin
  event.context.superAdminSession = session

  return session.superAdmin
}

export async function clearSuperAdminSession(event: H3Event) {
  const token = getCookie(event, SUPERADMIN_SESSION_COOKIE)
  if (token) {
    await prisma.superAdminSession.deleteMany({ where: { token } })
  }

  deleteCookie(event, SUPERADMIN_SESSION_COOKIE, { path: '/' })
  event.context.superAdmin = undefined
  event.context.superAdminSession = undefined
}

export async function requireSuperAdmin(event: H3Event, options: { roles?: SuperAdminRole[] } = {}) {
  const superAdmin = await loadSuperAdminFromSession(event)

  if (!superAdmin) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (options.roles && options.roles.length > 0 && !options.roles.includes(superAdmin.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return superAdmin
}

export function isSuperAdminRole(superAdmin: SuperAdmin, roles: SuperAdminRole | SuperAdminRole[]) {
  const allowed = Array.isArray(roles) ? roles : [roles]
  return allowed.includes(superAdmin.role)
}
