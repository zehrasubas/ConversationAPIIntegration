// Zendesk Sunshine Conversations API - Transfer Chat History as Summary  
// This creates a conversation with formatted summary message that the Web Widget can display

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationHistory, userEmail, userName, sessionId } = req.body;

    // Note: userEmail and userName are optional since we're using anonymous approach
    console.log('🌞 Starting Sunshine Conversations for anonymous customer');
    console.log('💬 History length:', conversationHistory?.length || 0);

    // Get Sunshine Conversations credentials from environment
    const appId = process.env.ZENDESK_SUNSHINE_APP_ID;
    const keyId = process.env.ZENDESK_SUNSHINE_KEY_ID;
    const secret = process.env.ZENDESK_SUNSHINE_SECRET;

    if (!appId || !keyId || !secret) {
      throw new Error('Missing Sunshine Conversations credentials. Please set ZENDESK_SUNSHINE_APP_ID, ZENDESK_SUNSHINE_KEY_ID, and ZENDESK_SUNSHINE_SECRET environment variables.');
    }

    const sunshineApiUrl = `https://api.smooch.io/v2/apps/${appId}`;
    const authHeader = `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`;

    // Step 1: Format conversation summary for Sunshine
    const formatConversationSummary = (messages) => {
      const timestamp = new Date().toLocaleString();
      
      let summary = `📞 **Chat Transfer Summary**\n`;
      summary += `🕒 Transfer Time: ${timestamp}\n`;
      summary += `👤 Customer: Anonymous Customer\n`;
      summary += `💬 Total Messages: ${messages.length}\n`;
      summary += `\n${'━'.repeat(50)}\n\n`;
      summary += `**Conversation History:**\n\n`;
      
      const messageHistory = messages.map((msg, index) => {
        const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString();
        const icon = msg.sender === 'user' ? '👤' : '🤖';
        const speaker = msg.sender === 'user' ? 'Customer' : 'Assistant';
        const messageNumber = String(index + 1).padStart(2, '0');
        
        return `**${messageNumber}.** ${icon} **${speaker}** *(${time})*\n    ${msg.text}`;
      }).join('\n\n');
      
      summary += messageHistory;
      summary += `\n\n${'━'.repeat(50)}\n`;
      summary += `✅ **Customer is now connected and ready to continue with a human agent.**`;
      
      return summary;
    };

    // Step 2: Create conversation with summary message using Sunshine API

    const conversationSummary = conversationHistory && conversationHistory.length > 0 
      ? formatConversationSummary(conversationHistory)
      : '👋 Customer requested human support. An agent will be with you shortly!';

    // Generate anonymous external ID (no personal info)
    const userExternalId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create conversation with anonymous userExternalId
    const response = await fetch(`${sunshineApiUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'personal',
        participants: [{
          userExternalId: userExternalId // Creates anonymous user automatically
        }],
        messages: [{
          author: { 
            type: 'business'
          },
          content: {
            type: 'text',
            text: conversationSummary
          }
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create Sunshine conversation: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    const conversationId = result.conversation.id;
    const userId = result.conversation.participants[0].userId;

    console.log('✅ Sunshine conversation created:', conversationId);
    console.log('👤 Anonymous User External ID:', userExternalId);
    console.log('👤 Sunshine User ID:', userId);
    console.log('📝 Summary message included in conversation');

    // Step 3: Add follow-up message if needed
    if (conversationHistory && conversationHistory.length > 0) {
      // Add a follow-up notification message
      setTimeout(async () => {
        try {
          await fetch(`${sunshineApiUrl}/conversations/${conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              author: { type: 'business' },
              content: {
                type: 'text',
                text: '🔔 An agent will be with you shortly. Average wait time is 2-3 minutes.'
              }
            })
          });
          console.log('✅ Follow-up message sent');
        } catch (error) {
          console.log('⚠️ Failed to send follow-up message:', error.message);
        }
      }, 2000);
    }

    console.log('🎉 Sunshine conversation created successfully');

    res.status(200).json({
      success: true,
      conversationId: conversationId,
      message: 'Anonymous conversation history successfully transferred to Zendesk Support'
    });

  } catch (error) {
    console.error('❌ Error creating Sunshine conversation:', error);
    res.status(500).json({
      error: 'Failed to create Sunshine conversation',
      details: error.message
    });
  }
} 