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
            console.log('🔍 DEBUG: Retrieved conversation history:', history);
            console.log('🔍 DEBUG: Number of messages:', history.length);
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
          // Set user information first
          if (user?.name && user?.email) {
            window.zE('messenger:set', 'userFields', {
              name: user.name,
              email: user.email
            });
          }

          // Debug and send conversation history
          console.log('🔍 DEBUG: Conversation history received:', conversationHistory);
          console.log('🔍 DEBUG: History length:', conversationHistory.length);
          
          if (conversationHistory && conversationHistory.length > 0) {
            console.log('🔍 DEBUG: Processing conversation history...');
            
            // Set user info first
            window.zE('messenger:set', 'prefill', {
              name: {
                value: user?.name || 'Website Visitor',
                readOnly: true
              },
              email: {
                value: user?.email || 'visitor@conversation-api-integration.vercel.app',
                readOnly: true
              }
            });

            // Format history as one initial message
            const historyText = conversationHistory.map(msg => {
              const time = formatTime(msg.timestamp);
              const sender = msg.sender === 'user' ? '👤 Me' : '🤖 Assistant';
              return `${time} - ${sender}: ${msg.text}`;
            }).join('\n');

            const fullMessage = `Previous conversation:\n\n${historyText}\n\n---\n🎯 I need human support to continue this conversation.`;
            
            console.log('🔍 DEBUG: Formatted message:', fullMessage);
            
            // Try multiple approaches to ensure the conversation history is visible
            
            // Approach 1: Set prefill message (should appear in input field)
            setTimeout(() => {
              console.log('🔍 DEBUG: Attempting prefill approach...');
              
              try {
                window.zE('messenger:set', 'prefill', {
                  name: {
                    value: user?.name || 'Website Visitor',
                    readOnly: false
                  },
                  email: {
                    value: user?.email || 'visitor@conversation-api-integration.vercel.app',
                    readOnly: false
                  },
                  message: {
                    value: fullMessage,
                    readOnly: false
                  }
                });
                console.log('✅ DEBUG: Prefill set successfully');
              } catch (error) {
                console.error('❌ DEBUG: Prefill failed:', error);
              }
            }, 1000);

            // Approach 2: Try conversation fields 
            setTimeout(() => {
              console.log('🔍 DEBUG: Attempting conversation fields approach...');
              
              try {
                window.zE('messenger:set', 'conversationFields', [
                  {
                    id: 'conversation_history',
                    value: fullMessage
                  }
                ]);
                console.log('✅ DEBUG: Conversation fields set successfully');
              } catch (error) {
                console.error('❌ DEBUG: Conversation fields failed:', error);
              }
            }, 1500);
          } else {
            console.log('🔍 DEBUG: No conversation history found');
          }

          // Set conversation tags
          window.zE('messenger:set', 'conversationTags', [
            'chat-transfer', 
            'support-request', 
            'web-widget',
            `session-${sessionId}`
          ]);

          // Configure widget appearance
          window.zE('messenger:set', 'locale', 'en-US');
          
          // Show and open the widget immediately
          window.zE('messenger', 'show');
          window.zE('messenger', 'open');
          
          console.log('✅ Zendesk widget configured with conversation history');
          setLoading(false);

        } catch (error) {
          console.error('❌ Error configuring Zendesk widget:', error);
          // Don't show error if widget is visible - just log it
          setLoading(false);
        }
      }
    }, 500);

    // Shorter timeout and don't error if widget appears to be working
    setTimeout(() => {
      clearInterval(checkZE);
      if (loading) {
        console.log('⏰ Zendesk widget check timeout - but widget may still be working');
        setLoading(false); // Don't set error, just stop loading
      }
    }, 8000);
  };



  const formatConversationHistory = (history) => {
    if (!history || history.length === 0) {
      return 'No previous conversation history.';
    }
    
    return history.map((entry, index) => {
      const time = formatTime(entry.timestamp);
      const sender = entry.sender === 'user' ? '👤 Customer' : '🤖 Assistant';
      return `${time} - ${sender}: ${entry.text}`;
    }).join('\n');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <div className="support-image">
            <div 
              style={{
                width: '100%',
                height: '300px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Animated floating elements */}
              <div className="support-animation">
                <div className="floating-icon" style={{animationDelay: '0s'}}>💬</div>
                <div className="floating-icon" style={{animationDelay: '1s'}}>🎧</div>
                <div className="floating-icon" style={{animationDelay: '2s'}}>⚡</div>
                <div className="floating-icon" style={{animationDelay: '0.5s'}}>💡</div>
                <div className="floating-icon" style={{animationDelay: '1.5s'}}>🚀</div>
              </div>
              <div style={{
                fontSize: '4rem',
                color: 'white',
                textAlign: 'center',
                zIndex: 2
              }}>
                🎯
              </div>
            </div>
          </div>
          
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