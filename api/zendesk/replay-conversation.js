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

    // Debug environment variables (without exposing secrets)
    console.log('🔑 Environment variables check:');
    console.log('📱 App ID:', appId ? `${appId.substring(0, 8)}...` : 'MISSING');
    console.log('🔐 Key ID:', keyId ? `${keyId.substring(0, 8)}...` : 'MISSING');
    console.log('🔒 Secret:', secret ? `${secret.substring(0, 4)}...` : 'MISSING');

    if (!appId || !keyId || !secret) {
      throw new Error('Missing Sunshine Conversations credentials. Please set ZENDESK_SUNSHINE_APP_ID, ZENDESK_SUNSHINE_KEY_ID, and ZENDESK_SUNSHINE_SECRET environment variables.');
    }

    const sunshineApiUrl = `https://api.smooch.io/v2/apps/${appId}`;
    const authHeader = `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`;

    console.log('🌐 Sunshine API URL:', sunshineApiUrl);
    console.log('🔐 Auth header format:', authHeader ? 'Basic [REDACTED]' : 'MISSING');

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

    // Step 2: Create anonymous user first, then conversation

    const conversationSummary = conversationHistory && conversationHistory.length > 0 
      ? formatConversationSummary(conversationHistory)
      : '👋 Customer requested human support. An agent will be with you shortly!';

    // Generate anonymous external ID (no personal info)
    const userExternalId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Step 2a: Create the user first
    console.log('👤 Creating anonymous user...');
    const userResponse = await fetch(`${sunshineApiUrl}/users`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        externalId: userExternalId,
        profile: {
          givenName: 'Anonymous',
          surname: 'Customer'
        }
      })
    });

    console.log('👤 User creation response status:', userResponse.status);
    console.log('👤 User creation response ok:', userResponse.ok);

    if (!userResponse.ok) {
      const userErrorData = await userResponse.text();
      console.error('❌ User creation failed with response:', userErrorData);
      throw new Error(`Failed to create user: ${userResponse.status} - ${userErrorData}`);
    }

    const userData = await userResponse.json();
    const userId = userData.user.id;
    console.log('✅ Anonymous user created:', userId);

    // Step 2b: Create conversation using the user ID
    console.log('💬 Creating conversation...');
    const response = await fetch(`${sunshineApiUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'personal',
        participants: [{
          userId: userId // Use the actual userId instead of userExternalId
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

    console.log('💬 Conversation creation response status:', response.status);
    console.log('💬 Conversation creation response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Conversation creation failed with response:', errorData);
      throw new Error(`Failed to create Sunshine conversation: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    const conversationId = result.conversation.id;
    const userIdFromResult = result.conversation.participants[0].userId;

    console.log('✅ Sunshine conversation created:', conversationId);
    console.log('👤 Anonymous User External ID:', userExternalId);
    console.log('👤 Sunshine User ID:', userIdFromResult);
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
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    res.status(500).json({
      error: 'Failed to create Sunshine conversation',
      details: error.message,
      errorType: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 