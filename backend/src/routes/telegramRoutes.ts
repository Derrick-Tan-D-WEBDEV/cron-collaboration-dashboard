import express from 'express';
import TelegramBridge from '../services/TelegramBridge.js';

const router = express.Router();

// Initialize Telegram bridge (you'd do this in your main app)
const telegramBridge = new TelegramBridge(
  process.env.TELEGRAM_BOT_TOKEN || '',
  process.env.OPENCLAW_CHAT_ID || ''
);

// Webhook endpoint for Telegram (OpenClaw responses come here)
router.post('/webhook/telegram', async (req, res) => {
  try {
    console.log('📥 Telegram webhook received:', req.body);
    
    await telegramBridge.handleWebhook(req.body);
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to manually send analysis request
router.post('/test/analysis', async (req, res) => {
  try {
    const { jobData } = req.body;
    
    const requestId = await telegramBridge.requestAnalysis(jobData);
    
    res.json({
      success: true,
      requestId,
      message: 'Analysis request sent via Telegram',
      checkResultUrl: `/api/telegram/result/${requestId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get analysis result
router.get('/result/:requestId', async (req, res) => {
  try {
    const result = telegramBridge.getResult(req.params.requestId);
    
    if (!result) {
      return res.json({
        found: false,
        message: 'Result not yet available or request not found'
      });
    }
    
    res.json({
      found: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Get bridge status
router.get('/status', async (req, res) => {
  try {
    const pending = telegramBridge.getPendingRequests();
    const results = telegramBridge.getAllResults();
    
    res.json({
      status: 'active',
      pendingRequests: pending.length,
      completedAnalyses: results.length,
      botToken: process.env.TELEGRAM_BOT_TOKEN ? 'configured' : 'missing',
      chatId: process.env.OPENCLAW_CHAT_ID ? 'configured' : 'missing'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

export default router;