// API endpoint to retrieve Sunshine Conversations history
// This endpoint retrieves conversation history from Sunshine using PSID mapping

const sunshineStore = require('../shared/sunshineConversationStore');

export default async function handler(req, res) {
  console.log('🔍 Get conversation history endpoint called');
  console.log('📥 Request method:', req.method);
  console.log('📥 Request query:', req.query);

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { psid, conversationId } = req.query;
    
    if (!psid && !conversationId) {
      return res.status(400).json({ 
        error: 'Either psid or conversationId parameter is required' 
      });
    }

    // Get environment variables
    const appId = process.env.ZENDESK_SUNSHINE_APP_ID;
    const keyId = process.env.ZENDESK_SUNSHINE_KEY_ID;
    const secret = process.env.ZENDESK_SUNSHINE_SECRET;

    if (!appId || !keyId || !secret) {
      throw new Error('Missing Sunshine Conversations credentials');
    }

    let targetConversationId = conversationId;
    
    // If PSID provided, look up the conversation ID
    if (psid && !conversationId) {
      targetConversationId = sunshineStore.getConversationId(psid);
      if (!targetConversationId) {
        return res.status(404).json({ 
          error: 'No Sunshine conversation found for this Facebook user',
          psid: psid
        });
      }
    }

    console.log('🔍 Retrieving conversation history for ID:', targetConversationId);

    const sunshineApiUrl = `https://api.smooch.io/v2/apps/${appId}`;
    const authHeader = `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`;

    // Fetch conversation messages from Sunshine
    const response = await fetch(`${sunshineApiUrl}/conversations/${targetConversationId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Failed to fetch Sunshine conversation:', errorData);
      throw new Error(`Sunshine API error: ${response.status} - ${errorData}`);
    }

    const conversationData = await response.json();
    console.log('✅ Retrieved conversation from Sunshine');
    console.log('📊 Message count:', conversationData.messages?.length || 0);

    // Transform Sunshine messages to our expected format
    const transformedMessages = (conversationData.messages || []).map(msg => ({
      id: msg.id,
      text: msg.content?.text || '[Non-text message]',
      sender: msg.author?.type === 'user' ? 'user' : 'business',
      timestamp: msg.received || msg.created,
      source: 'sunshine_conversations',
      author: msg.author
    }));

    console.log('📝 Transformed messages:', transformedMessages.length);

    // Create summary for agents
    const summary = {
      totalMessages: transformedMessages.length,
      conversationId: targetConversationId,
      firstMessage: transformedMessages[0]?.timestamp,
      lastMessage: transformedMessages[transformedMessages.length - 1]?.timestamp,
      participants: conversationData.conversation?.participants || []
    };

    res.status(200).json({
      success: true,
      conversationId: targetConversationId,
      messages: transformedMessages,
      summary: summary,
      source: 'sunshine_conversations'
    });

  } catch (error) {
    console.error('❌ Error retrieving conversation history:', error);
    res.status(500).json({
      error: 'Failed to retrieve conversation history',
      details: error.message
    });
  }
} 