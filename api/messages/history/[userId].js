// Message History API Endpoint for Vercel
// Dynamic route: /api/messages/history/[userId]

// In-memory message store (replace with a database in production)
const messageStore = {
  messages: {},
  addMessage: function(userId, message) {
    if (!this.messages[userId]) {
      this.messages[userId] = [];
    }
    this.messages[userId].push(message);
  },
  getMessages: function(userId) {
    return this.messages[userId] || [];
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const messages = messageStore.getMessages(userId);
    console.log('Fetching message history for user:', userId);
    console.log('Messages found:', messages);
    
    res.json({ 
      success: true,
      messages 
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch messages',
      details: error.message 
    });
  }
} 