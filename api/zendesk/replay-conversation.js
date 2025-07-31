// Zendesk Sunshine Conversations API - Transfer Chat History as Summary
// This creates a formatted summary message in Zendesk showing the conversation history

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationHistory, userEmail, userName, sessionId } = req.body;

    // Validate required fields
    if (!userEmail || !userName) {
      return res.status(400).json({ 
        error: 'User email and name are required for Sunshine Conversations' 
      });
    }

    console.log('🌅 Starting Sunshine Conversations replay for:', userName, userEmail);
    console.log('💬 History length:', conversationHistory?.length || 0);

    const sunshineApiUrl = `https://api.smooch.io/v2/apps/${process.env.ZENDESK_SUNSHINE_APP_ID}`;
    const authHeader = `Bearer ${process.env.ZENDESK_SUNSHINE_API_KEY}`;

    // Step 1: Create or get user
    const userData = {
      externalId: `website_user_${userEmail.replace('@', '_at_')}`,
      profile: {
        givenName: userName.split(' ')[0] || userName,
        surname: userName.split(' ').slice(1).join(' ') || '',
        email: userEmail,
        locale: 'en-US'
      },
      metadata: {
        source: 'conversation-api-website',
        sessionId: sessionId || 'unknown'
      }
    };

    // Create user
    const userResponse = await fetch(`${sunshineApiUrl}/users`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    let userResult;
    if (userResponse.status === 409) {
      // User already exists, get existing user
      console.log('👤 User already exists, fetching...');
      const getUserResponse = await fetch(
        `${sunshineApiUrl}/users?filter[externalId]=${userData.externalId}`,
        {
          headers: { 'Authorization': authHeader }
        }
      );
      const getUserData = await getUserResponse.json();
      userResult = { user: getUserData.users[0] };
    } else if (userResponse.ok) {
      userResult = await userResponse.json();
      console.log('✅ User created:', userResult.user.id);
    } else {
      throw new Error(`Failed to create user: ${userResponse.status}`);
    }

    const userId = userResult.user.id;

    // Step 2: Create conversation
    const conversationData = {
      type: 'personal',
      metadata: {
        source: 'website-chat-transfer',
        originalSessionId: sessionId,
        transferredAt: new Date().toISOString()
      }
    };

    const conversationResponse = await fetch(`${sunshineApiUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(conversationData)
    });

    if (!conversationResponse.ok) {
      throw new Error(`Failed to create conversation: ${conversationResponse.status}`);
    }

    const conversationResult = await conversationResponse.json();
    const conversationId = conversationResult.conversation.id;
    console.log('💬 Conversation created:', conversationId);

    // Step 3: Add user to conversation
    await fetch(`${sunshineApiUrl}/conversations/${conversationId}/participants`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId
      })
    });

    // Step 4: Send conversation summary as single formatted message
    if (conversationHistory && conversationHistory.length > 0) {
      console.log('📋 Creating conversation summary from', conversationHistory.length, 'messages...');
      
      // Helper function to format chat history into a readable summary
      const formatChatSummary = (messages) => {
        const header = "📞 **Chat Transfer Summary**\n";
        const divider = "━".repeat(40) + "\n";
        
        const messageHistory = messages.map((msg, index) => {
          const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString();
          const icon = msg.sender === 'user' ? '👤' : '🤖';
          const speaker = msg.sender === 'user' ? 'Customer' : 'Assistant';
          return `${icon} **${speaker}** (${time})\n   ${msg.text}`;
        }).join('\n\n');
        
        const footer = `\n${divider}The customer is now connected and ready to continue the conversation with a human agent.`;
        
        return header + divider + messageHistory + footer;
      };

      // Create formatted summary
      const conversationSummary = formatChatSummary(conversationHistory);
      
      // Send single summary message
      const summaryMessage = {
        author: { type: 'business' },
        content: {
          type: 'text',
          text: conversationSummary
        },
        metadata: {
          isSummaryMessage: true,
          originalMessageCount: conversationHistory.length
        }
      };

      const summaryResponse = await fetch(
        `${sunshineApiUrl}/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(summaryMessage)
        }
      );

      if (!summaryResponse.ok) {
        console.error('❌ Failed to send summary message:', await summaryResponse.text());
      } else {
        console.log('✅ Sent conversation summary successfully');
      }
    } else {
      // No history - just send welcome message
      const welcomeMessage = {
        author: { type: 'business' },
        content: {
          type: 'text',
          text: "👋 Hi! An agent will be with you shortly to help with your request!"
        },
        metadata: {
          isWelcomeMessage: true
        }
      };

      await fetch(`${sunshineApiUrl}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(welcomeMessage)
      });
      
      console.log('✅ Sent welcome message');
    }

    console.log('🎉 Conversation summary transfer completed successfully');

    res.status(200).json({
      success: true,
      conversationId: conversationId,
      userId: userId,
      messagesReplayed: conversationHistory?.length || 0,
      message: 'Conversation history transferred as summary successfully'
    });

  } catch (error) {
    console.error('❌ Error transferring conversation summary:', error);
    res.status(500).json({
      error: 'Failed to transfer conversation summary',
      details: error.message
    });
  }
} 