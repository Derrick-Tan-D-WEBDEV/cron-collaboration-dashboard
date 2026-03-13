# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies
RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# Install dependencies based on package manager
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY . .
RUN npm install
EXPOSE 4000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
ENV NODE_ENV=production

# Copy source code
COPY . .

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}

CMD ["node", "dist/index.js"]