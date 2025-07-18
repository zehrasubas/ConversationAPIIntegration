// Facebook Webhook Handler for Vercel
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
  console.log(`📨 ${req.method} request to webhook`, {
    query: req.query,
    body: req.method === 'POST' ? req.body : 'N/A'
  });

  if (req.method === 'GET') {
    // Webhook verification
    console.log('Received webhook verification request');
    console.log('Query parameters:', req.query);

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
      if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        console.error('❌ Webhook verification failed');
        console.error('Expected token:', process.env.VERIFY_TOKEN);
        console.error('Received token:', token);
        res.status(403).send('Forbidden');
      }
    } else {
      console.error('❌ Invalid webhook verification request');
      console.error('Missing mode or token');
      res.status(400).send('Bad Request');
    }
  } else if (req.method === 'POST') {
    // Webhook event handling
    console.log('✅ Incoming webhook event:', JSON.stringify(req.body, null, 2));
    console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));

    const body = req.body;

    if (body.object === 'page') {
      try {
        console.log('✓ Verified page event');
        // Handle each entry
        for (const entry of body.entry) {
          console.log('📝 Processing entry:', JSON.stringify(entry, null, 2));
          // Handle each messaging event
          for (const webhookEvent of entry.messaging) {
            console.log('📩 Processing webhook event:', JSON.stringify(webhookEvent, null, 2));
            console.log('🔑 Event type:', webhookEvent.message ? 'message' : webhookEvent.postback ? 'postback' : 'other');

            const senderId = webhookEvent.sender.id;
            console.log('👤 Sender ID:', senderId);

            if (webhookEvent.message) {
              console.log('📬 Processing message event:', JSON.stringify(webhookEvent.message, null, 2));
              // Handle message
              const message = {
                id: webhookEvent.message.mid,
                text: webhookEvent.message.text,
                sender: 'business',
                timestamp: new Date(webhookEvent.timestamp).toISOString()
              };
              messageStore.addMessage(senderId, message);
              console.log('💾 Stored message in local store:', JSON.stringify(message, null, 2));

              // Auto-reply example
              if (webhookEvent.message.text) {
                try {
                  console.log('🤖 Sending auto-reply to sender:', senderId);
                  const response = await sendToFacebook(
                    senderId,
                    `Thank you for your message: "${webhookEvent.message.text}". We'll get back to you soon!`
                  );
                  console.log('✅ Auto-reply sent successfully:', JSON.stringify(response, null, 2));
                } catch (error) {
                  console.error('❌ Error sending auto-reply:', error);
                }
              }
            } else if (webhookEvent.postback) {
              // Handle postback
              const message = {
                id: Date.now().toString(),
                text: `Received postback: ${webhookEvent.postback.payload}`,
                sender: 'business',
                timestamp: new Date().toISOString()
              };
              messageStore.addMessage(senderId, message);
              console.log('💾 Stored postback:', message);
            }
          }
        }

        res.status(200).send('EVENT_RECEIVED');
      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).send('ERROR_PROCESSING_WEBHOOK');
      }
    } else {
      console.error('❌ Invalid webhook event object:', body.object);
      res.status(404).send('Not Found');
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).send('Method Not Allowed');
  }
} 