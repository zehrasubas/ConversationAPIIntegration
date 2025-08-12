/**
 * Zendesk Widget Integration with History Prefill
 * This handles loading conversation history and prefilling the Zendesk widget
 */

class ZendeskHistoryInjector {
  constructor() {
    this.STORAGE_KEY = 'chat_transfer_context';
    this.conversation = null;
    this.injectionAttempts = 0;
    this.maxAttempts = 50; // 5 seconds max wait
    this.isInjected = false;
  }

  /**
   * Initialize the integration
   */
  init() {
    // eslint-disable-next-line no-console
    console.log('🚀 Initializing Zendesk History Injector');
    
    // Load conversation from storage
    this.loadConversation();
    
    if (this.conversation) {
      // eslint-disable-next-line no-console
      console.log('📖 Found conversation to transfer:', this.conversation);
      
      // Wait for Zendesk widget to be ready
      this.waitForZendesk();
    } else {
      // eslint-disable-next-line no-console
      console.log('📭 No conversation history found');
      
      // Just open widget normally
      this.openZendeskNormally();
    }
  }

  /**
   * Load conversation from storage
   */
  loadConversation() {
    try {
      // Try sessionStorage first (same tab)
      let stored = sessionStorage.getItem(this.STORAGE_KEY);
      
      // Fallback to localStorage (new tab)
      if (!stored) {
        stored = localStorage.getItem(this.STORAGE_KEY);
      }
      
      if (stored) {
        this.conversation = JSON.parse(stored);
        
        // Only use conversation if it was transferred
        if (this.conversation.metadata.status !== 'transferred') {
          // eslint-disable-next-line no-console
          console.log('⚠️ Conversation not marked as transferred, ignoring');
          this.conversation = null;
          return;
        }
        
        // Clear storage after loading to prevent reuse
        this.clearStorage();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to load conversation:', error);
    }
  }

  /**
   * Clear stored conversation
   */
  clearStorage() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY);
    // eslint-disable-next-line no-console
    console.log('🧹 Cleared transfer storage');
  }

  /**
   * Wait for Zendesk widget to be available
   */
  waitForZendesk() {
    if (typeof window.zE !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('✅ Zendesk widget found, injecting history');
      this.injectHistory();
    } else if (this.injectionAttempts < this.maxAttempts) {
      this.injectionAttempts++;
      // eslint-disable-next-line no-console
      console.log(`⏳ Waiting for Zendesk widget... (attempt ${this.injectionAttempts})`);
      setTimeout(() => this.waitForZendesk(), 100);
    } else {
      // eslint-disable-next-line no-console
      console.error('❌ Zendesk widget not found after maximum attempts');
      this.openZendeskNormally();
    }
  }

  /**
   * Inject conversation history into Zendesk widget
   */
  injectHistory() {
    if (this.isInjected) return; // Prevent double injection
    
    try {
      // Wait for widget to be ready
      window.zE('messenger:on', 'ready', () => {
        if (this.isInjected) return; // Prevent double injection
        this.isInjected = true;
        
        // eslint-disable-next-line no-console
        console.log('📬 Zendesk messenger ready, prefilling conversation');
        
        // Get formatted conversation text
        const formattedText = this.conversation.formattedText || 
                            this.formatConversation();
        
        // Prefill the message field with conversation history
        window.zE('messenger', 'prefill', {
          message: {
            value: formattedText
          }
        });
        
        // Set any available metadata
        this.setMetadata();
        
        // Auto-open the widget immediately after prefilling
        setTimeout(() => {
          window.zE('messenger', 'open');
          // eslint-disable-next-line no-console
          console.log('✅ Zendesk widget auto-opened with conversation history');
        }, 1000);
        
        // Show notification to user
        this.showTransferNotification();
      });
      
      // Also try to open immediately in case messenger is already ready
      setTimeout(() => {
        window.zE('messenger', 'open');
      }, 500);
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to inject history:', error);
      this.openZendeskNormally();
    }
  }

  /**
   * Format conversation for display with better summarization
   */
  formatConversation() {
    if (!this.conversation || !this.conversation.messages) {
      return '';
    }

    const customerMessages = this.conversation.messages.filter(m => m.sender === 'customer');
    const agentMessages = this.conversation.messages.filter(m => m.sender === 'agent');
    const totalMessages = this.conversation.messages.length;
    
    // Create a conversation summary
    let formatted = '🔄 TRANSFERRED FROM WEBSITE CHAT\n';
    formatted += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    const startTime = new Date(this.conversation.metadata.startTime);
    formatted += `📅 Chat Started: ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}\n`;
    formatted += `💬 Total Messages: ${totalMessages} (${customerMessages.length} from customer, ${agentMessages.length} from support)\n`;
    
    if (this.conversation.metadata.topic) {
      formatted += `📋 Topic: ${this.conversation.metadata.topic}\n`;
    }
    
    formatted += '\n📝 CONVERSATION HISTORY:\n';
    formatted += '─────────────────────────────────\n\n';
    
    this.conversation.messages.forEach((msg, index) => {
      const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const senderLabel = msg.sender === 'customer' ? '👤 Customer' : '🎧 Support Bot';
      const messageNumber = index + 1;
      
      formatted += `${messageNumber}. [${time}] ${senderLabel}:\n`;
      formatted += `   "${msg.text}"\n\n`;
    });
    
    // Add summary for agent
    if (customerMessages.length > 0) {
      const lastCustomerMessage = customerMessages[customerMessages.length - 1];
      formatted += '🎯 SUMMARY FOR AGENT:\n';
      formatted += '─────────────────────\n';
      formatted += `• Customer was chatting on the website\n`;
      formatted += `• Last customer message: "${lastCustomerMessage.text}"\n`;
      formatted += `• Customer requested to speak with human support\n`;
      formatted += `• Full conversation history is shown above\n\n`;
    }
    
    formatted += '💡 Customer can continue their question below:\n';
    formatted += '(This history is for agent reference - customer sees their conversation continues seamlessly)\n\n';
    
    return formatted;
  }

  /**
   * Set metadata in Zendesk
   */
  setMetadata() {
    try {
      // Set conversation fields if available
      const fields = [];
      
      if (this.conversation.metadata.topic) {
        fields.push({
          id: 'subject',
          value: `Transferred: ${this.conversation.metadata.topic}`
        });
      }
      
      if (this.conversation.metadata.sessionId) {
        // Note: You may need to create custom fields in Zendesk for this
        fields.push({
          id: 'custom_field_session_id',
          value: this.conversation.metadata.sessionId
        });
      }
      
      if (fields.length > 0) {
        window.zE('messenger:set', 'conversationFields', fields);
      }
      
      // Add tags for agent context
      const tags = ['transferred_chat', 'has_previous_context'];
      if (this.conversation.metadata.topic) {
        tags.push(`topic_${this.conversation.metadata.topic.toLowerCase().replace(/\\s+/g, '_')}`);
      }
      
      window.zE('messenger:set', 'conversationTags', tags);
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to set metadata:', error);
    }
  }

  /**
   * Show notification about transfer
   */
  showTransferNotification() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'transfer-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 100000;
        font-family: Arial, sans-serif;
        max-width: 300px;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-size: 18px;">✓</div>
          <div>
            <div style="font-weight: bold;">Chat History Transferred</div>
            <div style="font-size: 13px; opacity: 0.9;">Your previous conversation has been loaded</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  /**
   * Open Zendesk normally without history
   */
  openZendeskNormally() {
    if (typeof window.zE !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('📱 Opening Zendesk widget without conversation history');
      setTimeout(() => {
        window.zE('messenger', 'open');
        // eslint-disable-next-line no-console
        console.log('✅ Zendesk widget opened (no history to transfer)');
      }, 1000);
    }
  }

  /**
   * Manual trigger to open widget (for button clicks)
   */
  openWidget() {
    if (typeof window.zE !== 'undefined') {
      window.zE('messenger', 'open');
    }
  }
}

// Create singleton instance
const zendeskIntegration = new ZendeskHistoryInjector();

export default zendeskIntegration;
