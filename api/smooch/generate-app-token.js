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
    
    // Try different possible endpoint formats
    const possibleUrls = [
      `https://api.smooch.io/v2/apps/${appId}/appKeys`,
      `https://api.smooch.io/v2/apps/${appId}/keys`, 
      `https://api.smooch.io/v1/apps/${appId}/keys`,
      `https://api.smooch.io/v1/apps/${appId}/appkeys`,
      `https://api.zendesk.com/sunshine/conversations/v2/apps/${appId}/appKeys`
    ];

    let lastError = null;
    
    for (const apiUrl of possibleUrls) {
      console.log('🔧 Trying URL:', apiUrl);
      console.log('🔧 Auth header (first 20 chars):', authHeader.substring(0, 20) + '...');

      try {
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
          console.log('✅ App Token created successfully with URL:', apiUrl);
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
            appId: appId,
            usedUrl: apiUrl
          });
          return;
        } else {
          const errorData = await response.text();
          lastError = {
            url: apiUrl,
            status: response.status,
            error: errorData
          };
          console.log(`❌ Failed with ${apiUrl}: ${response.status} - ${errorData}`);
        }
      } catch (error) {
        lastError = {
          url: apiUrl,
          error: error.message
        };
        console.log(`❌ Request failed for ${apiUrl}:`, error.message);
      }
    }

    // If we get here, none of the URLs worked
    console.error('❌ All API endpoints failed. Last error:', lastError);
    throw new Error(`All Smooch API endpoints failed. Last error: ${JSON.stringify(lastError)}`);

  } catch (error) {
    console.error('❌ Error generating app token:', error);
    res.status(500).json({
      error: 'Failed to generate app token',
      details: error.message
    });
  }
} 