import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // OpenClaw Integration
  openclaw: {
    gatewayUrl: process.env.OPENCLAW_GATEWAY_URL || 'wss://openclaw-vnpa.srv1484467.hstgr.cloud',
    httpUrl: process.env.OPENCLAW_HTTP_URL || 'https://openclaw-vnpa.srv1484467.hstgr.cloud',
    authToken: process.env.OPENCLAW_AUTH_TOKEN,
    defaultTimeout: parseInt(process.env.OPENCLAW_DEFAULT_TIMEOUT || '30'),
  },

  // Feature Flags
  features: {
    openclawIntegration: process.env.ENABLE_OPENCLAW_INTEGRATION === 'true',
    aiAnalysis: process.env.ENABLE_AI_ANALYSIS === 'true',
    realtimeOptimization: process.env.ENABLE_REALTIME_OPTIMIZATION === 'true',
  },

  // Application
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001'),
    graphqlEndpoint: process.env.GRAPHQL_ENDPOINT || '/graphql',
  },

  // External Services
  services: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8000',
  }
};

export default config;