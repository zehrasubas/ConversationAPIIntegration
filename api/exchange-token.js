// Exchange Token API Endpoint for Vercel
const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    console.log('🔄 Exchange token request:', {
      userId,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // In Facebook's Messenger Platform, we need to verify if this user can message the page
    // and get their PSID for messaging
    console.log('📱 Attempting to verify user with Facebook...');
    const psid = userId;

    // Verify the user exists and can message the page
    try {
      console.log('🔑 Using Page Access Token:', process.env.PAGE_ACCESS_TOKEN ? '✓ Present' : '❌ Missing');
      
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
        throw new Error(`Failed to verify user with Facebook: ${responseData.error?.message || 'Unknown error'}`);
      }

      const userData = responseData;
      console.log('✅ Facebook user data:', userData);

      res.json({ 
        success: true,
        psid: psid,
        user: userData
      });
    } catch (fbError) {
      console.error('Facebook API error:', fbError);
      res.status(400).json({ 
        error: 'Failed to verify user with Facebook',
        details: fbError.message
      });
    }
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ 
      error: 'Failed to exchange token',
      details: error.message
    });
  }
} 