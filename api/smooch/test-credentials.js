// Test Zendesk Sunshine Conversations API credentials
const fetch = require('node-fetch');

export default async function handler(req, res) {
  console.log('🧪 Testing Sunshine Conversations API credentials');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get credentials
    const appId = process.env.ZENDESK_SUNSHINE_APP_ID;
    const keyId = process.env.ZENDESK_SUNSHINE_KEY_ID;
    const secret = process.env.ZENDESK_SUNSHINE_SECRET;

    console.log('🔧 Credentials check:');
    console.log('  - App ID:', appId);
    console.log('  - Key ID:', keyId);
    console.log('  - Secret:', secret ? '[HIDDEN]' : 'NOT SET');

    if (!appId || !keyId || !secret) {
      return res.status(400).json({
        error: 'Missing credentials',
        missing: {
          appId: !appId,
          keyId: !keyId,
          secret: !secret
        }
      });
    }

    // Test basic API access - try to get app info
    const authString = `${keyId}:${secret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    
    const subdomain = process.env.ZENDESK_SUBDOMAIN || 'your-subdomain';
    const testUrl = `https://${subdomain}.zendesk.com/sc/v2/apps/${appId}`;
    
    console.log('🔧 Testing URL:', testUrl);
    console.log('🔧 Auth header (first 20 chars):', authHeader.substring(0, 20) + '...');

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    if (response.ok) {
      res.status(200).json({
        success: true,
        message: 'Credentials are valid',
        appInfo: JSON.parse(responseText)
      });
    } else {
      res.status(response.status).json({
        success: false,
        error: `API returned ${response.status}`,
        details: responseText,
        suggestions: [
          'Check if App ID is correct',
          'Verify Key ID and Secret in Zendesk Admin Center',
          'Ensure Sunshine Conversations is enabled',
          'Check if you have proper API permissions'
        ]
      });
    }

  } catch (error) {
    console.error('❌ Error testing credentials:', error);
    res.status(500).json({
      error: 'Failed to test credentials',
      details: error.message
    });
  }
} 