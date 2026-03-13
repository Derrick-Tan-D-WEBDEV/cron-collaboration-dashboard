import dotenv from 'dotenv'

dotenv.config()

interface Config {
  env: string
  port: number
  database: {
    host: string
    port: number
    user: string
    password: string
    name: string
    ssl: boolean
  }
  redis: {
    host: string
    port: number
    password?: string
    db: number
  }
  jwt: {
    secret: string
    expiresIn: string
    refreshSecret: string
    refreshExpiresIn: string
  }
  cors: {
    allowedOrigins: string[]
  }
  email: {
    host: string
    port: number
    user: string
    password: string
    from: string
  }
  pushNotifications: {
    vapidPublicKey: string
    vapidPrivateKey: string
    vapidEmail: string
  }
  analytics: {
    pythonServiceUrl: string
    apiKey: string
  }
  monitoring: {
    logLevel: string
    sentryDsn?: string
  }
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'cron_user',
    password: process.env.DB_PASSWORD || 'password',
    name: process.env.DB_NAME || 'cron_dashboard',
    ssl: process.env.DB_SSL === 'true'
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10)
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  cors: {
    allowedOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173'
    ]
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@crondashboard.com'
  },
  
  pushNotifications: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    vapidEmail: process.env.VAPID_EMAIL || 'admin@crondashboard.com'
  },
  
  analytics: {
    pythonServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000',
    apiKey: process.env.ANALYTICS_API_KEY || 'default-key'
  },
  
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    sentryDsn: process.env.SENTRY_DSN
  }
}

export default config