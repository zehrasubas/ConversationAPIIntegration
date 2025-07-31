// Server-Sent Events API for real-time message streaming
// Route: /api/messages/stream?userId=PSID

const messageStore = require('../shared/messageStore');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    message: 'SSE connection established',
    userId,
    timestamp: new Date().toISOString()
  })}\n\n`);

  console.log(`SSE connection established for user: ${userId}`);

  // Create listener object for this connection
  const listener = {
    userId,
    send: (eventData) => {
      // Only send events for this specific user or broadcast events
      if (eventData.userId === userId || eventData.type === 'broadcast') {
        const sseData = `data: ${JSON.stringify(eventData)}\n\n`;
        res.write(sseData);
      }
    }
  };

  // Add this connection to the messageStore listeners
  messageStore.addListener(listener);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      })}\n\n`);
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      clearInterval(heartbeatInterval);
      messageStore.removeListener(listener);
    }
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`SSE connection closed for user: ${userId}`);
    clearInterval(heartbeatInterval);
    messageStore.removeListener(listener);
  });

  req.on('error', (error) => {
    console.error('SSE connection error:', error);
    clearInterval(heartbeatInterval);
    messageStore.removeListener(listener);
  });
} 