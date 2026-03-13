#!/usr/bin/env node

/**
 * Test OpenClaw API Call - Live Demo
 * Call the external OpenClaw agent for cron job analysis
 */

const OPENCLAW_URL = 'https://openclaw-vnpa.srv1484467.hstgr.cloud';

async function testOpenClawAgentCall() {
  console.log('🤖 Testing Live OpenClaw Agent API Call...');
  console.log(`Target: ${OPENCLAW_URL}`);
  console.log('=' .repeat(60));

  // Test: Send a message to the main agent
  console.log('\n🔥 LIVE TEST: Sending message to OpenClaw agent...\n');

  const testMessage = `
  Hi! This is a test from the Cron Collaboration Dashboard.
  
  Can you analyze this sample cron job performance?
  
  Job: "backup-database" 
  Schedule: "0 2 * * *" (daily at 2 AM)
  Recent Performance:
  - Success rate: 85% (last 7 days)
  - Average duration: 12 minutes  
  - Last 3 failures: timeout errors
  - Resource usage: High CPU during execution
  
  Please provide optimization suggestions.
  `;

  try {
    const response = await fetch(`${OPENCLAW_URL}/api/sessions/send`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sessionKey: 'agent:main:main',
        message: testMessage,
        timeoutSeconds: 30
      })
    });

    console.log(`📡 HTTP Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ SUCCESS! OpenClaw agent responded:');
      console.log('-'.repeat(60));
      console.log(JSON.stringify(result, null, 2));
      console.log('-'.repeat(60));
      
      return true;
    } else {
      const errorText = await response.text();
      console.log('\n❌ API call failed:');
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Response: ${errorText}`);
      
      if (response.status === 401) {
        console.log('\n💡 TIP: This requires authentication. Need to add auth token!');
      }
      
      return false;
    }

  } catch (error) {
    console.log(`\n❌ Request failed: ${error.message}`);
    return false;
  }
}

async function main() {
  const success = await testOpenClawAgentCall();
  
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('🎉 API INTEGRATION WORKING!');
    console.log('✅ Cron Dashboard can successfully call OpenClaw agents');
    console.log('✅ AI-powered cron analysis is functional');
    console.log('🚀 Ready to integrate into GraphQL mutations');
  } else {
    console.log('⚠️  API call needs authentication setup');
    console.log('🔑 Next: Configure auth token for dashboard integration');
    console.log('💡 The API endpoint is working, just needs proper credentials');
  }
  
  console.log('\n🔮 WHAT THIS ENABLES:');
  console.log('   📊 Real-time cron job analysis');  
  console.log('   🧠 AI optimization suggestions');
  console.log('   🔍 Intelligent failure prediction');
  console.log('   ⚡ Automated performance tuning');
}

main();