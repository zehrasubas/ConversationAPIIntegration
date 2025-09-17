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

    // Get real messages from webhook via simple storage
    const simpleStorage = require('./shared/simpleStorage');
    
    try {
      const messages = simpleStorage.getMessages(psid);
      console.log(`📚 Found ${messages.length} real webhook messages for PSID ${psid}`);
      console.log(`📊 All PSIDs with messages: ${simpleStorage.getAllPSIDs()}`);
      
      res.json({
        success: true,
        messages: messages,
        timestamp: new Date().toISOString(),
        note: `Retrieved ${messages.length} real messages from webhook storage`
      });
      
    } catch (error) {
      console.error('❌ Error accessing simple storage:', error);
      res.json({
        success: true,
        messages: [],
        timestamp: new Date().toISOString(),
        note: 'Error accessing webhook storage'
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
