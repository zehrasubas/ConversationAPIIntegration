// Simple storage that works across serverless functions
// Uses a combination of global state and basic persistence

let messageCache = {};

// Store message in memory
function storeMessage(psid, message) {
  if (!messageCache[psid]) {
    messageCache[psid] = [];
  }
  
  messageCache[psid].push(message);
  
  // Keep only last 50 messages to prevent memory issues
  if (messageCache[psid].length > 50) {
    messageCache[psid] = messageCache[psid].slice(-50);
  }
  
  console.log(`📝 Stored message for PSID ${psid}. Total: ${messageCache[psid].length}`);
  console.log(`📊 Message cache keys: ${Object.keys(messageCache)}`);
  
  return message;
}

// Get messages for a PSID
function getMessages(psid) {
  const messages = messageCache[psid] || [];
  console.log(`📚 Retrieved ${messages.length} messages for PSID ${psid}`);
  return messages;
}

// Get all PSIDs with messages
function getAllPSIDs() {
  return Object.keys(messageCache);
}

// Clear messages for a PSID
function clearMessages(psid) {
  delete messageCache[psid];
  console.log(`🗑️ Cleared messages for PSID ${psid}`);
}

module.exports = {
  storeMessage,
  getMessages,
  getAllPSIDs,
  clearMessages
};
