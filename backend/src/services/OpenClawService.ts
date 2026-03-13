import fetch from 'node-fetch';
import { config as appConfig } from '../utils/config.js';

export interface OpenClawConfig {
  gatewayUrl: string;
  httpUrl: string;
  defaultTimeout: number;
  authToken?: string;
}

export interface CronJobAnalysis {
  jobId: string;
  recommendations: string[];
  optimizations: string[];
  predictions: any[];
  riskScore: number;
}

export class OpenClawService {
  private config: OpenClawConfig;

  constructor(config?: Partial<OpenClawConfig>) {
    this.config = {
      gatewayUrl: appConfig.openclaw.gatewayUrl,
      httpUrl: appConfig.openclaw.httpUrl,
      defaultTimeout: appConfig.openclaw.defaultTimeout,
      authToken: appConfig.openclaw.authToken,
      ...config
    };
  }

  /**
   * Send message to OpenClaw agent for analysis
   */
  async sendToAgent(message: string, sessionKey: string = 'agent:main:main'): Promise<any> {
    try {
      const headers: any = { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Add auth token if available
      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

      const response = await fetch(`${this.config.httpUrl}/api/sessions/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionKey,
          message,
          timeoutSeconds: this.config.defaultTimeout
        })
      });

      if (!response.ok) {
        throw new Error(`OpenClaw API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send message to OpenClaw agent:', error);
      throw error;
    }
  }

  /**
   * Spawn specialized cron analysis agent
   */
  async spawnCronAgent(task: string, agentId: string = 'cron-optimizer'): Promise<any> {
    try {
      const response = await fetch(`${this.config.httpUrl}/api/sessions/spawn`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          runtime: 'subagent',
          mode: 'run',
          task,
          agentId,
          timeoutSeconds: 120,
          cleanup: 'delete'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to spawn cron agent: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to spawn cron agent:', error);
      throw error;
    }
  }

  /**
   * Analyze cron job performance with AI
   */
  async analyzeCronJob(jobId: string, performanceData: any): Promise<CronJobAnalysis> {
    const analysisPrompt = `
    Analyze this cron job performance data and provide optimization insights:
    
    Job ID: ${jobId}
    Performance Data: ${JSON.stringify(performanceData, null, 2)}
    
    Please analyze and provide:
    1. Performance optimization recommendations (specific and actionable)
    2. Reliability improvement suggestions  
    3. Timing optimization analysis
    4. Resource usage insights
    5. Risk assessment score (0-100, where 100 is highest risk)
    
    Format your response as JSON:
    {
      "recommendations": ["recommendation1", "recommendation2"],
      "optimizations": ["optimization1", "optimization2"], 
      "predictions": [{"type": "timing", "confidence": 0.8, "details": "..."}],
      "riskScore": 25
    }
    `;

    const result = await this.spawnCronAgent(analysisPrompt);
    
    // Parse AI response and structure it
    try {
      const analysis = JSON.parse(result.result || '{}');
      return {
        jobId,
        recommendations: analysis.recommendations || [],
        optimizations: analysis.optimizations || [],
        predictions: analysis.predictions || [],
        riskScore: analysis.riskScore || 0
      };
    } catch (error) {
      console.error('Failed to parse OpenClaw analysis:', error);
      return {
        jobId,
        recommendations: ['Analysis parsing failed - check OpenClaw response format'],
        optimizations: [],
        predictions: [],
        riskScore: 50
      };
    }
  }

  /**
   * Optimize entire cron schedule
   */
  async optimizeCronSchedule(jobs: any[]): Promise<any> {
    const optimizationPrompt = `
    Optimize this cron schedule for better resource usage and reliability:
    
    Current Jobs: ${JSON.stringify(jobs, null, 2)}
    
    Consider:
    - Load balancing across time periods
    - Resource conflict minimization  
    - Priority-based scheduling
    - Failure recovery optimization
    - Performance bottleneck identification
    
    Provide optimized schedule suggestions with reasoning.
    `;

    return await this.spawnCronAgent(optimizationPrompt);
  }

  /**
   * Predict potential job failures
   */
  async predictJobFailures(historicalData: any): Promise<any> {
    const predictionPrompt = `
    Analyze historical cron job data to predict potential failures:
    
    Historical Data: ${JSON.stringify(historicalData, null, 2)}
    
    Provide:
    1. Failure probability analysis for each job
    2. Risk factors identification
    3. Preventive action recommendations  
    4. Monitoring alerts configuration suggestions
    5. Timeline predictions for potential issues
    
    Format as actionable insights with confidence scores.
    `;

    return await this.spawnCronAgent(predictionPrompt);
  }

  /**
   * Get OpenClaw system status
   */
  async getOpenClawStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.config.httpUrl}/api/status`);
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get OpenClaw status:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * Test connection to OpenClaw
   */
  async testConnection(): Promise<boolean> {
    try {
      const status = await this.getOpenClawStatus();
      return status.available !== false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get intelligent suggestions for cron job issues
   */
  async getJobSuggestions(jobId: string, issues: string[]): Promise<string[]> {
    const suggestionPrompt = `
    Provide intelligent suggestions for resolving cron job issues:
    
    Job ID: ${jobId}
    Issues: ${issues.join(', ')}
    
    Provide specific, actionable suggestions to resolve these issues.
    `;

    const result = await this.spawnCronAgent(suggestionPrompt);
    
    // Extract suggestions from AI response
    try {
      const suggestions = JSON.parse(result.result || '[]');
      return Array.isArray(suggestions) ? suggestions : [result.result];
    } catch (error) {
      return [result.result || 'Unable to generate suggestions'];
    }
  }
}

export default OpenClawService;