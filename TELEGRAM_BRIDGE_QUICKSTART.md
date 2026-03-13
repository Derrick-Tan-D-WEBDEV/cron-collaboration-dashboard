# 🌉 Telegram Message Bridge - Quick Start Guide

## 🎯 Goal
Enable your Cron Dashboard to communicate with OpenClaw AI agents via Telegram messages, without requiring gateway tokens or direct API access.

## 🚀 Quick Setup (5 minutes)

### 1. Create Telegram Bot
```bash
# Message @BotFather on Telegram
/newbot
# Name: "Cron Dashboard Bot"  
# Username: "your_cron_dashboard_bot"
# Save the token: 123456789:ABCdefGHIjklMNOpqrSTUvwxyz
```

### 2. Get Chat ID
```bash
# Send message to your bot, then visit:
https://api.telegram.org/bot{YOUR_TOKEN}/getUpdates
# Copy the chat ID from the response
```

### 3. Environment Variables
```bash
# Add to your dashboard .env file:
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxyz
OPENCLAW_CHAT_ID=123456789
```

### 4. Test Integration
```bash
# Run the test script
node scripts/test-telegram-bridge.mjs
```

## 🔄 How It Works

### Message Flow
```
1. Dashboard → Telegram Message → OpenClaw Agent
2. OpenClaw Agent → Telegram Response → Dashboard  
3. Dashboard → Display AI Results
```

### Example Request Message
```
🤖 OPENCLAW_ANALYSIS_REQUEST

{
  "id": "12345",
  "type": "CRON_ANALYSIS", 
  "jobData": {
    "name": "Daily Backup",
    "schedule": "0 2 * * *",
    "performance": {
      "successRate": 85,
      "avgDuration": 720
    }
  }
}

Please analyze and respond with OPENCLAW_ANALYSIS_RESULT.
```

### Expected Response Format
```
🤖 OPENCLAW_ANALYSIS_RESULT

{
  "requestId": "12345",
  "analysis": {
    "recommendations": ["Move backup to 3:30 AM", "Use incremental backup"],
    "riskScore": 65,
    "optimizations": ["Parallel streams reduce time by 40%"]
  }
}
```

## 🎨 Frontend Integration

### React Component Usage
```tsx
import { TelegramBridgeDemo } from './components/TelegramBridgeDemo';

function Dashboard() {
  return (
    <div>
      <h1>Cron Dashboard</h1>
      <TelegramBridgeDemo />
    </div>
  );
}
```

### GraphQL Mutations
```graphql
# Send analysis request
mutation RequestCronAnalysis($jobData: JobDataInput!) {
  requestCronAnalysis(jobData: $jobData) {
    success
    requestId
    estimatedWaitTime
  }
}

# Get results
mutation WaitForResult($requestId: ID!) {
  waitForAnalysisResult(requestId: $requestId) {
    success
    result {
      analysis
      completedAt  
    }
  }
}
```

## 🛠️ API Endpoints

### Backend Routes
```typescript
// Webhook for OpenClaw responses
POST /api/telegram/webhook

// Test analysis request  
POST /api/telegram/test/analysis

// Get analysis result
GET /api/telegram/result/:requestId

// Bridge status
GET /api/telegram/status
```

## 🔧 Webhook Setup
```bash
# Set Telegram webhook to your dashboard
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -d "url=https://your-dashboard.com/api/telegram/webhook"
```

## ✅ Benefits

- **🔓 No Authentication Required** - No OpenClaw gateway token needed
- **🌍 External Hosting Ready** - Deploy dashboard anywhere  
- **⚡ Real-Time Analysis** - Async AI processing via messages
- **🤖 Full AI Capabilities** - Complete OpenClaw agent intelligence
- **📱 Simple Setup** - Just Telegram bot + webhook configuration

## 🧪 Testing

### 1. Manual Test
```bash
# Edit and run test script
node scripts/test-telegram-bridge.mjs
```

### 2. API Test  
```bash
# Test analysis endpoint
curl -X POST http://localhost:3001/api/telegram/test/analysis \
  -H "Content-Type: application/json" \
  -d '{"jobData": {"name": "test", "schedule": "0 2 * * *"}}'
```

### 3. Status Check
```bash
# Verify bridge status
curl http://localhost:3001/api/telegram/status
```

## 🚀 Production Deployment

1. **Deploy Dashboard** to any cloud provider (Vercel, Netlify, AWS, etc.)
2. **Configure Environment Variables** (bot token, chat ID)
3. **Set Webhook URL** to your production domain  
4. **Test Integration** with live OpenClaw agent
5. **Enable AI Features** in your dashboard UI

## 🎉 Result

Your cron dashboard now has **direct AI analysis capabilities** through OpenClaw agents, deployable anywhere without authentication requirements!

### Next Steps
- Add more analysis types (schedule optimization, failure prediction)
- Integrate real-time notifications for analysis completion
- Build dashboard UI components for displaying AI insights
- Scale to multiple concurrent analysis requests