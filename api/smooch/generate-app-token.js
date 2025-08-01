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

    if (!appId || !keyId || !secret) {
      throw new Error('Missing Sunshine Conversations credentials');
    }

    console.log('🔧 Generating app token for App ID:', appId);
    console.log('🔧 Using Key ID:', keyId);

    const response = await fetch(`https://api.smooch.io/v2/apps/${appId}/appKeys`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(keyId + ':' + secret).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        displayName: 'Web Widget Token'
      })
    });

    console.log('📥 Smooch API response status:', response.status);
    
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
      console.error('❌ Failed to create app token:', errorData);
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