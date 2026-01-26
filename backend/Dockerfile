# Backend Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package files and Prisma config
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies
RUN npm ci --only=production

# Create dummy .env for prisma generate (will be overridden at runtime)
RUN echo "DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy" > .env

# Generate Prisma client
RUN npx prisma generate

# Remove dummy .env
RUN rm .env

# Copy source code
COPY src ./src/

# Re-copy prisma folder to ensure seeds are up-to-date (after cache layer)
COPY prisma ./prisma/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["node", "src/server.js"]
