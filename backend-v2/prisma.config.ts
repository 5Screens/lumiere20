import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { loadEnvFile } from 'node:process'

// Load .env file
loadEnvFile()

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'node prisma/seed.js',
  },
})
