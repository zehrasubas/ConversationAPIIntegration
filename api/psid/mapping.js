// PSID Mapping API - Maps Facebook User IDs to PSIDs using environment variables
// This allows known users to automatically get their PSID without webhook storage issues

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { facebookUserId } = req.body;
    
    if (!facebookUserId) {
      return res.status(400).json({ error: 'facebookUserId is required' });
    }

    console.log('🔍 Looking up PSID mapping for Facebook User ID:', facebookUserId);

    // Get known user mappings from environment variables
    const knownUserId = process.env.KNOWN_FACEBOOK_USER_ID;
    const knownPSID = process.env.KNOWN_USER_PSID;

    console.log('🔧 Environment variables configured:', {
      hasKnownUserId: !!knownUserId,
      hasKnownPSID: !!knownPSID,
      requestedUserId: facebookUserId
    });

    if (knownUserId && knownPSID && facebookUserId === knownUserId) {
      console.log('✅ Found PSID mapping for known user');
      res.json({
        success: true,
        psid: knownPSID,
        facebookUserId: facebookUserId,
        note: 'PSID mapping from environment variables'
      });
    } else {
      console.log('❌ No PSID mapping found for this user');
      res.json({
        success: false,
        message: 'No PSID mapping found for this Facebook User ID',
        note: 'User needs to message the Facebook Page first, or add mapping to environment variables',
        requestedUserId: facebookUserId
      });
    }

  } catch (error) {
    console.error('❌ Error in PSID mapping:', error);
    res.status(500).json({
      error: 'Failed to check PSID mapping',
      details: error.message
    });
  }
}
