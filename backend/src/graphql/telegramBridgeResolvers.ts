import TelegramBridge from '../services/TelegramBridge.js';
import { config } from '../utils/config.js';

// Initialize Telegram bridge
const telegramBridge = new TelegramBridge(
  config.telegram.botToken || process.env.TELEGRAM_BOT_TOKEN || '',
  config.telegram.chatId || process.env.OPENCLAW_CHAT_ID || ''
);

export const telegramBridgeResolvers = {
  Query: {
    // Get analysis result by request ID
    analysisResult: async (_, { requestId }) => {
      try {
        const result = telegramBridge.getResult(requestId);
        
        if (!result) {
          return {
            found: false,
            result: null,
            message: 'Analysis result not found or still processing'
          };
        }

        return {
          found: true,
          result: {
            requestId: result.requestId,
            status: result.status,
            analysis: result.analysis,
            completedAt: result.completedAt
          },
          message: 'Analysis result retrieved successfully'
        };
      } catch (error) {
        return {
          found: false,
          result: null,
          message: `Error retrieving result: ${error.message}`
        };
      }
    },

    // Check bridge connection status
    telegramBridgeStatus: async () => {
      try {
        const pendingCount = telegramBridge.getPendingRequests().length;
        const totalResults = telegramBridge.getAllResults().length;
        
        return {
          connected: true,
          pendingRequests: pendingCount,
          completedAnalyses: totalResults,
          lastChecked: new Date().toISOString(),
          botConfigured: !!config.telegram.botToken
        };
      } catch (error) {
        return {
          connected: false,
          error: error.message,
          lastChecked: new Date().toISOString(),
          botConfigured: false
        };
      }
    }
  },

  Mutation: {
    // Request cron job analysis via Telegram bridge
    requestCronAnalysis: async (_, { jobData }) => {
      try {
        console.log('🤖 Requesting cron analysis via Telegram bridge...');
        
        const requestId = await telegramBridge.requestAnalysis(jobData, 'CRON_ANALYSIS');
        
        return {
          success: true,
          requestId,
          message: 'Analysis request sent to OpenClaw via Telegram. Results will be available shortly.',
          estimatedWaitTime: '30-60 seconds'
        };
      } catch (error) {
        console.error('Failed to request analysis via Telegram:', error);
        return {
          success: false,
          requestId: null,
          message: `Failed to send analysis request: ${error.message}`,
          error: error.message
        };
      }
    },

    // Request schedule optimization
    requestScheduleOptimization: async (_, { jobs }) => {
      try {
        console.log(`🔧 Requesting schedule optimization for ${jobs.length} jobs...`);
        
        const requestId = await telegramBridge.requestAnalysis(
          { jobs, requestType: 'optimization' }, 
          'SCHEDULE_OPTIMIZATION'
        );
        
        return {
          success: true,
          requestId,
          message: 'Schedule optimization request sent to OpenClaw via Telegram.',
          estimatedWaitTime: '1-2 minutes'
        };
      } catch (error) {
        console.error('Failed to request schedule optimization:', error);
        return {
          success: false,
          requestId: null,
          message: `Failed to send optimization request: ${error.message}`,
          error: error.message
        };
      }
    },

    // Request failure prediction
    requestFailurePrediction: async (_, { jobId, historicalData }) => {
      try {
        console.log(`🔮 Requesting failure prediction for job: ${jobId}`);
        
        const requestId = await telegramBridge.requestAnalysis(
          { jobId, historicalData, requestType: 'prediction' },
          'FAILURE_PREDICTION'
        );
        
        return {
          success: true,
          requestId,
          message: 'Failure prediction request sent to OpenClaw via Telegram.',
          estimatedWaitTime: '30-60 seconds'
        };
      } catch (error) {
        console.error('Failed to request failure prediction:', error);
        return {
          success: false,
          requestId: null,
          message: `Failed to send prediction request: ${error.message}`,
          error: error.message
        };
      }
    },

    // Wait for analysis result with polling
    waitForAnalysisResult: async (_, { requestId, timeoutSeconds = 60 }) => {
      try {
        console.log(`⏳ Waiting for analysis result: ${requestId}`);
        
        const result = await telegramBridge.pollForResult(
          requestId, 
          timeoutSeconds * 1000
        );
        
        if (!result) {
          return {
            success: false,
            result: null,
            message: 'Analysis timed out or no result available yet. Try checking again later.',
            timeout: true
          };
        }

        return {
          success: true,
          result: {
            requestId: result.requestId,
            analysis: result.analysis,
            completedAt: result.completedAt
          },
          message: 'Analysis completed successfully!',
          timeout: false
        };
      } catch (error) {
        console.error('Error waiting for analysis result:', error);
        return {
          success: false,
          result: null,
          message: `Error waiting for result: ${error.message}`,
          timeout: false
        };
      }
    }
  }
};

// Webhook endpoint handler
export const handleTelegramWebhook = async (req: any, res: any) => {
  try {
    await telegramBridge.handleWebhook(req.body);
    res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Cleanup job (run periodically)
export const cleanupOldRequests = () => {
  telegramBridge.cleanup();
  console.log('🧹 Cleaned up old Telegram bridge requests');
};

export default telegramBridgeResolvers;