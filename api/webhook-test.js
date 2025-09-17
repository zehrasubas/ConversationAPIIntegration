// Simple webhook test endpoint that logs everything
export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  
  console.log('🚀 WEBHOOK TEST - Start');
  console.log('Timestamp:', timestamp);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('🚀 WEBHOOK TEST - End');
  
  if (req.method === 'GET') {
    // Facebook webhook verification
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('✅ WEBHOOK VERIFICATION SUCCESS');
      return res.status(200).send(challenge);
    }
    
    // Manual test
    return res.json({
      status: 'Webhook test endpoint is running!',
      timestamp: timestamp,
      message: 'Ready to receive POST requests from Facebook',
      verifyToken: process.env.VERIFY_TOKEN ? 'configured' : 'missing'
    });
  }
  
  if (req.method === 'POST') {
    console.log('📨 RECEIVED WEBHOOK POST!');
    console.log('This proves Facebook is calling our webhook!');
    
    // Always return success to Facebook
    res.status(200).send('RECEIVED');
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).send('Method Not Allowed');
  }
}
