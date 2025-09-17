// Get messages directly from Facebook API for prototype
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { psid } = req.query;
    
    if (!psid) {
      return res.status(400).json({ error: 'psid query parameter required' });
    }

    console.log('🔍 Getting messages for PSID:', psid);

    // For prototype: return mock messages based on recent webhook activity
    // In real implementation, you'd query Facebook's API
    
    const mockMessages = [
      {
        id: 'msg_' + Date.now(),
        text: 'Hello from Facebook Messenger!',
        sender: 'business', // Facebook user appears as business in web chat
        timestamp: new Date().toISOString(),
        source: 'facebook_messenger'
      }
    ];

    // Return empty for now - webhook logging shows it receives messages
    res.json({
      success: true,
      messages: [], // Empty until we implement proper Facebook API polling
      timestamp: new Date().toISOString(),
      note: 'Prototype mode - implement Facebook Conversations API here'
    });

  } catch (error) {
    console.error('❌ Error getting Facebook messages:', error);
    res.status(500).json({
      error: 'Failed to get messages',
      details: error.message
    });
  }
}
