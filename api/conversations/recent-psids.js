// Get recent PSIDs from stored webhook messages
const messageStore = require('../shared/messageStore');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Getting recent PSIDs from message store...');

    // Get all stored PSIDs from message store
    const allMessages = messageStore.messages || {};
    const psids = Object.keys(allMessages).filter(id => {
      // Filter out session IDs, keep only PSIDs (usually numeric)
      return id.match(/^\d+$/) && !id.startsWith('session_');
    });

    console.log('📝 Found PSIDs in message store:', psids);

    const recentPsids = psids.map(psid => ({
      psid: psid,
      messageCount: allMessages[psid]?.length || 0,
      lastMessage: allMessages[psid]?.[allMessages[psid].length - 1]?.timestamp || null
    }));

    // Sort by most recent message
    recentPsids.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage) - new Date(a.lastMessage);
    });

    console.log(`✅ Found ${recentPsids.length} PSIDs from webhook messages`);

    res.json({
      success: true,
      psids: recentPsids,
      count: recentPsids.length,
      note: 'PSIDs from webhook messages - these are real PSIDs that can be used for messaging',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting recent PSIDs:', error);
    res.status(500).json({
      error: 'Failed to get recent PSIDs',
      details: error.message
    });
  }
}
