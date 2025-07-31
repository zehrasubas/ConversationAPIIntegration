// Zendesk Sunshine Conversations API - Replay Chat History
// This creates actual chat messages in Zendesk before the customer sees the widget

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

    // Step 4: Replay conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      console.log('🔄 Replaying', conversationHistory.length, 'messages...');
      
      for (let i = 0; i < conversationHistory.length; i++) {
        const message = conversationHistory[i];
        
        // Determine message author
        const author = message.sender === 'user' 
          ? { type: 'user', userId: userId }
          : { type: 'business' };

        // Create message
        const messageData = {
          author: author,
          content: {
            type: 'text',
            text: message.text
          },
          metadata: {
            originalTimestamp: message.timestamp,
            originalSender: message.sender,
            replayedMessage: true
          }
        };

        const messageResponse = await fetch(
          `${sunshineApiUrl}/conversations/${conversationId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
          }
        );

        if (!messageResponse.ok) {
          console.error('❌ Failed to replay message:', await messageResponse.text());
        } else {
          console.log(`✅ Replayed message ${i + 1}/${conversationHistory.length}`);
        }

        // Small delay to maintain order
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 5: Add handoff message
    const handoffMessage = {
      author: { type: 'business' },
      content: {
        type: 'text',
        text: conversationHistory?.length > 0 
          ? "👋 Hi! I can see our previous conversation above. An agent will be with you shortly to continue helping!"
          : "👋 Hi! An agent will be with you shortly to help with your request!"
      },
      metadata: {
        isHandoffMessage: true
      }
    };

    await fetch(`${sunshineApiUrl}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(handoffMessage)
    });

    console.log('🎉 Conversation replay completed successfully');

    res.status(200).json({
      success: true,
      conversationId: conversationId,
      userId: userId,
      messagesReplayed: conversationHistory?.length || 0,
      message: 'Conversation history replayed successfully'
    });

  } catch (error) {
    console.error('❌ Error replaying conversation:', error);
    res.status(500).json({
      error: 'Failed to replay conversation',
      details: error.message
    });
  }
} 