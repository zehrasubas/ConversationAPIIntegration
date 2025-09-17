// Simple webhook that immediately returns received messages
// This will work even in serverless environments

let lastWebhookMessage = null;
let lastWebhookTime = null;

export default async function handler(req, res) {
  console.log('🚀 Direct webhook endpoint hit!');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method === 'GET') {
    // Facebook webhook verification
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode && token && challenge) {
      console.log('🔍 Facebook webhook verification request received');
      
      if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        console.error('❌ Webhook verification failed');
        res.status(403).send('Forbidden');
      }
      return;
    }
    
    // Return last received message for testing
    res.json({
      status: 'Direct webhook is running!',
      lastMessage: lastWebhookMessage,
      lastMessageTime: lastWebhookTime,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (req.method === 'POST') {
    console.log('📨 POST request - webhook data received');
    
    try {
      if (req.body.object === 'page') {
        req.body.entry.forEach(function(entry) {
          entry.messaging?.forEach(function(webhookEvent) {
            const senderId = webhookEvent.sender.id;
            console.log('👤 PSID from webhook:', senderId);
            
            if (webhookEvent.message) {
              // Store the last message globally
              lastWebhookMessage = {
                psid: senderId,
                text: webhookEvent.message.text,
                mid: webhookEvent.message.mid,
                timestamp: new Date().toISOString(),
                source: 'facebook_webhook'
              };
              lastWebhookTime = Date.now();
              
              console.log('✅ Stored webhook message:', JSON.stringify(lastWebhookMessage, null, 2));
            }
          });
        });
        
        res.status(200).send('EVENT_RECEIVED');
      } else {
        res.status(404).send('Not Found');
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      res.status(500).send('ERROR_PROCESSING_WEBHOOK');
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).send('Method Not Allowed');
  }
}
