// Message History API Endpoint for Vercel
// Dynamic route: /api/messages/history/[userId]

const messageStore = require('../../shared/messageStore');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, since } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // If 'since' parameter is provided, only return newer messages
    const messages = since 
      ? messageStore.getNewMessages(userId, since)
      : messageStore.getMessages(userId);
      
    console.log('Fetching message history for user:', userId);
    console.log('Since timestamp:', since || 'all messages');
    console.log('Messages found:', messages.length);
    
    res.json({ 
      success: true,
      messages,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch messages',
      details: error.message 
    });
  }
} 