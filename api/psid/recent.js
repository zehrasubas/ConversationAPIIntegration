// Get the most recent PSID from webhook interactions
// Uses the messageStore to find PSIDs from recent webhook messages

const messageStore = require('../shared/messageStore');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Looking for recent PSID from webhook messages...');
    
    // Get all stored messages and find PSIDs
    const allMessages = messageStore.messages || {};
    console.log('📊 Available user IDs:', Object.keys(allMessages));
    
    // Filter for PSIDs (numeric, not session IDs)
    const psids = Object.keys(allMessages).filter(id => {
      return id.match(/^\d+$/) && !id.startsWith('session_');
    });
    
    console.log('🆔 Found PSIDs:', psids);
    
    if (psids.length > 0) {
      // Find the most recent PSID based on latest message
      let mostRecentPSID = null;
      let mostRecentTime = 0;
      
      psids.forEach(psid => {
        const messages = allMessages[psid];
        if (messages && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          const messageTime = new Date(lastMessage.timestamp).getTime();
          
          if (messageTime > mostRecentTime) {
            mostRecentTime = messageTime;
            mostRecentPSID = psid;
          }
        }
      });
      
      if (mostRecentPSID) {
        console.log('✅ Most recent PSID:', mostRecentPSID);
        res.json({
          success: true,
          psid: mostRecentPSID,
          timestamp: new Date(mostRecentTime).toISOString(),
          messageCount: allMessages[mostRecentPSID].length,
          note: 'PSID from most recent webhook message'
        });
        return;
      }
    }
    
    // No PSIDs found
    console.log('❌ No PSIDs found in webhook messages');
    res.json({
      success: false,
      message: 'No recent webhook interactions found. User needs to message the Facebook Page first.',
      note: 'Send a message to the Facebook Page to establish PSID',
      availableUserIds: Object.keys(allMessages)
    });
    
  } catch (error) {
    console.error('❌ Error getting recent PSID:', error);
    res.status(500).json({
      error: 'Failed to get recent PSID',
      details: error.message
    });
  }
}
