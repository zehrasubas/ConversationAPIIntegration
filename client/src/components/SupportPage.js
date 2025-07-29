import React, { useEffect, useState } from 'react';
import './SupportPage.css';

const SupportPage = ({ user }) => {
  const [ticketCreated, setTicketCreated] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const createSupportTicket = async (conversationHistory) => {
      try {
        // eslint-disable-next-line no-console
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
          // eslint-disable-next-line no-console
          console.log('✅ Support ticket created:', result.ticketId);
        } else {
          throw new Error(result.error || 'Failed to create ticket');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to create support ticket:', error);
        setError(`Failed to create support ticket: ${error.message}`);
        throw error;
      }
    };

    const initializeZendeskWidget = (conversationHistory) => {
      // eslint-disable-next-line no-console
      console.log('🔄 Initializing Zendesk widget...');
      
      // Load Zendesk script if not already loaded
      if (!window.zE) {
        const script = document.createElement('script');
        script.id = 'ze-snippet';
        script.src = 'https://static.zdassets.com/ekr/snippet.js?key=d00c5a70-85da-47ea-bd7d-7445bcc31c38';
        script.async = true;
        
        script.onload = () => {
          // eslint-disable-next-line no-console
          console.log('✅ Zendesk script loaded');
          configureZendeskWidget(conversationHistory);
        };
        
        script.onerror = () => {
          // eslint-disable-next-line no-console
          console.error('❌ Failed to load Zendesk script');
          setError('Failed to load support widget. Please refresh the page.');
          setLoading(false);
        };
        
        document.head.appendChild(script);
      } else {
        // eslint-disable-next-line no-console
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
            // Set user information first - using correct modern API
            if (user?.name && user?.email) {
              window.zE('messenger', 'loginUser', function(callback) {
                callback({
                  name: user.name,
                  email: user.email
                });
              });
            }

            // Debug and send conversation history
            // eslint-disable-next-line no-console
            console.log('🔍 DEBUG: Conversation history received:', conversationHistory);
            // eslint-disable-next-line no-console
            console.log('🔍 DEBUG: History length:', conversationHistory.length);
            
            if (conversationHistory && conversationHistory.length > 0) {
              // eslint-disable-next-line no-console
              console.log('🔍 DEBUG: Processing conversation history...');
              
              // Format history as one message and send it automatically
              const historyText = conversationHistory.map(msg => {
                const time = formatTime(msg.timestamp);
                const sender = msg.sender === 'user' ? '👤 Me' : '🤖 Assistant';
                return `${time} - ${sender}: ${msg.text}`;
              }).join('\n');

              const fullMessage = `Previous conversation:\n\n${historyText}\n\n---\n🎯 I need human support to continue this conversation.`;
              
              // eslint-disable-next-line no-console
              console.log('🔍 DEBUG: Formatted message:', fullMessage);
              
              // Use conversation fields to pass metadata to the ticket (run only once)
              setTimeout(() => {
                // eslint-disable-next-line no-console
                console.log('🔍 DEBUG: Setting conversation fields...');
                
                try {
                  // Set conversation fields with the history - this goes to the ticket
                  window.zE('messenger:set', 'conversationFields', [
                    {
                      id: '39467850731803', // Conversation History field ID
                      value: fullMessage
                    },
                    {
                      id: '39467890996891', // Chat Session ID field ID
                      value: sessionId
                    }
                  ]);
                  // eslint-disable-next-line no-console
                  console.log('✅ DEBUG: Conversation fields set successfully');
                  
                  // Clear loading since we're done configuring
                  setLoading(false);
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error('❌ DEBUG: Failed to set conversation fields:', error);
                  setLoading(false);
                }
              }, 500); // Faster execution
            } else {
              // eslint-disable-next-line no-console
              console.log('🔍 DEBUG: No conversation history found');
            }

            // Set conversation tags
            try {
              window.zE('messenger:set', 'conversationTags', [
                'chat-transfer', 
                'support-request', 
                'web-widget',
                `session-${sessionId}`
              ]);
            } catch (error) {
              // eslint-disable-next-line no-console
              console.log('⚠️ Tags not supported, skipping...');
            }
            
            // Show and open the widget immediately
            window.zE('messenger', 'show');
            window.zE('messenger', 'open');
            
            // eslint-disable-next-line no-console
            console.log('✅ Zendesk widget configured with conversation history');
            
            // Clear loading state immediately since widget is ready
            setLoading(false);

          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('❌ Error configuring Zendesk widget:', error);
            // Don't show error if widget is visible - just log it
            setLoading(false);
          }
        }
      }, 500);

      // Shorter timeout and don't error if widget appears to be working
      setTimeout(() => {
        clearInterval(checkZE);
        // Force clear loading state after timeout
        setLoading(false);
        // eslint-disable-next-line no-console
        console.log('⏰ Zendesk widget initialization complete');
      }, 3000); // Reduced timeout
    };

    const initializeSupportPage = async () => {
      try {
        // Get conversation history from localStorage
        const getConversationHistory = () => {
          try {
            const stored = localStorage.getItem('conversationHistory');
            const history = stored ? JSON.parse(stored) : [];
            // eslint-disable-next-line no-console
            console.log('🔍 DEBUG: Retrieved conversation history:', history);
            // eslint-disable-next-line no-console
            console.log('🔍 DEBUG: Number of messages:', history.length);
            return history;
          } catch (error) {
            // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.error('❌ Failed to initialize support page:', error);
        setError('Failed to initialize support. Please try again.');
        setLoading(false);
      }
    };

    // Initialize support page
    initializeSupportPage();
  }, [sessionId, user?.name, user?.email]); // Simplified dependencies to prevent loops

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