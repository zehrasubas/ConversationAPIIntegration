// Shared Message Store for all API endpoints
// In production, replace with a database like MongoDB, PostgreSQL, or Redis

const fs = require('fs');
const path = require('path');

class MessageStore {
  constructor() {
    this.messages = {};
    this.listeners = new Set(); // SSE connections listening for new messages
    this.persistenceFile = '/tmp/messages.json'; // Vercel /tmp is shared between function calls
    this.loadFromPersistence();
  }

  // Load messages from persistence file
  loadFromPersistence() {
    try {
      if (fs.existsSync(this.persistenceFile)) {
        const data = fs.readFileSync(this.persistenceFile, 'utf8');
        this.messages = JSON.parse(data);
        console.log('📁 Loaded messages from persistence:', Object.keys(this.messages).length, 'users');
      }
    } catch (error) {
      console.error('❌ Error loading from persistence:', error);
      this.messages = {};
    }
  }

  // Save messages to persistence file
  saveToPersistence() {
    try {
      fs.writeFileSync(this.persistenceFile, JSON.stringify(this.messages, null, 2));
      console.log('💾 Saved messages to persistence');
    } catch (error) {
      console.error('❌ Error saving to persistence:', error);
    }
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
    
    // Save to persistence
    this.saveToPersistence();
    
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
    
    // Save changes to persistence
    this.saveToPersistence();
  }
}

// Create singleton instance
const messageStore = new MessageStore();

module.exports = messageStore; 