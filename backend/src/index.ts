import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { ApolloServer } from 'apollo-server-express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import { typeDefs, resolvers } from '@/graphql'
import { authMiddleware } from '@middleware/auth'
import { errorHandler } from '@middleware/errorHandler'
import { requestLogger } from '@middleware/requestLogger'

import { initializeDatabase } from '@services/database'
import { initializeRedis } from '@services/redis'
import { initializeWebSocket } from '@services/websocket'
import { initializeScheduler } from '@services/scheduler'
import { initializeNotifications } from '@services/notifications'
import { initializeAnalytics } from '@services/analytics'

import routes from '@/routes'
import { logger } from '@utils/logger'
import config from '@utils/config'

async function startServer() {
  try {
    // Initialize services
    await initializeDatabase()
    await initializeRedis()
    await initializeAnalytics()
    
    // Create Express app
    const app = express()
    const httpServer = createServer(app)
    
    // Initialize Socket.IO
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })
    
    await initializeWebSocket(io)
    
    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"]
        }
      }
    }))
    
    // CORS
    app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      optionsSuccessStatus: 200
    }))
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false
    })
    app.use(limiter)
    
    // Body parsing middleware
    app.use(compression())
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))
    
    // Logging
    app.use(requestLogger)
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
      })
    })
    
    // GraphQL Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ req, connection }) => {
        if (connection) {
          // For WebSocket connections
          return {
            ...connection.context,
            io
          }
        }
        
        // For HTTP requests
        return {
          req,
          user: req.user,
          io
        }
      },
      introspection: config.env === 'development',
      playground: config.env === 'development'
    })
    
    await server.start()
    server.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false // Already handled above
    })
    
    // REST API routes
    app.use('/api', authMiddleware, routes)
    
    // Error handling
    app.use(errorHandler)
    
    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
      })
    })
    
    // Initialize background services
    await initializeScheduler(io)
    await initializeNotifications()
    
    // Start server
    const port = config.port || 4000
    httpServer.listen(port, () => {
      logger.info(`🚀 Server ready at http://localhost:${port}`)
      logger.info(`🚀 GraphQL ready at http://localhost:${port}/graphql`)
      logger.info(`🚀 WebSocket ready at ws://localhost:${port}`)
    })
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully')
      httpServer.close(() => {
        logger.info('Process terminated')
        process.exit(0)
      })
    })
    
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

startServer()