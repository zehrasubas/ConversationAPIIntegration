// Exchange Token API Endpoint for Messenger Platform Integration
const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    console.log('🔄 PSID Exchange request:', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check if required environment variables are set
    if (!process.env.PAGE_ACCESS_TOKEN) {
      console.error('❌ PAGE_ACCESS_TOKEN not configured');
      return res.status(500).json({ 
        error: 'Messenger Platform not configured', 
        details: 'PAGE_ACCESS_TOKEN missing' 
      });
    }

    console.log('🔑 Using Page Access Token:', process.env.PAGE_ACCESS_TOKEN ? '✓ Present' : '❌ Missing');
    
    // For Messenger Platform, the Facebook User ID can be used as PSID
    // But we need to verify the user exists and can receive messages
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${userId}?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Facebook API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData.error,
          userId: userId
        });
        
        // If user verification fails, still provide PSID but mark as unverified
        console.log('⚠️ User verification failed, providing unverified PSID');
        return res.json({ 
          success: true,
          psid: userId,
          verified: false,
          note: 'User has not messaged the page yet - messaging will be limited'
        });
      }

      const userData = responseData;
      console.log('✅ Facebook user verified:', userData);

      // Successfully verified user - provide PSID
      res.json({ 
        success: true,
        psid: userId,
        user: userData,
        verified: true,
        note: 'User verified and ready for messaging'
      });
      
    } catch (fbError) {
      console.error('❌ Facebook API error:', fbError.message);
      
      // Fallback: provide PSID anyway for basic functionality
      console.log('📝 Providing fallback PSID despite verification error');
      res.json({
        success: true,
        psid: userId,
        verified: false,
        error: 'Verification failed but PSID provided',
        details: fbError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Error in exchange-token endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
} 