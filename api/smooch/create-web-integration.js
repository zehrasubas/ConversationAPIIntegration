// Create Web Integration for Smooch SDK
const fetch = require('node-fetch');

export default async function handler(req, res) {
  console.log('🔧 Creating web integration for Smooch SDK');
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

    if (!appId || !keyId || !secret) {
      throw new Error('Missing Sunshine Conversations credentials');
    }

    // Create basic authentication header
    const authString = `${keyId}:${secret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    
    console.log('🔧 Creating web integration for App ID:', appId);

    // Create web integration
    const integrationUrl = `https://api.smooch.io/v2/apps/${appId}/integrations`;
    
    console.log('🔧 Integration URL:', integrationUrl);

    const response = await fetch(integrationUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'web',
        displayName: 'Website Chat Integration'
      })
    });

    console.log('📥 Integration response status:', response.status);
    console.log('📥 Integration response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Web integration created successfully!');
      console.log('📝 Integration info:', {
        id: result.integration?.id,
        type: result.integration?.type,
        displayName: result.integration?.displayName,
        status: result.integration?.status
      });

      res.status(200).json({
        success: true,
        message: 'Web integration created successfully!',
        integrationId: result.integration?.id,
        integration: result.integration,
        appId: appId
      });
    } else {
      const errorData = await response.text();
      console.log('❌ Integration creation failed:', response.status, errorData);
      
      // Try to parse error for better details
      let parsedError;
      try {
        parsedError = JSON.parse(errorData);
      } catch (e) {
        parsedError = errorData;
      }
      
      res.status(response.status).json({
        error: 'Failed to create web integration',
        status: response.status,
        details: parsedError
      });
    }

  } catch (error) {
    console.error('❌ Error creating web integration:', error);
    res.status(500).json({
      error: 'Failed to create web integration',
      details: error.message
    });
  }
} 