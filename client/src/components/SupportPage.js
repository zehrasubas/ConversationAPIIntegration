import React, { useEffect, useState } from 'react';
import './SupportPage.css';

const SupportPage = ({ user }) => {
  const [ticketCreated, setTicketCreated] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    const initializeSupportPage = async () => {
      try {
        // Get conversation history from localStorage
        const getConversationHistory = () => {
          try {
            const stored = localStorage.getItem('conversationHistory');
            const history = stored ? JSON.parse(stored) : [];
            console.log('📝 Retrieved conversation history:', history.length, 'messages');
            return history;
          } catch (error) {
            console.error('❌ Error retrieving conversation history:', error);
            return [];
          }
        };

        const conversationHistory = getConversationHistory();
        
        // Create Zendesk ticket with conversation history
        await createSupportTicket(conversationHistory);
        
        // Initialize Zendesk widget
        initializeZendeskWidget(conversationHistory);
        
      } catch (error) {
        console.error('❌ Failed to initialize support page:', error);
        setError('Failed to initialize support. Please try again.');
        setLoading(false);
      }
    };

    // Initialize support page
    initializeSupportPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array is fine - this should only run once on mount

  const createSupportTicket = async (conversationHistory) => {
    try {
      console.log('🎫 Creating support ticket...');
      
      const response = await fetch('/api/zendesk/create-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory,
          sessionId,
          userEmail: user?.email || 'visitor@conversation-api-integration.vercel.app',
          userName: user?.name || 'Website Visitor'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTicketCreated(true);
        setTicketId(result.ticketId);
        console.log('✅ Support ticket created:', result.ticketId);
      } else {
        throw new Error(result.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('❌ Failed to create support ticket:', error);
      setError(`Failed to create support ticket: ${error.message}`);
      throw error;
    }
  };

  const initializeZendeskWidget = (conversationHistory) => {
    console.log('🔄 Initializing Zendesk widget...');
    
    // Load Zendesk script if not already loaded
    if (!window.zE) {
      const script = document.createElement('script');
      script.id = 'ze-snippet';
      script.src = 'https://static.zdassets.com/ekr/snippet.js?key=d00c5a70-85da-47ea-bd7d-7445bcc31c38';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Zendesk script loaded');
        configureZendeskWidget(conversationHistory);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load Zendesk script');
        setError('Failed to load support widget. Please refresh the page.');
        setLoading(false);
      };
      
      document.head.appendChild(script);
    } else {
      console.log('✅ Zendesk already loaded');
      configureZendeskWidget(conversationHistory);
    }
  };

  const configureZendeskWidget = (conversationHistory) => {
    // Wait for Zendesk to be ready
    const checkZE = setInterval(() => {
      if (window.zE) {
        clearInterval(checkZE);
        
        try {
          // Set user information
          if (user?.name && user?.email) {
            window.zE('messenger:set', 'userFields', {
              name: user.name,
              email: user.email
            });
          }

          // Set conversation fields with history and session ID
          const conversationFields = [
            {
              id: '39467850731803', // Conversation History field ID
              value: formatConversationHistory(conversationHistory)
            },
            {
              id: '39467890996891', // Chat Session ID field ID  
              value: sessionId
            }
          ];

          window.zE('messenger:set', 'conversationFields', conversationFields);

          // Set conversation tags
          window.zE('messenger:set', 'conversationTags', [
            'chat-transfer', 
            'support-request', 
            'web-widget',
            `session-${sessionId}`
          ]);

          // Configure widget appearance
          window.zE('messenger:set', 'locale', 'en-US');
          
          // Show and open the widget
          setTimeout(() => {
            window.zE('messenger', 'show');
            window.zE('messenger', 'open');
            console.log('✅ Zendesk widget opened');
            setLoading(false);
          }, 1000);

          // Set up event listeners
          window.zE('messenger:on', 'open', () => {
            console.log('📖 Zendesk widget opened by user');
          });

          window.zE('messenger:on', 'close', () => {
            console.log('📕 Zendesk widget closed by user');
          });

          window.zE('messenger:on', 'unreadCountChanged', (count) => {
            console.log('📬 Unread messages:', count);
          });

        } catch (error) {
          console.error('❌ Error configuring Zendesk widget:', error);
          setError('Failed to configure support widget.');
          setLoading(false);
        }
      }
    }, 500);

    // Timeout fallback
    setTimeout(() => {
      clearInterval(checkZE);
      if (loading) {
        console.error('⏰ Zendesk widget initialization timeout');
        setError('Support widget loading timeout. Please refresh the page.');
        setLoading(false);
      }
    }, 15000);
  };



  const formatConversationHistory = (history) => {
    if (!history || history.length === 0) {
      return 'No previous conversation history.';
    }
    
    return history.map(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const sender = entry.sender === 'user' ? 'Customer' : 'System';
      const status = entry.status ? ` [${entry.status}]` : '';
      return `[${time}] ${sender}: ${entry.text}${status}`;
    }).join('\n');
  };



  const handleBackToWebsite = () => {
    // Clear the conversation history since user is getting support
    localStorage.removeItem('conversationHistory');
    window.location.href = '/';
  };

  if (error) {
    return (
      <div className="support-page">
        <div className="support-header">
          <div className="header-content">
            <button onClick={handleBackToWebsite} className="back-button">
              ← Back to Website
            </button>
            <h1>Support Center</h1>
          </div>
        </div>
        
        <div className="support-content">
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <h2>Support Unavailable</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="support-page">
      <div className="support-header">
        <div className="header-content">
          <button onClick={handleBackToWebsite} className="back-button">
            ← Back to Website
          </button>
          <h1>Support Center</h1>
          {ticketCreated && (
            <div className="ticket-info">
              <span className="ticket-created">
                ✅ Ticket #{ticketId} created
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="support-content">
        <div className="welcome-section">
          <h2>Welcome to Support</h2>
          <p>
            {user?.name ? `Hi ${user.name}! ` : 'Hi! '}
            We've transferred your conversation to our support team. 
            {ticketCreated ? ' A support ticket has been created with your conversation history.' : ''}
          </p>
          
          {loading && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <span>Loading support chat...</span>
            </div>
          )}
        </div>
        
        {/* Zendesk widget will be injected here automatically */}
        <div id="zendesk-widget-container">
          {/* Widget appears here automatically when loaded */}
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 