// Sunshine Conversations Management Service
// Handles creating and tracking Sunshine conversations for Facebook users

class SunshineConversationStore {
  constructor() {
    // In-memory storage for PSID -> Sunshine Conversation ID mapping
    // TODO: Replace with persistent storage (Vercel KV, Redis, etc.)
    this.conversationMap = new Map();
    this.userMap = new Map(); // PSID -> Sunshine User ID
  }

  /**
   * Get or create a Sunshine conversation for a Facebook user
   * @param {string} facebookPSID - Facebook Page-Scoped ID
   * @param {string} firstMessage - The first message to include in the conversation
   * @returns {Promise<Object>} { conversationId, userId, isNew }
   */
  async getOrCreateConversation(facebookPSID, firstMessage = null) {
    console.log('🌞 Getting or creating Sunshine conversation for PSID:', facebookPSID);

    // Check if we already have a conversation for this user
    if (this.conversationMap.has(facebookPSID)) {
      const existingData = this.conversationMap.get(facebookPSID);
      console.log('📝 Found existing conversation:', existingData.conversationId);
      return { ...existingData, isNew: false };
    }

    try {
      // Get environment variables
      const appId = process.env.ZENDESK_SUNSHINE_APP_ID;
      const keyId = process.env.ZENDESK_SUNSHINE_KEY_ID;
      const secret = process.env.ZENDESK_SUNSHINE_SECRET;

      if (!appId || !keyId || !secret) {
        throw new Error('Missing Sunshine Conversations credentials');
      }

      const sunshineApiUrl = `https://api.smooch.io/v2/apps/${appId}`;
      const authHeader = `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`;

      // Create anonymous external ID for this user (maintaining anonymity)
      const userExternalId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🔐 Using anonymous external ID:', userExternalId);

      // Step 1: Create the user first with external ID
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
            surname: 'User'
          }
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.text();
        throw new Error(`Failed to create Sunshine user: ${userResponse.status} - ${errorData}`);
      }

      const userData = await userResponse.json();
      const sunshineUserId = userData.user.id;
      console.log('✅ Created anonymous Sunshine user:', sunshineUserId);

      // Step 2: Create conversation using the user ID
      const conversationPayload = {
        type: 'personal',
        participants: [{
          userId: sunshineUserId
        }]
      };

      // Add initial message if provided
      if (firstMessage) {
        conversationPayload.messages = [{
          author: { type: 'user' },
          content: { type: 'text', text: firstMessage }
        }];
      }

      const conversationResponse = await fetch(`${sunshineApiUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(conversationPayload)
      });

      if (!conversationResponse.ok) {
        const errorData = await conversationResponse.text();
        throw new Error(`Failed to create Sunshine conversation: ${conversationResponse.status} - ${errorData}`);
      }

      const conversationData = await conversationResponse.json();
      const conversationId = conversationData.conversation.id;
      console.log('✅ Created anonymous Sunshine conversation:', conversationId);

      // Store the mapping (using external ID for anonymity)
      const conversationInfo = {
        conversationId,
        userId: sunshineUserId,
        userExternalId,
        facebookPSID,
        createdAt: new Date().toISOString()
      };

      this.conversationMap.set(facebookPSID, conversationInfo);
      this.userMap.set(facebookPSID, userExternalId); // Store external ID for anonymity

      console.log('💾 Stored anonymous conversation mapping:', conversationInfo);
      return { ...conversationInfo, isNew: true };

    } catch (error) {
      console.error('❌ Error creating Sunshine conversation:', error);
      throw error;
    }
  }

  /**
   * Add a message to an existing Sunshine conversation
   * @param {string} facebookPSID - Facebook Page-Scoped ID
   * @param {string} messageText - Message content
   * @param {string} authorType - 'user' or 'business'
   * @returns {Promise<boolean>} Success status
   */
  async addMessageToConversation(facebookPSID, messageText, authorType = 'user') {
    console.log('💬 Adding message to Sunshine conversation for PSID:', facebookPSID);

    try {
      const conversationInfo = this.conversationMap.get(facebookPSID);
      if (!conversationInfo) {
        console.warn('⚠️ No conversation found for PSID:', facebookPSID);
        return false;
      }

      // Get environment variables
      const appId = process.env.ZENDESK_SUNSHINE_APP_ID;
      const keyId = process.env.ZENDESK_SUNSHINE_KEY_ID;
      const secret = process.env.ZENDESK_SUNSHINE_SECRET;

      const sunshineApiUrl = `https://api.smooch.io/v2/apps/${appId}`;
      const authHeader = `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`;

      const messageResponse = await fetch(`${sunshineApiUrl}/conversations/${conversationInfo.conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          author: { type: authorType },
          content: { type: 'text', text: messageText }
        })
      });

      if (!messageResponse.ok) {
        const errorData = await messageResponse.text();
        console.error('❌ Failed to add message to Sunshine conversation:', errorData);
        return false;
      }

      console.log('✅ Added message to Sunshine conversation');
      return true;

    } catch (error) {
      console.error('❌ Error adding message to Sunshine conversation:', error);
      return false;
    }
  }

  /**
   * Get conversation ID for a Facebook user
   * @param {string} facebookPSID - Facebook Page-Scoped ID
   * @returns {string|null} Sunshine conversation ID
   */
  getConversationId(facebookPSID) {
    const conversationInfo = this.conversationMap.get(facebookPSID);
    return conversationInfo ? conversationInfo.conversationId : null;
  }

  /**
   * Get all stored conversation mappings (for debugging)
   * @returns {Array} Array of conversation mappings
   */
  getAllConversations() {
    return Array.from(this.conversationMap.entries()).map(([psid, info]) => ({
      facebookPSID: psid,
      ...info
    }));
  }
}

// Export singleton instance
const sunshineStore = new SunshineConversationStore();
module.exports = sunshineStore; 