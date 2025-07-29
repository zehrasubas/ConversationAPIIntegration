// Zendesk Ticket Creation API Endpoint for Vercel
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationHistory, sessionId, userEmail, userName } = req.body;

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Format conversation history for Zendesk
    const formattedHistory = formatConversationHistory(conversationHistory);
    
    // Prepare user info
    const requesterEmail = userEmail || 'noreply@conversation-api-integration.vercel.app';
    const requesterName = userName || 'Website Visitor';

    const ticketData = {
      ticket: {
        subject: `Support Request - Chat Session ${sessionId}`,
        comment: {
          body: `Customer transferred from website chat widget.\n\n${formattedHistory}`,
          public: false
        },
        requester: {
          name: requesterName,
          email: requesterEmail
        },
        custom_fields: [
          {
            id: process.env.ZENDESK_CONVERSATION_HISTORY_FIELD_ID,
            value: formattedHistory
          },
          {
            id: process.env.ZENDESK_SESSION_ID_FIELD_ID,
            value: sessionId
          }
        ],
        tags: ['web-widget', 'chat-transfer', 'support-request', 'conversation-api'],
        priority: 'normal',
        type: 'question'
      }
    };

    console.log('🎫 Creating Zendesk ticket for session:', sessionId);

    // Create Basic Auth header
    const credentials = Buffer.from(
      `${process.env.ZENDESK_EMAIL}/token:${process.env.ZENDESK_API_TOKEN}`
    ).toString('base64');

    const response = await fetch(
      `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
      }
    );

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Zendesk ticket created successfully:', result.ticket.id);
      
      res.status(201).json({ 
        success: true, 
        ticketId: result.ticket.id,
        ticketUrl: result.ticket.url,
        sessionId: sessionId
      });
    } else {
      console.error('❌ Failed to create Zendesk ticket:', result);
      res.status(response.status).json({ 
        error: result.error?.title || 'Failed to create ticket',
        details: result.error?.message || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('❌ Error creating Zendesk ticket:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

function formatConversationHistory(history) {
  if (!history || history.length === 0) {
    return "No conversation history available - customer opened support directly.";
  }

  let formatted = "=== CONVERSATION HISTORY ===\n\n";
  
  history.forEach((entry, index) => {
    const timestamp = new Date(entry.timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const sender = entry.sender === 'user' ? '👤 Customer' : '🤖 System';
    const status = entry.status ? ` [${entry.status}]` : '';
    
    formatted += `[${timestamp}] ${sender}: ${entry.text}${status}\n\n`;
  });
  
  formatted += "=== END CONVERSATION HISTORY ===\n\n";
  formatted += "Customer has requested human support and been transferred to this Zendesk ticket.";
  
  return formatted;
} 