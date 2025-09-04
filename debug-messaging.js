#!/usr/bin/env node

/**
 * Facebook Messenger Integration Debug Script
 * This script helps diagnose bidirectional messaging issues
 */

const https = require('https');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...values] = line.split('=');
        const value = values.join('=');
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    console.log('✅ Loaded environment variables from .env file');
  } else {
    console.log('⚠️  No .env file found, using system environment variables only');
  }
}

// Initialize environment
loadEnvFile();

// Color codes for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsedData, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runDiagnostics() {
    log('cyan', '🔍 Facebook Messenger Integration Diagnostics\n');

    // Check required environment variables
    log('blue', '1. Checking Environment Variables:');
    const requiredEnvVars = [
        'APP_DOMAIN',
        'FACEBOOK_LOGIN_APP_ID',
        'FACEBOOK_APP_ID',
        'FACEBOOK_APP_SECRET',
        'PAGE_ACCESS_TOKEN',
        'PAGE_ID',
        'VERIFY_TOKEN'
    ];

    let missingVars = [];
    requiredEnvVars.forEach(envVar => {
        if (process.env[envVar]) {
            log('green', `   ✅ ${envVar}: Set`);
        } else {
            log('red', `   ❌ ${envVar}: Missing`);
            missingVars.push(envVar);
        }
    });

    if (missingVars.length > 0) {
        log('red', `\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
        log('yellow', 'Please add these to your Vercel environment variables or .env file');
        return;
    }

    const domain = process.env.APP_DOMAIN || process.env.VERCEL_URL;
    const pageAccessToken = process.env.PAGE_ACCESS_TOKEN;
    const pageId = process.env.PAGE_ID;
    const verifyToken = process.env.VERIFY_TOKEN;

    log('blue', '\n2. Testing Webhook Endpoint:');

    // Test webhook verification
    try {
        const webhookUrl = `https://${domain}/api/webhook`;
        log('cyan', `   Testing: GET ${webhookUrl}`);

        const options = {
            hostname: domain.replace('https://', '').replace('http://', ''),
            port: 443,
            path: `/api/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test123`,
            method: 'GET'
        };

        const response = await makeRequest(options);

        if (response.status === 200 && response.data === 'test123') {
            log('green', '   ✅ Webhook verification working correctly');
        } else {
            log('red', `   ❌ Webhook verification failed: ${response.status} - ${response.data}`);
        }
    } catch (error) {
        log('red', `   ❌ Webhook test error: ${error.message}`);
    }

    log('blue', '\n3. Testing Facebook Graph API Access:');

    // Test Page Access Token
    try {
        log('cyan', '   Testing Page Access Token...');
        const options = {
            hostname: 'graph.facebook.com',
            port: 443,
            path: `/v19.0/me?access_token=${pageAccessToken}`,
            method: 'GET'
        };

        const response = await makeRequest(options);

        if (response.status === 200 && response.data.id) {
            log('green', `   ✅ Page Access Token valid - Page ID: ${response.data.id}`);
            log('cyan', `   Page Name: ${response.data.name || 'N/A'}`);

            if (response.data.id !== pageId) {
                log('yellow', `   ⚠️  Warning: TOKEN page ID (${response.data.id}) doesn't match PAGE_ID env var (${pageId})`);
            }
        } else {
            log('red', `   ❌ Invalid Page Access Token: ${response.status} - ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        log('red', `   ❌ Facebook API test error: ${error.message}`);
    }

    log('blue', '\n4. Testing Message Send Endpoint:');

    try {
        log('cyan', '   Testing local message send API...');
        const options = {
            hostname: domain.replace('https://', '').replace('http://', ''),
            port: 443,
            path: '/api/messages/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const testData = {
            message: 'Test message from debug script',
            userId: 'test_user_123'
        };

        const response = await makeRequest(options, testData);
        log('cyan', `   Response: ${response.status} - ${JSON.stringify(response.data, null, 2)}`);

        if (response.status === 200) {
            log('green', '   ✅ Message send endpoint working');
        } else {
            log('red', '   ❌ Message send endpoint failed');
        }
    } catch (error) {
        log('red', `   ❌ Message send test error: ${error.message}`);
    }

    log('blue', '\n5. Facebook App Configuration Check:');
    log('cyan', '   Manual checks needed:');
    log('white', '   • Go to https://developers.facebook.com/apps/');
    log('white', `   • Check Login App (${process.env.FACEBOOK_LOGIN_APP_ID}): Valid OAuth redirect URIs`);
    log('white', `   • Check Messenger App (${process.env.FACEBOOK_APP_ID}): Webhook URL configured`);
    log('white', `   • Webhook URL should be: https://${domain}/api/webhook`);
    log('white', `   • Verify Token should match: ${verifyToken}`);
    log('white', '   • Webhook should be subscribed to: messages, messaging_postbacks');

    log('blue', '\n6. Common Issues & Solutions:');
    log('yellow', '   Issue: Messages from Facebook don\'t appear on website');
    log('white', '   - Check webhook is properly configured and verified');
    log('white', '   - Ensure webhook URL is publicly accessible');
    log('white', '   - Check server logs for incoming webhook calls');

    log('yellow', '\n   Issue: Website messages don\'t reach Facebook');
    log('white', '   - User must message your Facebook Page first (24-hour messaging window)');
    log('white', '   - Check Page Access Token has correct permissions');
    log('white', '   - Ensure using correct PSID (Page-Scoped ID)');

    log('blue', '\n🔧 Next Steps:');
    log('white', '1. Fix any missing environment variables');
    log('white', '2. Test webhook manually in Facebook Developer Console');
    log('white', '3. Send a test message from Facebook Page to your website');
    log('white', '4. Check browser console and server logs for errors');
    log('white', '5. Use Facebook\'s Webhook Testing tool');

    log('green', '\n✅ Diagnostics complete!');
}

if (require.main === module) {
    runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics };
