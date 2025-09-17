// File-based storage for serverless functions
// This writes to /tmp which is available across function invocations in the same container
const fs = require('fs');
const path = require('path');

// Use /tmp directory for storage in serverless environment
const STORAGE_DIR = '/tmp';
const MESSAGES_FILE = path.join(STORAGE_DIR, 'messages.json');

// Ensure storage directory exists
function ensureStorageDir() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating storage directory:', error);
  }
}

// Read all messages from file
function readMessages() {
  ensureStorageDir();
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error reading messages file:', error);
    return {};
  }
}

// Write all messages to file
function writeMessages(messages) {
  ensureStorageDir();
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing messages file:', error);
    return false;
  }
}

// Store a message for a PSID
function storeMessage(psid, message) {
  try {
    const messages = readMessages();
    
    if (!messages[psid]) {
      messages[psid] = [];
    }
    
    messages[psid].push(message);
    
    // Keep only last 50 messages per PSID
    if (messages[psid].length > 50) {
      messages[psid] = messages[psid].slice(-50);
    }
    
    const success = writeMessages(messages);
    
    if (success) {
      console.log(`📁 Stored message for PSID ${psid}. Total: ${messages[psid].length}`);
      console.log(`📊 All PSIDs in file storage: ${Object.keys(messages)}`);
    } else {
      console.error(`❌ Failed to store message for PSID ${psid}`);
    }
    
    return message;
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
}

// Get messages for a PSID
function getMessages(psid) {
  try {
    const messages = readMessages();
    const userMessages = messages[psid] || [];
    console.log(`📁 Retrieved ${userMessages.length} messages for PSID ${psid} from file`);
    return userMessages;
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

// Get all PSIDs with messages
function getAllPSIDs() {
  try {
    const messages = readMessages();
    return Object.keys(messages);
  } catch (error) {
    console.error('Error getting PSIDs:', error);
    return [];
  }
}

// Clear messages for a PSID
function clearMessages(psid) {
  try {
    const messages = readMessages();
    delete messages[psid];
    writeMessages(messages);
    console.log(`🗑️ Cleared messages for PSID ${psid} from file`);
  } catch (error) {
    console.error('Error clearing messages:', error);
  }
}

module.exports = {
  storeMessage,
  getMessages,
  getAllPSIDs,
  clearMessages
};
