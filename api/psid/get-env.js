// Get PSID directly from environment variables - no mapping needed
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Getting PSID from environment variables...');

    const psid = process.env.KNOWN_USER_PSID;

    if (psid) {
      console.log('✅ Found PSID in environment:', psid);
      res.json({
        success: true,
        psid: psid,
        note: 'PSID from environment variables'
      });
    } else {
      console.log('❌ No PSID configured in environment variables');
      res.json({
        success: false,
        message: 'No PSID configured in environment variables',
        note: 'Add KNOWN_USER_PSID to Vercel environment variables'
      });
    }

  } catch (error) {
    console.error('❌ Error getting PSID from environment:', error);
    res.status(500).json({
      error: 'Failed to get PSID from environment',
      details: error.message
    });
  }
}
