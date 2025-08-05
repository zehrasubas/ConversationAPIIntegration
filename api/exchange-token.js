// Exchange Facebook User ID for PSID
import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('🔄 Exchange token request received');
  console.log('📨 Request body:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;
  console.log('👤 User ID from request:', userId);

  if (!userId) {
    console.log('❌ User ID is required');
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    console.log('🔧 PSID Exchange Logic:');
    console.log('📝 Input User ID:', userId);
    
    // NOTE: This is a simplified fallback implementation
    // In production, you would implement proper PSID mapping
    // by storing webhook PSID data when users first message your page
    
    console.log('⚠️ Using fallback PSID mapping - implement proper storage for production');
    return res.status(200).json({
      success: true,
      psid: userId, // Fallback - use userId as PSID
      userId: userId,
      warning: 'Fallback PSID mapping - implement proper PSID storage for production use'
    });

  } catch (error) {
    console.error('❌ Error in exchange token:', error);
    return res.status(500).json({ 
      error: 'Failed to exchange token', 
      details: error.message 
    });
  }
} 