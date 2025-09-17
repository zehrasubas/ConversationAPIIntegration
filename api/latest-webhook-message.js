// Simple endpoint to return the latest message received by webhook
let latestMessage = null;
let messageTimestamp = null;

// Function to store the latest message (called by webhook)
function storeLatestMessage(message) {
  latestMessage = message;
  messageTimestamp = Date.now();
  console.log('📝 Stored latest webhook message:', message.text);
}

// API endpoint to get the latest message
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (latestMessage && messageTimestamp) {
      // Return the latest message if it's less than 1 minute old
      const messageAge = Date.now() - messageTimestamp;
      if (messageAge < 60000) { // 1 minute
        res.json({
          success: true,
          message: latestMessage,
          timestamp: new Date(messageTimestamp).toISOString(),
          ageSeconds: Math.floor(messageAge / 1000),
          note: 'Latest message from webhook'
        });
      } else {
        res.json({
          success: false,
          message: 'No recent messages',
          note: 'Last message is older than 1 minute'
        });
      }
    } else {
      res.json({
        success: false,
        message: 'No messages received yet',
        note: 'Webhook has not received any messages'
      });
    }
  } catch (error) {
    console.error('❌ Error getting latest message:', error);
    res.status(500).json({
      error: 'Failed to get latest message',
      details: error.message
    });
  }
}

// Export the store function for webhook to use
module.exports = { storeLatestMessage };
