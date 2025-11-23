import { randomUUID } from 'crypto'
import process from 'process'

import type { H3Event } from 'h3'
import { createError, deleteCookie, getCookie, getRequestIP, getRequestHeader, setCookie } from 'h3'

import type { Admin, AdminRole } from '@prisma/client'
import prisma from '../db'

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

  const session = await prisma.adminSession.create({
    data: {
      token,
      adminId: superAdminId,
      expiresAt,
      userAgent: getRequestHeader(event, 'user-agent') ?? null,
      ipAddress: getRequestIP(event) ?? null
    },
    include: {
      admin: true
    }
  })

  setCookie(event, SUPERADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SUPERADMIN_SESSION_MAX_AGE,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })

  event.context.superAdmin = session.admin
  event.context.superAdminSession = session

  return session.admin
}

export async function loadSuperAdminFromSession(event: H3Event): Promise<Admin | null> {
  if (event.context.superAdmin) {
    return event.context.superAdmin
  }

  const token = getCookie(event, SUPERADMIN_SESSION_COOKIE)
  if (!token) {
    return null
  }

  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { admin: true }
  })

  if (!session) {
    deleteCookie(event, SUPERADMIN_SESSION_COOKIE, { path: '/' })
    return null
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.adminSession.delete({ where: { id: session.id } })
    deleteCookie(event, SUPERADMIN_SESSION_COOKIE, { path: '/' })
    return null
  }

  // Sliding expiration
  const shouldRefresh = session.expiresAt.getTime() - Date.now() < (SUPERADMIN_SESSION_MAX_AGE * 1000) / 2
  if (shouldRefresh) {
    const newExpiresAt = new Date(Date.now() + SUPERADMIN_SESSION_MAX_AGE * 1000)
    await prisma.adminSession.update({
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

  event.context.superAdmin = session.admin
  event.context.superAdminSession = session

  return session.admin
}

export async function clearSuperAdminSession(event: H3Event) {
  const token = getCookie(event, SUPERADMIN_SESSION_COOKIE)
  if (token) {
    await prisma.adminSession.deleteMany({ where: { token } })
  }

  deleteCookie(event, SUPERADMIN_SESSION_COOKIE, { path: '/' })
  event.context.superAdmin = undefined
  event.context.superAdminSession = undefined
}

export async function requireSuperAdmin(event: H3Event, options: { roles?: AdminRole[] } = {}) {
  const superAdmin = await loadSuperAdminFromSession(event)

  if (!superAdmin) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (options.roles && options.roles.length > 0 && !options.roles.includes(superAdmin.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return superAdmin
}

export function isSuperAdminRole(superAdmin: AdminRole, roles: AdminRole | AdminRole[]) {
  const allowed = Array.isArray(roles) ? roles : [roles]
  return allowed.includes(superAdmin)
}
