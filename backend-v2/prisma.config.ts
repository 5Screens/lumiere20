import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Try to load .env file if it exists (for local dev)
try {
  const { loadEnvFile } = await import('node:process')
  loadEnvFile()
} catch (e) {
  // .env file not found, using environment variables from Docker
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'node prisma/seed.js',
  },
})
