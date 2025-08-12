/**
 * Main Chat History Capture System
 * Captures and stores conversation history from the main chat widget
 * for transfer to Zendesk Web Widget via prefill
 */

class ChatHistoryManager {
  constructor() {
    // Storage key for session/localStorage
    this.STORAGE_KEY = 'chat_transfer_context';
    
    // Initialize conversation storage
    this.conversation = {
      messages: [],
      metadata: {
        startTime: new Date().toISOString(),
        lastUpdateTime: null,
        topic: null,
        status: 'active',
        sessionId: this.generateSessionId()
      }
    };
    
    // Load existing conversation if available
    this.loadExistingConversation();
  }

  /**
   * Generate unique session ID for tracking
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load existing conversation from storage
   */
  loadExistingConversation() {
    try {
      // Try sessionStorage first (same tab)
      let stored = sessionStorage.getItem(this.STORAGE_KEY);
      
      // Fallback to localStorage (new tab)
      if (!stored) {
        stored = localStorage.getItem(this.STORAGE_KEY);
      }
      
      if (stored) {
        const parsedConversation = JSON.parse(stored);
        // Only load if conversation is still active (not transferred)
        if (parsedConversation.metadata.status === 'active') {
          this.conversation = parsedConversation;
          // eslint-disable-next-line no-console
          console.log('📖 Loaded existing conversation from storage');
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to load existing conversation:', error);
    }
  }

  /**
   * Add a message to the conversation history
   * @param {string} message - The message text
   * @param {string} sender - 'customer' or 'agent'  
   * @param {Object} metadata - Optional metadata
   */
  addMessage(message, sender = 'customer', metadata = {}) {
    const messageEntry = {
      text: message,
      sender: sender,
      timestamp: new Date().toISOString(),
      metadata: metadata
    };
    
    this.conversation.messages.push(messageEntry);
    this.conversation.metadata.lastUpdateTime = new Date().toISOString();
    
    // Save to storage after each message
    this.saveToStorage();
    
    // eslint-disable-next-line no-console
    console.log('💬 Message captured:', messageEntry);
  }

  /**
   * Set conversation topic/subject
   */
  setTopic(topic) {
    this.conversation.metadata.topic = topic;
    this.saveToStorage();
  }

  /**
   * Save conversation to storage
   */
  saveToStorage() {
    try {
      const conversationData = JSON.stringify(this.conversation);
      
      // Use sessionStorage for same-tab navigation
      sessionStorage.setItem(this.STORAGE_KEY, conversationData);
      
      // Also save to localStorage as backup for new tabs
      localStorage.setItem(this.STORAGE_KEY, conversationData);
      
      // eslint-disable-next-line no-console
      console.log('💾 Conversation saved to storage');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to save conversation:', error);
    }
  }

  /**
   * Get formatted conversation for transfer
   */
  getFormattedConversation() {
    if (this.conversation.messages.length === 0) {
      return null;
    }

    return {
      messages: this.conversation.messages,
      metadata: this.conversation.metadata,
      formattedText: this.formatAsText()
    };
  }

  /**
   * Format conversation as readable text for prefill
   */
  formatAsText() {
    let formatted = '━━━ Previous Conversation ━━━\n';
    formatted += `Started: ${new Date(this.conversation.metadata.startTime).toLocaleTimeString()}\n`;
    
    if (this.conversation.metadata.topic) {
      formatted += `Topic: ${this.conversation.metadata.topic}\n`;
    }
    
    formatted += '\nConversation History:\n';
    formatted += '─────────────────────\n';
    
    this.conversation.messages.forEach(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const senderLabel = msg.sender === 'customer' ? 'You' : 'Support';
      formatted += `[${time}] ${senderLabel}: ${msg.text}\n`;
    });
    
    formatted += '━━━━━━━━━━━━━━━━━━━━━\n\n';
    formatted += 'Please continue with your question below:\n';
    
    return formatted;
  }

  /**
   * Get all messages for display in chat UI
   */
  getAllMessages() {
    return this.conversation.messages.map(msg => ({
      id: `${msg.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      text: msg.text,
      sender: msg.sender === 'customer' ? 'user' : 'business',
      timestamp: msg.timestamp,
      status: 'sent'
    }));
  }

  /**
   * Clear stored conversation
   */
  clearConversation() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY);
    
    // Reset conversation object
    this.conversation = {
      messages: [],
      metadata: {
        startTime: new Date().toISOString(),
        lastUpdateTime: null,
        topic: null,
        status: 'active',
        sessionId: this.generateSessionId()
      }
    };
    
    // eslint-disable-next-line no-console
    console.log('🧹 Conversation cleared');
  }

  /**
   * Prepare for transfer to support page
   */
  prepareTransfer() {
    const conversation = this.getFormattedConversation();
    
    if (!conversation) {
      // eslint-disable-next-line no-console
      console.log('⚠️ No conversation to transfer');
      return null;
    }

    // Mark conversation as transferred
    this.conversation.metadata.status = 'transferred';
    this.conversation.metadata.transferTime = new Date().toISOString();
    this.saveToStorage();

    // eslint-disable-next-line no-console
    console.log('🔄 Conversation prepared for transfer:', conversation);
    return conversation;
  }

  /**
   * Get conversation statistics
   */
  getStats() {
    return {
      messageCount: this.conversation.messages.length,
      customerMessages: this.conversation.messages.filter(m => m.sender === 'customer').length,
      agentMessages: this.conversation.messages.filter(m => m.sender === 'agent').length,
      startTime: this.conversation.metadata.startTime,
      lastUpdateTime: this.conversation.metadata.lastUpdateTime,
      sessionId: this.conversation.metadata.sessionId,
      status: this.conversation.metadata.status
    };
  }
}

// Create singleton instance
const chatHistoryManager = new ChatHistoryManager();

export default chatHistoryManager;
