// List conversations to get PSIDs - proper way to get PSID
const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Fetching conversations from Facebook API...');

    // Check environment variables
    if (!process.env.PAGE_ACCESS_TOKEN || !process.env.PAGE_ID) {
      return res.status(500).json({
        error: 'Server configuration incomplete',
        details: 'PAGE_ACCESS_TOKEN and PAGE_ID must be configured'
      });
    }

    // Get conversations using Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.PAGE_ID}/conversations?fields=participants&access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();
    console.log('📥 Facebook conversations response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ Facebook API Error:', data);
      return res.status(400).json({
        error: 'Facebook API Error',
        details: data.error?.message || 'Unknown error',
        suggestion: 'Check Page Access Token permissions'
      });
    }

    // Extract PSIDs from conversations
    const conversations = [];
    if (data.data && data.data.length > 0) {
      data.data.forEach(conversation => {
        if (conversation.participants && conversation.participants.data) {
          conversation.participants.data.forEach(participant => {
            // Skip the page itself, only get user PSIDs
            if (participant.id !== process.env.PAGE_ID) {
              conversations.push({
                conversationId: conversation.id,
                psid: participant.id,
                name: participant.name || 'Unknown User'
              });
            }
          });
        }
      });
    }

    console.log(`✅ Found ${conversations.length} conversations with PSIDs`);
    conversations.forEach(conv => {
      console.log(`📝 PSID: ${conv.psid}, Name: ${conv.name}`);
    });

    res.json({
      success: true,
      conversations: conversations,
      count: conversations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({
      error: 'Failed to fetch conversations',
      details: error.message
    });
  }
}
