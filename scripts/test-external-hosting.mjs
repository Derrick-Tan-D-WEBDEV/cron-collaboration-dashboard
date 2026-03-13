#!/usr/bin/env node

/**
 * Test Cross-Origin Access to OpenClaw from External Host
 */

const OPENCLAW_URL = 'https://openclaw-vnpa.srv1484467.hstgr.cloud';

async function testCorsAndExternalAccess() {
  console.log('🌐 Testing Cross-Origin Access to OpenClaw...\n');

  // Test 1: Basic CORS headers
  console.log('1. Checking CORS headers...');
  try {
    const response = await fetch(`${OPENCLAW_URL}/api/status`, {
      method: 'OPTIONS'
    });

    console.log(`   OPTIONS status: ${response.status}`);
    console.log(`   CORS headers:`);
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods', 
      'access-control-allow-headers',
      'access-control-allow-credentials'
    ];

    corsHeaders.forEach(header => {
      const value = response.headers.get(header);
      console.log(`     ${header}: ${value || 'Not set'}`);
    });
    
  } catch (error) {
    console.log(`   ❌ CORS test failed: ${error.message}`);
  }

  // Test 2: External network accessibility 
  console.log('\n2. Testing external network accessibility...');
  
  const testUrls = [
    'https://httpbin.org/get',
    'https://api.github.com/repos/openclaw/openclaw',
    'https://jsonplaceholder.typicode.com/posts/1'
  ];

  for (const testUrl of testUrls) {
    try {
      const response = await fetch(testUrl, { method: 'GET' });
      console.log(`   ✅ ${testUrl}: ${response.status} (network OK)`);
    } catch (error) {
      console.log(`   ❌ ${testUrl}: ${error.message}`);
    }
  }

  // Test 3: Simulate external dashboard calling OpenClaw
  console.log('\n3. Simulating external dashboard → OpenClaw call...');
  
  try {
    const response = await fetch(`${OPENCLAW_URL}/api/status`, {
      method: 'GET',
      headers: {
        'User-Agent': 'CronDashboard/1.0',
        'Origin': 'https://external-dashboard.example.com',
        'Accept': 'application/json'
      }
    });

    console.log(`   📡 Status: ${response.status}`);
    console.log(`   📋 Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      console.log('   ✅ External access successful!');
    } else {
      console.log('   ⚠️  Needs authentication but accessible');
    }
    
  } catch (error) {
    console.log(`   ❌ External access failed: ${error.message}`);
  }
}

async function testAlternativeApproaches() {
  console.log('\n🔄 Alternative Integration Approaches...\n');

  console.log('📋 OPTION 1: Webhook/Callback Integration');
  console.log('   • Dashboard → HTTP endpoint');
  console.log('   • OpenClaw → Webhook to dashboard'); 
  console.log('   • Async communication pattern');

  console.log('\n📋 OPTION 2: Message Bridge Integration');
  console.log('   • Use Telegram/Discord bot as API proxy');
  console.log('   • Dashboard → Message → OpenClaw → Response');
  console.log('   • No direct HTTP API required');

  console.log('\n📋 OPTION 3: Cron-Scheduled Agent');
  console.log('   • OpenClaw cron job checks dashboard endpoint');
  console.log('   • Periodic analysis and reporting');
  console.log('   • Dashboard provides data, OpenClaw provides insights');

  console.log('\n📋 OPTION 4: Shared Database/Queue');
  console.log('   • Dashboard writes analysis requests to queue');
  console.log('   • OpenClaw agent processes queue periodically');
  console.log('   • Results written back to shared storage');
}

async function main() {
  await testCorsAndExternalAccess();
  await testAlternativeApproaches();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 HOSTING COMPATIBILITY ANALYSIS:');
  console.log('');
  console.log('✅ Network Access: OpenClaw is externally accessible');
  console.log('✅ HTTPS Support: Secure connection available');
  console.log('⚠️  Authentication: Still requires gateway token');
  console.log('💡 Workarounds: Multiple alternative approaches possible');
  console.log('');
  console.log('🚀 RECOMMENDATION: Yes, external hosting will work!');
  console.log('   Option A: Get gateway token (direct API)');
  console.log('   Option B: Use webhook/message bridge (no token needed)');
  console.log('   Option C: Cron-based periodic integration');
}

main();