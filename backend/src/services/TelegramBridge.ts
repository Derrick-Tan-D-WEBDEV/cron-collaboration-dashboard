import { v4 as uuidv4 } from 'uuid';

export interface AnalysisRequest {
  id: string;
  timestamp: string;
  type: 'CRON_ANALYSIS' | 'SCHEDULE_OPTIMIZATION' | 'FAILURE_PREDICTION';
  jobData: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  dashboardUrl?: string;
}

export interface AnalysisResult {
  id: string;
  requestId: string;
  status: 'COMPLETED' | 'ERROR';
  analysis?: any;
  error?: string;
  completedAt: string;
}

export class TelegramBridge {
  private botToken: string;
  private chatId: string;
  private pendingRequests = new Map<string, AnalysisRequest>();
  private results = new Map<string, AnalysisResult>();

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  /**
   * Send analysis request to OpenClaw via Telegram
   */
  async requestAnalysis(jobData: any, type: AnalysisRequest['type'] = 'CRON_ANALYSIS'): Promise<string> {
    const request: AnalysisRequest = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type,
      jobData,
      status: 'PENDING',
      dashboardUrl: process.env.DASHBOARD_URL
    };

    this.pendingRequests.set(request.id, request);

    const message = `🤖 **OPENCLAW_ANALYSIS_REQUEST**

\`\`\`json
${JSON.stringify(request, null, 2)}
\`\`\`

Please analyze this cron job data and respond with OPENCLAW_ANALYSIS_RESULT format.`;

    await this.sendTelegramMessage(message);
    
    console.log(`📤 Analysis request sent: ${request.id}`);
    return request.id;
  }

  /**
   * Send message to Telegram
   */
  private async sendTelegramMessage(text: string): Promise<void> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw error;
    }
  }

  /**
   * Process incoming Telegram webhook (OpenClaw response)
   */
  async handleWebhook(telegramUpdate: any): Promise<void> {
    const message = telegramUpdate.message;
    if (!message?.text) return;

    // Check if this is an analysis result from OpenClaw
    if (message.text.includes('OPENCLAW_ANALYSIS_RESULT')) {
      try {
        const jsonMatch = message.text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[1]);
          await this.processAnalysisResult(result);
        }
      } catch (error) {
        console.error('Failed to parse OpenClaw analysis result:', error);
      }
    }
  }

  /**
   * Process analysis result from OpenClaw
   */
  private async processAnalysisResult(result: any): Promise<void> {
    const analysisResult: AnalysisResult = {
      id: uuidv4(),
      requestId: result.requestId || result.id,
      status: 'COMPLETED',
      analysis: result,
      completedAt: new Date().toISOString()
    };

    this.results.set(analysisResult.requestId, analysisResult);
    
    // Update request status
    const request = this.pendingRequests.get(analysisResult.requestId);
    if (request) {
      request.status = 'COMPLETED';
      this.pendingRequests.set(request.id, request);
    }

    console.log(`📥 Analysis result received: ${analysisResult.requestId}`);
    
    // Emit to WebSocket clients if available
    this.emitResult(analysisResult);
  }

  /**
   * Get analysis result by request ID
   */
  getResult(requestId: string): AnalysisResult | null {
    return this.results.get(requestId) || null;
  }

  /**
   * Poll for result with timeout
   */
  async pollForResult(requestId: string, timeoutMs: number = 30000): Promise<AnalysisResult | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const result = this.getResult(requestId);
      if (result) {
        return result;
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return null; // Timeout
  }

  /**
   * Get pending requests (for admin/debug)
   */
  getPendingRequests(): AnalysisRequest[] {
    return Array.from(this.pendingRequests.values())
      .filter(req => req.status === 'PENDING');
  }

  /**
   * Get all results (for admin/debug)
   */
  getAllResults(): AnalysisResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Emit result to WebSocket clients (to be implemented)
   */
  private emitResult(result: AnalysisResult): void {
    // This would integrate with your WebSocket/SSE implementation
    console.log(`🔔 Result ready for frontend: ${result.requestId}`);
  }

  /**
   * Cleanup old requests and results
   */
  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): void { // 24 hours
    const cutoff = Date.now() - maxAgeMs;
    
    for (const [id, request] of this.pendingRequests.entries()) {
      if (new Date(request.timestamp).getTime() < cutoff) {
        this.pendingRequests.delete(id);
      }
    }

    for (const [id, result] of this.results.entries()) {
      if (new Date(result.completedAt).getTime() < cutoff) {
        this.results.delete(id);
      }
    }
  }
}

export default TelegramBridge;