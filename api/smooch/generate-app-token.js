// Generate App Token for Smooch SDK authentication
const fetch = require('node-fetch');

export default async function handler(req, res) {
  console.log('🔑 App token generation request received');
  console.log('📥 Request method:', req.method);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Sunshine Conversations credentials
    const appId = process.env.ZENDESK_SUNSHINE_APP_ID;
    const keyId = process.env.ZENDESK_SUNSHINE_KEY_ID;
    const secret = process.env.ZENDESK_SUNSHINE_SECRET;

    console.log('🔧 Environment check:');
    console.log('  - App ID present:', !!appId);
    console.log('  - Key ID present:', !!keyId);
    console.log('  - Secret present:', !!secret);
    console.log('  - App ID value:', appId);
    console.log('  - Key ID value:', keyId);

    if (!appId || !keyId || !secret) {
      throw new Error('Missing Sunshine Conversations credentials');
    }

    console.log('🔧 Generating app token for App ID:', appId);
    console.log('🔧 Using Key ID:', keyId);

    const authString = `${keyId}:${secret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    const apiUrl = `https://api.smooch.io/v2/apps/${appId}/appKeys`;

    console.log('🔧 Request details:');
    console.log('  - URL:', apiUrl);
    console.log('  - Auth header (first 20 chars):', authHeader.substring(0, 20) + '...');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        displayName: 'Web Widget Token'
      })
    });

    console.log('📥 Smooch API response status:', response.status);
    console.log('📥 Smooch API response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ App Token created successfully');
      console.log('📝 Token info:', {
        id: result.key.id,
        displayName: result.key.displayName,
        hasSecret: !!result.key.secret
      });

      res.status(200).json({
        success: true,
        appToken: result.key.secret,
        tokenId: result.key.id,
        displayName: result.key.displayName,
        appId: appId
      });
    } else {
      const errorData = await response.text();
      console.error('❌ Smooch API Error Details:');
      console.error('  - Status:', response.status);
      console.error('  - Status Text:', response.statusText);
      console.error('  - Response Body:', errorData);
      console.error('  - Response Headers:', Object.fromEntries(response.headers.entries()));
      
      throw new Error(`Smooch API error: ${response.status} - ${errorData}`);
    }

  } catch (error) {
    console.error('❌ Error generating app token:', error);
    res.status(500).json({
      error: 'Failed to generate app token',
      details: error.message
    });
  }
} 