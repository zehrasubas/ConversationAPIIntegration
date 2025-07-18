// Initialize Conversation API Endpoint for Vercel
const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { psid } = req.body;
    console.log('🔄 Initializing conversation for PSID:', psid);

    if (!psid) {
      return res.status(400).json({ error: 'PSID is required' });
    }

    // Call Meta's Conversations API to get or create conversation
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.PAGE_ID}/conversations?platform=messenger&user_id=${psid}&access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();
    console.log('✅ Conversation data:', data);

    if (!response.ok) {
      console.error('❌ Failed to initialize conversation:', data);
      throw new Error(data.error?.message || 'Failed to initialize conversation');
    }

    // If no existing conversation, create one
    if (!data.data || data.data.length === 0) {
      console.log('📝 No existing conversation found, creating new one...');
      const createResponse = await fetch(
        `https://graph.facebook.com/v19.0/${process.env.PAGE_ID}/conversations?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform: 'messenger',
            user_id: psid
          })
        }
      );

      const createData = await createResponse.json();
      console.log('✅ Created new conversation:', createData);

      if (!createResponse.ok) {
        console.error('❌ Failed to create conversation:', createData);
        throw new Error(createData.error?.message || 'Failed to create conversation');
      }

      return res.json({
        success: true,
        conversation: createData
      });
    }

    // Return existing conversation
    return res.json({
      success: true,
      conversation: data.data[0]
    });
  } catch (error) {
    console.error('❌ Error initializing conversation:', error);
    res.status(500).json({
      error: 'Failed to initialize conversation',
      details: error.message
    });
  }
} 