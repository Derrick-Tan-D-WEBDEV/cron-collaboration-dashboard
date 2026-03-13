#!/usr/bin/env node

/**
 * Discover Public/Unauthenticated OpenClaw Endpoints
 */

const OPENCLAW_URL = 'https://openclaw-vnpa.srv1484467.hstgr.cloud';

async function checkPublicEndpoints() {
  console.log('🔍 Checking for Public OpenClaw Endpoints...\n');

  const publicEndpoints = [
    '/',
    '/api',
    '/api/public',
    '/api/health', 
    '/api/ping',
    '/api/status/public',
    '/api/info',
    '/api/version',
    '/webhooks',
    '/api/webhooks',
    '/api/callbacks',
    '/api/cron/public',
    '/api/sessions/public',
    '/.well-known/health',
    '/health',
    '/ping',
    '/status'
  ];

  console.log('Testing endpoints that might not require authentication:\n');

  for (const endpoint of publicEndpoints) {
    try {
      const response = await fetch(`${OPENCLAW_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      
      if (response.ok && isJson) {
        console.log(`✅ ${endpoint}: ${response.status} (JSON response!)`);
        
        try {
          const data = await response.json();
          console.log(`   📄 Response: ${JSON.stringify(data).substring(0, 200)}...\n`);
        } catch (e) {
          console.log(`   📄 Valid JSON endpoint\n`);
        }
      } else if (response.ok) {
        console.log(`⚠️  ${endpoint}: ${response.status} (${contentType || 'unknown type'})`);
      } else {
        console.log(`❌ ${endpoint}: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

async function checkWebhookSupport() {
  console.log('\n🔗 Checking for Webhook/Callback Support...\n');
  
  // Test if OpenClaw supports incoming webhooks
  try {
    const response = await fetch(`${OPENCLAW_URL}/api/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test: 'webhook_discovery',
        from: 'cron-dashboard'
      })
    });

    console.log(`Webhook POST test: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Webhook endpoint might be available!');
    } else if (response.status === 404) {
      console.log('❌ No webhook endpoint found');
    } else {
      console.log(`⚠️  Webhook endpoint exists but returned: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Webhook test failed: ${error.message}`);
  }
}

async function main() {
  await checkPublicEndpoints();
  await checkWebhookSupport();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 ALTERNATIVE INTEGRATION OPTIONS:');
  console.log('');
  console.log('1. 🔓 Public Endpoints: Check above for any unauthenticated APIs');
  console.log('2. 🔗 Webhook Integration: Reverse flow - OpenClaw calls dashboard');
  console.log('3. 📧 Email/Message Bridge: Use messaging channels as API proxy'); 
  console.log('4. 🤖 Cron Job Agent: Spawn agents that report back to dashboard');
  console.log('5. 🌐 Gateway Token: Still the most direct approach');
}

main();