// Shared Message Store for all API endpoints
// Using a simple global variable approach for now (will reset between cold starts)

class MessageStore {
  constructor() {
    // Use global variable to persist between warm starts
    if (!global.messageStoreData) {
      global.messageStoreData = {};
    }
    this.messages = global.messageStoreData;
    this.listeners = new Set(); // SSE connections listening for new messages
    console.log('🏗️ MessageStore initialized with', Object.keys(this.messages).length, 'users');
    console.log('🌍 Global messageStoreData keys:', Object.keys(global.messageStoreData));
  }

  addMessage(userId, message) {
    console.log('📝 MessageStore.addMessage called with:', { userId, message });
    
    if (!this.messages[userId]) {
      this.messages[userId] = [];
      console.log('📂 Created new message array for user:', userId);
    }
    
    // Ensure message has required fields
    const formattedMessage = {
      id: message.id || Date.now().toString(),
      text: message.text,
      sender: message.sender, // 'user' or 'business'
      timestamp: message.timestamp || new Date().toISOString(),
      ...message // spread any additional fields
    };
    
    console.log('📝 Formatted message:', formattedMessage);
    this.messages[userId].push(formattedMessage);
    console.log('📊 Messages for user', userId, ':', this.messages[userId].length);
    
    // Keep only last 100 messages per user to prevent memory issues
    if (this.messages[userId].length > 100) {
      this.messages[userId] = this.messages[userId].slice(-100);
    }
    
    // Update global reference
    global.messageStoreData = this.messages;
    
    console.log('✅ Message added for user', userId, '- Total messages for user:', this.messages[userId].length);
    console.log('📝 Message content:', JSON.stringify(formattedMessage, null, 2));
    
    // Notify all SSE listeners about the new message
    this.notifyListeners(userId, formattedMessage);
    
    return formattedMessage;
  }

  getMessages(userId) {
    return this.messages[userId] || [];
  }

  // Get messages newer than a specific timestamp
  getNewMessages(userId, since) {
    const userMessages = this.messages[userId] || [];
    if (!since) return userMessages;
    
    const sinceTime = new Date(since).getTime();
    return userMessages.filter(msg => {
      const msgTime = new Date(msg.timestamp).getTime();
      return msgTime > sinceTime;
    });
  }

  // SSE Listener management
  addListener(listener) {
    this.listeners.add(listener);
    console.log(`SSE listener added. Total listeners: ${this.listeners.size}`);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
    console.log(`SSE listener removed. Total listeners: ${this.listeners.size}`);
  }

  notifyListeners(userId, message) {
    const eventData = {
      type: 'new_message',
      userId,
      message,
      timestamp: new Date().toISOString()
    };

    // Send to all connected SSE clients
    this.listeners.forEach(listener => {
      try {
        listener.send(eventData);
      } catch (error) {
        console.error('Error sending SSE message:', error);
        // Remove broken listener
        this.listeners.delete(listener);
      }
    });

    if (this.listeners.size > 0) {
      console.log(`Notified ${this.listeners.size} SSE listeners about new message for user ${userId}`);
    }
  }

  // Clear old messages (cleanup function)
  clearOldMessages(olderThanHours = 24) {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    
    for (const userId in this.messages) {
      this.messages[userId] = this.messages[userId].filter(msg => {
        return new Date(msg.timestamp) > cutoffTime;
      });
      
      // Remove empty arrays
      if (this.messages[userId].length === 0) {
        delete this.messages[userId];
      }
    }
    
    // Update global reference
    global.messageStoreData = this.messages;
  }
}

// Create singleton instance
const messageStore = new MessageStore();

module.exports = messageStore; 