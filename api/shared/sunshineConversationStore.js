// Sunshine Conversations Management Service
// Handles creating and tracking Sunshine conversations for Facebook users

class SunshineConversationStore {
  constructor() {
    // In-memory storage for PSID -> Sunshine Conversation ID mapping
    // TODO: Replace with persistent storage (Vercel KV, Redis, etc.)
    this.conversationMap = new Map();
  }

  /**
   * Get or create a Sunshine conversation using external ID
   * @param {string} externalId - Anonymous external ID for Sunshine
   * @param {string} firstMessage - The first message to include in the conversation
   * @returns {Promise<Object>} { conversationId, externalId, isNew }
   */
  async getOrCreateConversation(externalId, firstMessage = null) {
    console.log('🌞 Getting or creating Sunshine conversation for external ID:', externalId);

    // Check if we already have a conversation for this external ID
    if (this.conversationMap.has(externalId)) {
      const existingData = this.conversationMap.get(externalId);
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

      console.log('🔐 Using external ID for Sunshine:', externalId);

      // Step 1: Create the user with external ID
      const userResponse = await fetch(`${sunshineApiUrl}/users`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          externalId: externalId,
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

      // Store the mapping using external ID as key
      const conversationInfo = {
        conversationId,
        externalId,
        sunshineUserId,
        createdAt: new Date().toISOString()
      };

      this.conversationMap.set(externalId, conversationInfo);
      
      console.log('💾 Stored conversation mapping by external ID:', conversationInfo);
      console.log(`📊 Total conversations now stored: ${this.conversationMap.size}`);
      console.log('🔑 All stored external IDs:', Array.from(this.conversationMap.keys()));
      
      return { ...conversationInfo, isNew: true };

    } catch (error) {
      console.error('❌ Error creating Sunshine conversation:', error);
      throw error;
    }
  }

  /**
   * Add a message to an existing Sunshine conversation
   * @param {string} externalId - Anonymous external ID for Sunshine
   * @param {string} messageText - Message content
   * @param {string} authorType - 'user' or 'business'
   * @returns {Promise<boolean>} Success status
   */
  async addMessageToConversation(externalId, messageText, authorType = 'user') {
    console.log('💬 Adding message to Sunshine conversation for external ID:', externalId);

    try {
      const conversationInfo = this.conversationMap.get(externalId);
      if (!conversationInfo) {
        console.warn('⚠️ No conversation found for external ID:', externalId);
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
   * Get conversation ID for an external ID
   * @param {string} externalId - Anonymous external ID for Sunshine
   * @returns {string|null} Sunshine conversation ID
   */
  getConversationId(externalId) {
    console.log('🔍 Looking up conversation for external ID:', externalId);
    console.log('📋 Available conversation mappings:');
    
    // Debug: log all stored mappings
    for (const [extId, info] of this.conversationMap.entries()) {
      console.log(`  - External ID: ${extId} → Conversation: ${info.conversationId}`);
    }
    
    const conversationInfo = this.conversationMap.get(externalId);
    if (conversationInfo) {
      console.log('✅ Found conversation:', conversationInfo.conversationId);
      return conversationInfo.conversationId;
    } else {
      console.log('❌ No conversation found for external ID:', externalId);
      return null;
    }
  }

  /**
   * Get all stored conversation mappings (for debugging)
   * @returns {Array} Array of conversation mappings
   */
  getAllConversations() {
    return Array.from(this.conversationMap.entries()).map(([externalId, info]) => ({
      externalId: externalId,
      ...info
    }));
  }
}

// Export singleton instance
const sunshineStore = new SunshineConversationStore();
module.exports = sunshineStore; 