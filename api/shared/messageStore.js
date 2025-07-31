// Shared Message Store for all API endpoints
// In production, replace with a database like MongoDB, PostgreSQL, or Redis

class MessageStore {
  constructor() {
    this.messages = {};
  }

  addMessage(userId, message) {
    if (!this.messages[userId]) {
      this.messages[userId] = [];
    }
    
    // Ensure message has required fields
    const formattedMessage = {
      id: message.id || Date.now().toString(),
      text: message.text,
      sender: message.sender, // 'user' or 'business'
      timestamp: message.timestamp || new Date().toISOString(),
      ...message // spread any additional fields
    };
    
    this.messages[userId].push(formattedMessage);
    
    // Keep only last 100 messages per user to prevent memory issues
    if (this.messages[userId].length > 100) {
      this.messages[userId] = this.messages[userId].slice(-100);
    }
    
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
  }
}

// Create singleton instance
const messageStore = new MessageStore();

module.exports = messageStore; 