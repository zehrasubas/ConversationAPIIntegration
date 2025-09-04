#!/usr/bin/env node

/**
 * Test Script for Facebook Messenger Integration
 * Tests bidirectional messaging functionality
 */

const readline = require('readline');

// Setup readline interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

async function testWebhookEndpoint() {
  console.log('\n📡 Testing Webhook Endpoint...');

  const domain = process.env.VERCEL_URL || process.env.APP_DOMAIN;
  if (!domain) {
    console.log('❌ No domain configured. Set VERCEL_URL or APP_DOMAIN environment variable.');
    return false;
  }

  try {
    const testUrl = `https://${domain}/api/webhook`;
    log(`Testing: ${testUrl}`);

    // Test GET request (webhook verification)
    const response = await fetch(testUrl);
    const data = await response.text();

    log(`Response: ${response.status} - ${data.substring(0, 100)}...`);

    if (response.status === 200) {
      console.log('✅ Webhook endpoint is accessible');
      return true;
    } else {
      console.log('❌ Webhook endpoint returned error');
      return false;
    }
  } catch (error) {
    console.log(`❌ Webhook test failed: ${error.message}`);
    return false;
  }
}

async function testMessageSend(testMessage = 'Test message from script') {
  console.log('\n📤 Testing Message Send...');

  const domain = process.env.VERCEL_URL || process.env.APP_DOMAIN;
  const testUserId = `test_user_${Date.now()}`;

  try {
    const response = await fetch(`https://${domain}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        userId: testUserId
      })
    });

    const data = await response.json();

    log(`Send Response: ${response.status}`);
    log(`Data: ${JSON.stringify(data, null, 2)}`);

    if (response.status === 200 && data.success) {
      console.log('✅ Message send endpoint working');
      return { success: true, userId: testUserId, messageId: data.messageId };
    } else {
      console.log('❌ Message send failed');
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Send test failed: ${error.message}`);
    return { success: false };
  }
}

async function testMessageHistory(userId) {
  console.log('\n📋 Testing Message History...');

  const domain = process.env.VERCEL_URL || process.env.APP_DOMAIN;

  try {
    const response = await fetch(`https://${domain}/api/messages/history?userId=${userId}`);
    const data = await response.json();

    log(`History Response: ${response.status}`);
    log(`Messages found: ${data.messages ? data.messages.length : 'none'}`);

    if (data.messages && data.messages.length > 0) {
      console.log('✅ Message history retrieval working');
      data.messages.forEach((msg, index) => {
        log(`Message ${index + 1}: [${msg.sender}] ${msg.text}`);
      });
      return true;
    } else {
      console.log('⚠️ No messages found in history (this might be expected for a test user)');
      return true; // This is not necessarily an error
    }
  } catch (error) {
    console.log(`❌ History test failed: ${error.message}`);
    return false;
  }
}

async function interactiveTest() {
  console.log('\n🎮 Starting Interactive Test...');
  console.log('Type messages to test the system. Type "quit" to exit.');

  const domain = process.env.VERCEL_URL || process.env.APP_DOMAIN;
  const testUserId = `interactive_test_${Date.now()}`;

  console.log(`\n🆔 Test User ID: ${testUserId}`);
  console.log(`📡 Using domain: ${domain}\n`);

  const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  while (true) {
    const input = await askQuestion('💬 Enter message (or "quit"): ');

    if (input.toLowerCase() === 'quit') {
      break;
    }

    if (!input.trim()) {
      continue;
    }

    // Send message
    log(`Sending: "${input}"`);
    const sendResult = await testMessageSend(input);

    if (sendResult.success) {
      // Check message history
      setTimeout(async () => {
        await testMessageHistory(testUserId);
      }, 1000);
    }
  }
}

async function runTests() {
  console.log('🧪 Facebook Messenger Integration Test Suite\n');

  // Check environment
  console.log('🔧 Environment Check:');
  console.log(`VERCEL_URL: ${process.env.VERCEL_URL || 'Not set'}`);
  console.log(`APP_DOMAIN: ${process.env.APP_DOMAIN || 'Not set'}`);
  console.log(`PAGE_ACCESS_TOKEN: ${process.env.PAGE_ACCESS_TOKEN ? 'Set' : 'Not set'}`);
  console.log(`VERIFY_TOKEN: ${process.env.VERIFY_TOKEN ? 'Set' : 'Not set'}`);

  if (!process.env.VERCEL_URL && !process.env.APP_DOMAIN) {
    console.log('\n❌ No domain configured. Please set VERCEL_URL or APP_DOMAIN environment variable.');
    console.log('Example: export VERCEL_URL="your-app.vercel.app"');
    return;
  }

  // Run tests
  const webhookOk = await testWebhookEndpoint();
  const sendResult = await testMessageSend();

  if (sendResult.success) {
    await testMessageHistory(sendResult.userId);
  }

  console.log('\n📊 Test Summary:');
  console.log(`Webhook: ${webhookOk ? '✅' : '❌'}`);
  console.log(`Send: ${sendResult.success ? '✅' : '❌'}`);

  // Ask if user wants interactive test
  const runInteractive = await new Promise((resolve) => {
    rl.question('\n🎮 Run interactive test? (y/n): ', (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });

  if (runInteractive) {
    await interactiveTest();
  }

  rl.close();
  console.log('\n✅ Tests complete!');
}

// Handle fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWebhookEndpoint, testMessageSend, testMessageHistory };
