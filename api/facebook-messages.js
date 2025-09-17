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

    // Get real messages from webhook via file storage
    try {
      const messages = fileStorage.getMessages(psid);
      console.log(`📚 Found ${messages.length} real webhook messages for PSID ${psid}`);
      console.log(`📊 All PSIDs with messages: ${fileStorage.getAllPSIDs()}`);
      
      // ALSO check global variable for immediate access
      if (global.lastWebhookMessage && global.lastWebhookMessage.psid === psid) {
        const messageAge = Date.now() - global.lastWebhookMessage.timestamp;
        if (messageAge < 300000) { // 5 minutes
          console.log('📱 Found recent message in global variable!');
          messages.push(global.lastWebhookMessage.message);
        }
      }
      
      res.json({
        success: true,
        messages: messages,
        timestamp: new Date().toISOString(),
        note: `Retrieved ${messages.length} real messages from webhook storage`
      });
      
    } catch (error) {
      console.error('❌ Error accessing file storage:', error);
      res.json({
        success: true,
        messages: [],
        timestamp: new Date().toISOString(),
        note: 'Error accessing webhook file storage'
      });
    }

  } catch (error) {
    console.error('❌ Error getting Facebook messages:', error);
    res.status(500).json({
      error: 'Failed to get messages',
      details: error.message
    });
  }
}
