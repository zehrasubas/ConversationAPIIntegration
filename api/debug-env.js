// Debug environment variables
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const envCheck = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasKnownUserId: !!process.env.KNOWN_FACEBOOK_USER_ID,
      hasKnownPSID: !!process.env.KNOWN_USER_PSID,
      knownUserIdFirst4: process.env.KNOWN_FACEBOOK_USER_ID?.substring(0, 4) || 'NOT_SET',
      knownPSIDFirst4: process.env.KNOWN_USER_PSID?.substring(0, 4) || 'NOT_SET',
      deploymentUrl: process.env.VERCEL_URL || 'NOT_SET'
    };

    console.log('🔍 Environment check:', envCheck);

    res.json({
      success: true,
      ...envCheck
    });

  } catch (error) {
    console.error('❌ Error checking environment:', error);
    res.status(500).json({
      error: 'Failed to check environment',
      details: error.message
    });
  }
}
