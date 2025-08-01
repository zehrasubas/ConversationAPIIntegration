// Send Message API Endpoint for Messenger Platform
const fetch = require('node-fetch');
const messageStore = require('../shared/messageStore');
const sunshineStore = require('../shared/sunshineConversationStore');

// Send message to Facebook Messenger Platform
async function sendToFacebookMessenger(recipientPSID, text) {
  console.log('🚀 Sending message to Facebook Messenger Platform:', {
    recipientPSID,
    text,
    url: `https://graph.facebook.com/v19.0/me/messages`
  });

  const requestBody = {
    recipient: { id: recipientPSID },
    message: { 
      text: text 
    },
    messaging_type: "RESPONSE" // Response to user message within 24 hours
  };

  console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
  console.log('🔑 Using PAGE_ACCESS_TOKEN (first 10 chars):', process.env.PAGE_ACCESS_TOKEN?.substring(0, 10) + '...');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();
    
    console.log('📥 Facebook API Response Status:', response.status);
    console.log('📥 Facebook API Response:', JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Facebook Messenger API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(`Facebook Messenger API Error: ${data.error?.message || 'Unknown error'}`);
    }

    console.log('✅ Message sent to Facebook Messenger successfully:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Error sending to Facebook Messenger:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, externalId } = req.body;
    console.log('📬 Send message request:', { message, userId, externalId });

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and userId are required' });
    }

    // Store message locally first
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      source: 'website'
    };

    const storedMessage = messageStore.addMessage(userId, userMessage);
    console.log('💾 User message stored:', storedMessage);

    // Create or update Sunshine conversation if external ID provided
    if (externalId) {
      console.log('🌞 Processing Sunshine conversation for external ID:', externalId);
      console.log('🔍 External ID analysis:');
      console.log('  - External ID:', externalId);
      console.log('  - Is Facebook ID pattern:', externalId.startsWith('facebook_'));
      console.log('  - Is anonymous pattern:', externalId.startsWith('anonymous_'));
      
      try {
        // Get or create Sunshine conversation for this external ID
        const conversationInfo = await sunshineStore.getOrCreateConversation(
          externalId, 
          message
        );
        
        if (conversationInfo.isNew) {
          console.log('✨ Created new Sunshine conversation for external ID:', conversationInfo.conversationId);
          console.log('👤 Sunshine user ID:', conversationInfo.sunshineUserId);
        } else {
          console.log('📝 Using existing Sunshine conversation:', conversationInfo.conversationId);
          
          // Add message to existing conversation
          const messageAdded = await sunshineStore.addMessageToConversation(
            externalId,
            message,
            'user' // Message from website user
          );
          
          if (!messageAdded) {
            console.warn('⚠️ Failed to add website message to existing Sunshine conversation');
          } else {
            console.log('✅ Added website message to Sunshine conversation');
          }
        }
      } catch (sunshineError) {
        console.error('❌ Error processing Sunshine conversation for external ID:', sunshineError);
        console.error('❌ Sunshine error details:', sunshineError.message);
        console.log('🔄 Continuing message processing despite Sunshine failure');
        // Continue processing - don't let Sunshine failures break the main chat
      }
    } else {
      console.log('ℹ️ No external ID provided - skipping Sunshine conversation creation');
    }

    // Check if Messenger Platform is configured
    if (!process.env.PAGE_ACCESS_TOKEN) {
      console.log('⚠️ PAGE_ACCESS_TOKEN not configured - storing message locally only');
      return res.json({
        success: true,
        messageId: storedMessage.id,
        status: 'local_only',
        note: 'Message stored locally - Messenger Platform not configured'
      });
    }

    // For Messenger Platform, userId should be the PSID
    const psid = userId;
    
    console.log('🔍 Debug Info:');
    console.log('- PSID being used:', psid);
    console.log('- PAGE_ACCESS_TOKEN present:', !!process.env.PAGE_ACCESS_TOKEN);
    console.log('- PAGE_ID from env:', process.env.PAGE_ID);

    try {
      // Send to Facebook Messenger Platform
      const fbResponse = await sendToFacebookMessenger(psid, message);
      console.log('✅ Facebook Messenger response:', fbResponse);

      res.json({
        success: true,
        messageId: fbResponse.message_id || storedMessage.id,
        status: 'sent_to_messenger',
        note: 'Message sent to Facebook Messenger Platform'
      });
    } catch (messengerError) {
      console.error('❌ Failed to send to Messenger Platform:', messengerError.message);
      
      // Still return success for local storage, but indicate Messenger failure
      res.status(200).json({
        success: true,
        messageId: storedMessage.id,
        status: 'local_only',
        warning: 'Message stored locally but failed to send to Messenger',
        error: messengerError.message,
        note: 'User may need to message your Facebook Page first to enable messaging'
      });
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
} 