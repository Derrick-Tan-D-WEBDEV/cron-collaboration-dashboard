#!/usr/bin/env node

/**
 * Test Telegram Bridge Integration
 * This simulates how your dashboard will communicate with OpenClaw
 */

// Configuration (replace with your actual values)
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const OPENCLAW_CHAT_ID = 'YOUR_CHAT_ID_HERE';
const DASHBOARD_URL = 'https://your-dashboard.com';

async function testTelegramBridge() {
  console.log('🤖 Testing Telegram Message Bridge Integration...\n');

  // Step 1: Send analysis request to Telegram group
  console.log('📤 Step 1: Sending analysis request via Telegram...');
  
  const analysisRequest = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    type: 'CRON_ANALYSIS',
    jobData: {
      name: 'Daily Database Backup',
      schedule: '0 2 * * *',
      performance: {
        successRate: 85,
        avgDuration: 720,
        recentFailures: ['timeout', 'timeout', 'disk_full']
      }
    }
  };

  const message = `🤖 **OPENCLAW_ANALYSIS_REQUEST**

\`\`\`json
${JSON.stringify(analysisRequest, null, 2)}
\`\`\`

@OpenClaw_Agent please analyze this cron job and respond with optimization suggestions in OPENCLAW_ANALYSIS_RESULT format.`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: OPENCLAW_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (response.ok) {
      console.log('✅ Analysis request sent successfully!');
      console.log(`   Request ID: ${analysisRequest.id}`);
      console.log('   📱 Check Telegram group for OpenClaw response\n');
    } else {
      console.log('❌ Failed to send Telegram message');
      console.log('   Check bot token and chat ID configuration\n');
      return;
    }
  } catch (error) {
    console.log(`❌ Telegram API error: ${error.message}\n`);
    return;
  }

  // Step 2: Simulate what OpenClaw agent would respond
  console.log('📥 Step 2: Expected OpenClaw agent response...');
  
  const expectedResponse = `🤖 **OPENCLAW_ANALYSIS_RESULT**

\`\`\`json
{
  "requestId": "${analysisRequest.id}",
  "analysis": {
    "recommendations": [
      "Move backup to 3:30 AM to avoid peak I/O times",
      "Implement incremental backup strategy to reduce duration", 
      "Add compression to reduce disk space usage"
    ],
    "optimizations": [
      "Use parallel backup streams to reduce time by ~40%",
      "Implement table-level locking instead of full database lock"
    ],
    "predictions": [
      {
        "type": "failure_risk",
        "confidence": 0.75,
        "details": "High probability of timeout failures due to growing database size"
      }
    ],
    "riskScore": 65
  },
  "completedAt": "${new Date().toISOString()}"
}
\`\`\``;

  console.log('Expected response format:');
  console.log(expectedResponse);

  // Step 3: Instructions for dashboard
  console.log('\n📋 Step 3: Dashboard Integration Instructions...');
  console.log('');
  console.log('1. 🔧 Configure webhook endpoint: /api/telegram/webhook');
  console.log('2. 📱 Set Telegram webhook URL: https://api.telegram.org/bot{TOKEN}/setWebhook');
  console.log('3. 🔄 Dashboard polls for results or receives webhook notifications');
  console.log('4. 🎨 Display AI analysis in your dashboard UI');
  console.log('');
  
  console.log('🎯 Complete Integration Flow:');
  console.log('   Dashboard → Telegram API → OpenClaw Agent → Telegram Webhook → Dashboard');
  console.log('');
  console.log('✨ Benefits:');
  console.log('   • No OpenClaw authentication required');
  console.log('   • Works from external hosting');
  console.log('   • Real-time AI analysis');
  console.log('   • Async processing');
}

async function showConfiguration() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 CONFIGURATION CHECKLIST');
  console.log('');
  console.log('Required Environment Variables:');
  console.log(`TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}`);
  console.log(`OPENCLAW_CHAT_ID=${OPENCLAW_CHAT_ID}`);
  console.log('');
  console.log('Webhook Setup:');
  console.log(`curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \\`);
  console.log(`  -d "url=${DASHBOARD_URL}/api/telegram/webhook"`);
  console.log('');
  console.log('Test Commands:');
  console.log('1. Send test request: node test-telegram-bridge.mjs');
  console.log('2. Check webhook: curl https://your-dashboard.com/api/telegram/status');
  console.log('3. Manual analysis: curl -X POST https://your-dashboard.com/api/telegram/test/analysis');
}

async function main() {
  if (TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
    console.log('⚠️  Please configure TELEGRAM_BOT_TOKEN and OPENCLAW_CHAT_ID first!');
    console.log('Edit this script and replace the placeholder values.\n');
    await showConfiguration();
    return;
  }

  await testTelegramBridge();
  await showConfiguration();
}

main();