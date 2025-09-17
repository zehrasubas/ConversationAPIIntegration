// Simplest possible webhook that returns the last message directly
export default async function handler(req, res) {
  console.log('🚀 Simple webhook called!');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  if (req.method === 'GET') {
    // Facebook webhook verification
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      res.status(200).send(challenge);
      return;
    }
    
    // For testing - return status
    res.json({
      status: 'Simple webhook running',
      timestamp: new Date().toISOString(),
      note: 'Send POST requests here for testing'
    });
    return;
  }

  if (req.method === 'POST') {
    console.log('📨 Simple webhook received POST!');
    
    try {
      if (req.body.object === 'page') {
        req.body.entry.forEach(function(entry) {
          entry.messaging?.forEach(function(webhookEvent) {
            const senderId = webhookEvent.sender.id;
            console.log('👤 PSID:', senderId);
            
            if (webhookEvent.message) {
              console.log('✅ MESSAGE RECEIVED IN WEBHOOK!');
              console.log('📝 Text:', webhookEvent.message.text);
              console.log('🆔 PSID:', senderId);
              console.log('⏰ This proves the webhook is being called by Facebook!');
              
              // For now, just log success - we'll add storage later
              console.log('🎉 SUCCESS: Webhook is working and receiving messages!');
            }
          });
        });
        
        res.status(200).send('EVENT_RECEIVED');
      } else {
        res.status(404).send('Not Found');
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      res.status(500).send('ERROR');
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).send('Method Not Allowed');
  }
}
