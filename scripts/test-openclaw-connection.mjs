#!/usr/bin/env node

/**
 * Test External OpenClaw API Connection
 * Tests connectivity to the Hostinger VPS OpenClaw instance
 */

const EXTERNAL_OPENCLAW_URL = 'https://openclaw-vnpa.srv1484467.hstgr.cloud';

async function testExternalOpenClaw() {
  console.log('🔍 Testing External OpenClaw API Connection...');
  console.log(`Target: ${EXTERNAL_OPENCLAW_URL}`);
  console.log('=' .repeat(60));

  // Test 1: Basic connectivity
  console.log('\n1. Testing basic connectivity...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${EXTERNAL_OPENCLAW_URL}/`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`   ✅ HTTP Status: ${response.status}`);
    console.log(`   ✅ Response OK: ${response.ok}`);
    
    if (response.status === 200) {
      console.log('   ✅ External OpenClaw is reachable!');
    }
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return false;
  }

  // Test 2: Check for API endpoints
  console.log('\n2. Testing API endpoints...');
  
  const endpoints = [
    '/api/status',
    '/api/sessions/list', 
    '/api/cron/status'
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${EXTERNAL_OPENCLAW_URL}${endpoint}`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`   ${response.ok ? '✅' : '❌'} ${endpoint}: ${response.status}`);
      
      if (response.status === 401) {
        console.log('     ℹ️  Requires authentication (expected)');
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint}: ${error.message}`);
    }
  }

  console.log('\n🎯 Integration Plan:');
  console.log('   1. ✅ External OpenClaw instance is reachable');
  console.log('   2. 🔑 Need to configure authentication token');
  console.log('   3. 🚀 API integration can proceed');
  console.log('   4. 📊 Cron dashboard → External OpenClaw agent calls');

  return true;
}

async function main() {
  try {
    await testExternalOpenClaw();
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 NEXT STEPS FOR API INTEGRATION:');
    console.log('');
    console.log('1. Configure OpenClaw auth token in cron dashboard');
    console.log('2. Update GraphQL mutations to use external instance');
    console.log('3. Test agent communication from dashboard');
    console.log('4. Implement real-time WebSocket bridge');
    console.log('5. Add intelligent cron job analysis features');
    console.log('');
    console.log('✨ Your cron dashboard will have AI-powered optimization!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();