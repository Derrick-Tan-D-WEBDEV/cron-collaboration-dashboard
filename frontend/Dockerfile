# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Set build-time environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ARG REACT_APP_ANALYTICS_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_ANALYTICS_URL=$REACT_APP_ANALYTICS_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set permissions
RUN chown -R nextjs:nodejs /usr/share/nginx/html
RUN chown -R nextjs:nodejs /var/cache/nginx
RUN chown -R nextjs:nodejs /var/log/nginx
RUN chown -R nextjs:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nextjs:nodejs /var/run/nginx.pid

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]