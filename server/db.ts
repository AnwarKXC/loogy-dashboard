import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import 'dotenv/config'

export type GetDbParams = {
  connectionString: string
}

export function getDb({ connectionString }: GetDbParams) {
  const pool = new pg.Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  return prisma
}

const connectionString
  = process.env.DATABASE_URL
    || process.env.POSTGRES_URL
    || process.env.POSTGRES_PRISMA_URL

if (!connectionString) {
  throw new Error('Database connection string not configured (set DATABASE_URL or POSTGRES_URL).')
}

const prisma = getDb({ connectionString })
export default prisma
