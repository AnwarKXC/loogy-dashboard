import { config } from 'dotenv'
import { resolve } from 'path'
import { defineConfig, env } from 'prisma/config'

// Explicitly load .env from root directory
config({ path: resolve(__dirname, '.env') })

export default defineConfig({
  // Path to Prisma schema file
  schema: 'prisma/schema.prisma',

  // Migration settings
  migrations: {
    path: 'prisma/migrations',
    // Seed command runs after migrations (replaces package.json "prisma.seed")
    seed: `node prisma/seed.mjs`
  },

  // Database connection
  datasource: {
    url: env('DATABASE_URL')
  }
})
