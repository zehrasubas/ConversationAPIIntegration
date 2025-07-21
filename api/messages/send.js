// Send Message API Endpoint for Messenger Platform
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

// Send message to Facebook Messenger Platform
async function sendToFacebookMessenger(recipientPSID, text) {
  console.log('🚀 Sending message to Facebook Messenger Platform:', {
    recipientPSID,
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
          recipient: { id: recipientPSID },
          message: { 
            text: text 
          },
          messaging_type: "RESPONSE" // Response to user message within 24 hours
        })
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Facebook Messenger API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(`Facebook Messenger API Error: ${data.error?.message || 'Unknown error'}`);
    }

    console.log('✅ Message sent to Facebook Messenger successfully:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Error sending to Facebook Messenger:', {
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
    
    console.log('📨 Received send message request:', {
      message,
      psid,
      timestamp: new Date().toISOString()
    });
    
    if (!message || !psid) {
      return res.status(400).json({ error: 'Message and PSID are required' });
    }

    // Check if Messenger Platform is configured
    if (!process.env.PAGE_ACCESS_TOKEN) {
      console.error('❌ PAGE_ACCESS_TOKEN not configured');
      return res.status(500).json({ 
        error: 'Messenger Platform not configured',
        details: 'PAGE_ACCESS_TOKEN missing'
      });
    }
    
    console.log('🔑 Using PSID for Messenger:', psid);

    // Store message locally first
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      psid: psid
    };
    messageStore.addMessage(psid, newMessage);
    console.log('💾 Message stored locally:', newMessage);

    try {
      // Send to Facebook Messenger Platform
      const fbResponse = await sendToFacebookMessenger(psid, message);
      console.log('✅ Facebook Messenger response:', fbResponse);

      res.json({
        success: true,
        messageId: fbResponse.message_id || newMessage.id,
        status: 'sent_to_messenger',
        note: 'Message sent to Facebook Messenger Platform'
      });
    } catch (messengerError) {
      console.error('❌ Failed to send to Messenger Platform:', messengerError.message);
      
      // Still return success for local storage, but indicate Messenger failure
      res.status(200).json({
        success: true,
        messageId: newMessage.id,
        status: 'local_only',
        warning: 'Message stored locally but failed to send to Messenger',
        error: messengerError.message,
        note: 'User may need to message your Facebook Page first to enable messaging'
      });
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
} 