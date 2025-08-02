// Generate JWT for Smooch SDK user authentication
const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  console.log('🔑 JWT generation request received');
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

    // Get external ID from request
    const { externalId } = req.body;
    
    if (!externalId) {
      throw new Error('External ID is required for JWT generation');
    }

    console.log('🔧 Generating JWT for external ID:', externalId);
    console.log('🔧 Using Key ID:', keyId);

    // Create JWT payload for user scope
    const payload = {
      scope: 'user',
      external_id: externalId
    };

    // Create JWT header
    const header = {
      kid: keyId
    };

    // Generate JWT
    const jwtToken = jwt.sign(payload, secret, {
      algorithm: 'HS256',
      header: header
    });

    console.log('✅ JWT generated successfully');
    console.log('🔧 JWT payload:', payload);
    console.log('🔧 JWT header:', header);

    res.status(200).json({
      success: true,
      jwt: jwtToken,
      externalId: externalId,
      scope: 'user',
      appId: appId
    });

  } catch (error) {
    console.error('❌ Error generating JWT:', error);
    res.status(500).json({
      error: 'Failed to generate JWT',
      details: error.message
    });
  }
} 