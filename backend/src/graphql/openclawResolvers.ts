import { OpenClawService } from '../services/OpenClawService.js';

const openClawService = new OpenClawService();

export const openclawResolvers = {
  Query: {
    // Test OpenClaw connection
    openclawStatus: async () => {
      try {
        const isConnected = await openClawService.testConnection();
        const status = await openClawService.getOpenClawStatus();
        
        return {
          connected: isConnected,
          status: status,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        return {
          connected: false,
          status: { error: error.message },
          lastChecked: new Date().toISOString()
        };
      }
    },

    // Get AI suggestions for a job
    jobSuggestions: async (_, { jobId, issues }) => {
      try {
        const suggestions = await openClawService.getJobSuggestions(jobId, issues);
        return {
          jobId,
          suggestions,
          generatedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error getting job suggestions:', error);
        return {
          jobId,
          suggestions: ['Unable to generate suggestions at this time'],
          generatedAt: new Date().toISOString(),
          error: error.message
        };
      }
    }
  },

  Mutation: {
    // Analyze job performance with AI
    analyzeCronJob: async (_, { jobId, performanceData }) => {
      try {
        console.log(`Starting AI analysis for job ${jobId}`);
        
        const analysis = await openClawService.analyzeCronJob(jobId, performanceData);
        
        return {
          success: true,
          analysis: {
            ...analysis,
            analyzedAt: new Date().toISOString()
          }
        };
      } catch (error) {
        console.error('Error analyzing cron job:', error);
        return {
          success: false,
          error: error.message,
          analysis: null
        };
      }
    },

    // Optimize entire cron schedule
    optimizeCronSchedule: async (_, { jobs }) => {
      try {
        console.log(`Optimizing schedule for ${jobs.length} jobs`);
        
        const optimization = await openClawService.optimizeCronSchedule(jobs);
        
        return {
          success: true,
          optimization: {
            suggestions: optimization.result || 'No specific optimizations available',
            optimizedAt: new Date().toISOString(),
            jobCount: jobs.length
          }
        };
      } catch (error) {
        console.error('Error optimizing cron schedule:', error);
        return {
          success: false,
          error: error.message,
          optimization: null
        };
      }
    },

    // Predict potential failures
    predictJobFailures: async (_, { jobId, historicalData }) => {
      try {
        console.log(`Predicting failures for job ${jobId}`);
        
        const prediction = await openClawService.predictJobFailures({
          jobId,
          ...historicalData
        });
        
        return {
          success: true,
          prediction: {
            jobId,
            analysis: prediction.result || 'No failure predictions available',
            predictedAt: new Date().toISOString(),
            confidence: 0.8 // Default confidence, would be parsed from AI response
          }
        };
      } catch (error) {
        console.error('Error predicting job failures:', error);
        return {
          success: false,
          error: error.message,
          prediction: null
        };
      }
    },

    // Send custom message to OpenClaw agent
    sendToOpenClawAgent: async (_, { message, sessionKey }) => {
      try {
        console.log('Sending message to OpenClaw agent:', message.substring(0, 100));
        
        const response = await openClawService.sendToAgent(
          message, 
          sessionKey || 'agent:main:main'
        );
        
        return {
          success: true,
          response: {
            message: response.result || response.message || 'Message sent successfully',
            sentAt: new Date().toISOString(),
            sessionKey: sessionKey || 'agent:main:main'
          }
        };
      } catch (error) {
        console.error('Error sending message to OpenClaw:', error);
        return {
          success: false,
          error: error.message,
          response: null
        };
      }
    },

    // Spawn specialized agent for complex analysis
    spawnAnalysisAgent: async (_, { task, agentType }) => {
      try {
        console.log(`Spawning ${agentType} agent for task:`, task.substring(0, 100));
        
        const result = await openClawService.spawnCronAgent(task, agentType);
        
        return {
          success: true,
          result: {
            agentType,
            taskId: result.sessionKey || 'unknown',
            analysis: result.result || 'Agent spawned successfully',
            completedAt: new Date().toISOString()
          }
        };
      } catch (error) {
        console.error('Error spawning analysis agent:', error);
        return {
          success: false,
          error: error.message,
          result: null
        };
      }
    }
  }
};

export default openclawResolvers;