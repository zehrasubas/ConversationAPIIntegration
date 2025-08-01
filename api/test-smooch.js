// Simple test endpoint for Smooch API debugging

export default async function handler(req, res) {
  console.log('🧪 Test endpoint called');
  console.log('📥 Request method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get environment variables
    const appId = process.env.ZENDESK_SUNSHINE_APP_ID;
    const keyId = process.env.ZENDESK_SUNSHINE_KEY_ID;
    const secret = process.env.ZENDESK_SUNSHINE_SECRET;

    console.log('🔧 Environment check:');
    console.log('  - App ID present:', !!appId);
    console.log('  - Key ID present:', !!keyId);  
    console.log('  - Secret present:', !!secret);

    res.status(200).json({
      success: true,
      message: 'Test endpoint working',
      environment: {
        appIdPresent: !!appId,
        keyIdPresent: !!keyId,
        secretPresent: !!secret
      }
    });

  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      error: 'Test endpoint failed',
      details: error.message
    });
  }
} 