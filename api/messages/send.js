// Send Message API Endpoint for Vercel
const fetch = require('node-fetch');

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

// Send message to Facebook
async function sendToFacebook(recipientId, text) {
  console.log('🚀 Sending message to Facebook API:', {
    recipientId,
    text,
    url: `https://graph.facebook.com/v19.0/me/messages`
  });

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text }
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Facebook API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(`Facebook API Error: ${data.error?.message || 'Unknown error'}`);
    }

    console.log('✅ Facebook API Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Error sending to Facebook:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId: psid } = req.body;
    
    if (!message || !psid) {
      return res.status(400).json({ error: 'Message and PSID are required' });
    }
    
    console.log('🔑 Sending message using PSID:', psid);

    // Store message
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    messageStore.addMessage(psid, newMessage);

    // Send to Facebook
    const fbResponse = await sendToFacebook(psid, message);
    console.log('Facebook response:', fbResponse);

    res.json({
      success: true,
      messageId: fbResponse.message_id || newMessage.id,
    });
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
} 