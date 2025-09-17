// Get the last message received by the direct webhook
const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Call the webhook-direct endpoint to get the last message
    const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'https://conversation-api-integration.vercel.app';
    const response = await fetch(`${baseUrl}/api/webhook-direct`);
    const data = await response.json();
    
    const psid = req.query.psid;
    const lastMessage = data.lastMessage;
    
    if (lastMessage && (!psid || lastMessage.psid === psid)) {
      // Check if message is recent (within last 5 minutes)
      const messageAge = Date.now() - new Date(lastMessage.timestamp).getTime();
      const isRecent = messageAge < 5 * 60 * 1000; // 5 minutes
      
      res.json({
        success: true,
        messages: isRecent ? [lastMessage] : [],
        timestamp: new Date().toISOString(),
        note: isRecent ? 'Recent webhook message found' : 'No recent webhook messages',
        lastMessageAge: Math.floor(messageAge / 1000) + ' seconds'
      });
    } else {
      res.json({
        success: true,
        messages: [],
        timestamp: new Date().toISOString(),
        note: psid ? `No messages for PSID ${psid}` : 'No webhook messages received'
      });
    }
  } catch (error) {
    console.error('❌ Error getting last webhook message:', error);
    res.status(500).json({
      error: 'Failed to get last webhook message',
      details: error.message
    });
  }
}
