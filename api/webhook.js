// Facebook Webhook Handler for Vercel
const fetch = require('node-fetch');
const messageStore = require('./shared/messageStore');

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
  // 🚀 COMPREHENSIVE LOGGING - Start
  console.log('🚀 Webhook endpoint hit!');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query params:', JSON.stringify(req.query, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Timestamp:', new Date().toISOString());
  console.log('🚀 COMPREHENSIVE LOGGING - End');
  
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // Facebook webhook verification
    if (mode && token && challenge) {
      console.log('🔍 Facebook webhook verification request received');
      console.log('📋 Verification details:', {
        mode,
        token,
        challenge,
        expectedToken: process.env.VERIFY_TOKEN
      });

      // Check if mode and token are correct
      if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        console.error('❌ Webhook verification failed');
        res.status(403).send('Forbidden');
      }
      return;
    }
    
    // Manual testing endpoint
    console.log('🧪 Manual webhook test request');
    console.log('📋 GET request - likely manual test or Facebook verification');
    console.log('🔧 Environment check:', {
      verify_token_configured: !!process.env.VERIFY_TOKEN,
      page_access_token_configured: !!process.env.PAGE_ACCESS_TOKEN,
      page_id_configured: !!process.env.PAGE_ID
    });
    
    res.status(200).json({
      status: 'Webhook is running!',
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method,
      note: 'This webhook is ready to receive POST requests from Facebook Messenger',
      verify_token_configured: !!process.env.VERIFY_TOKEN,
      page_access_token_configured: !!process.env.PAGE_ACCESS_TOKEN,
      page_id_configured: !!process.env.PAGE_ID,
      query_params: req.query
    });
    return;
  }

  if (req.method === 'POST') {
    console.log('📨 POST request - webhook data received');
    console.log('📬 Webhook event received');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📦 Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔐 X-Hub-Signature present:', !!req.headers['x-hub-signature-256']);

    try {
      // Verify the webhook signature (recommended for production)
      // const signature = req.headers['x-hub-signature-256'];
      // You should implement signature verification here for security

      if (req.body.object === 'page') {
        req.body.entry.forEach(function(entry) {
          console.log('🔄 Processing entry:', JSON.stringify(entry, null, 2));
          
          const pageId = entry.id;
          const timeOfEvent = entry.time;
          console.log('📄 Page ID:', pageId, 'Time:', new Date(timeOfEvent));

                     // Iterate over each messaging event
           entry.messaging?.forEach(async function(webhookEvent) {
            console.log('💬 Processing messaging event:', JSON.stringify(webhookEvent, null, 2));
            
            const senderId = webhookEvent.sender.id;
            console.log('👤 Real PSID from webhook:', senderId);
            console.log('📧 This is the PSID we should use for sending messages back');

            if (webhookEvent.message) {
              console.log('📬 Processing message event:', JSON.stringify(webhookEvent.message, null, 2));
              console.log('📝 Message text:', webhookEvent.message.text);
              console.log('🆔 From PSID:', senderId);
              
              try {
                // Handle incoming message from Facebook user
                const incomingMessage = {
                  id: webhookEvent.message.mid,
                  text: webhookEvent.message.text,
                  sender: 'business', // Messages from Facebook users appear as business messages on website
                  timestamp: new Date(webhookEvent.timestamp).toISOString(),
                  source: 'facebook_messenger'
                };
                
                console.log('🔄 About to store message:', JSON.stringify(incomingMessage, null, 2));
                console.log('🔄 Storing for sender ID:', senderId);
                
                // Store in local message store (existing functionality)
                console.log('🔄 About to store message for PSID:', senderId);
                console.log('🔄 Message to store:', JSON.stringify(incomingMessage, null, 2));
                
                try {
                  const storedMessage = messageStore.addMessage(senderId, incomingMessage);
                  console.log('✅ Successfully stored message in local store:', JSON.stringify(storedMessage, null, 2));
                  console.log('🔍 Current message count for user:', messageStore.getMessages(senderId).length);
                  console.log('🔍 All stored user IDs:', Object.keys(messageStore.messages || {}));
                } catch (storeError) {
                  console.error('❌ Error storing message in messageStore:', storeError);
                  console.error('❌ Store error stack:', storeError.stack);
                }

                // Try to broadcast message to SSE clients directly
                console.log('📢 Attempting to broadcast message to SSE clients...');
                try {
                  // Force notification to SSE listeners
                  messageStore.notifyListeners(senderId, incomingMessage);
                  console.log('✅ Message broadcast attempted');
                } catch (broadcastError) {
                  console.error('❌ Error broadcasting message:', broadcastError);
                }
                
                // Note: Sunshine Conversations integration removed
                // Messages are now handled via local chat history and Zendesk Web Widget prefill
                console.log('📝 Message stored in local store for potential transfer to Zendesk widget');

              } catch (error) {
                console.error('❌ Error storing message:', error);
                console.error('❌ Error stack:', error.stack);
              }

              // Auto-reply disabled - messages now appear in website chat
              // if (webhookEvent.message.text) {
              //   try {
              //     console.log('🤖 Sending auto-reply to PSID:', senderId);
              //     const response = await sendToFacebook(
              //       senderId,
              //       `Thank you for your message: "${webhookEvent.message.text}". We'll get back to you soon!`
              //     );
              //     console.log('✅ Auto-reply sent successfully:', JSON.stringify(response, null, 2));
              //   } catch (error) {
              //     console.error('❌ Error sending auto-reply:', error);
              //   }
              // }
            } else if (webhookEvent.postback) {
              // Handle postback
              const postbackMessage = {
                id: Date.now().toString(),
                text: `Received postback: ${webhookEvent.postback.payload}`,
                sender: 'business',
                timestamp: new Date().toISOString(),
                source: 'facebook_postback'
              };
              const storedPostback = messageStore.addMessage(senderId, postbackMessage);
              console.log('💾 Stored postback:', storedPostback);
            }
          });
        });

        res.status(200).send('EVENT_RECEIVED');
      } else {
        console.log('⚠️ Unhandled webhook object type:', req.body.object);
        res.status(404).send('Not Found');
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      res.status(500).send('ERROR_PROCESSING_WEBHOOK');
    }
  } else {
    console.log('⚠️ Unsupported method:', req.method);
    console.log('📋 Allowed methods: GET, POST');
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).send('Method Not Allowed');
  }
} 