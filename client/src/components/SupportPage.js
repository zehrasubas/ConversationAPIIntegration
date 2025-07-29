import React, { useEffect, useState, useRef } from 'react';
import './SupportPage.css';

const SupportPage = ({ user }) => {
  const [ticketCreated, setTicketCreated] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
  const hasInitialized = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      // eslint-disable-next-line no-console
      console.log('🔄 Support page already initialized, skipping...');
      return;
    }
    
    hasInitialized.current = true;
    // eslint-disable-next-line no-console
    console.log('🚀 Initializing support page for the first time...');
    
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
          // eslint-disable-next-line no-console
          console.error('❌ Failed to create support ticket:', result);
          setError('Failed to create support ticket. Please try again.');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error creating support ticket:', error);
        setError(error.message || 'Failed to create support ticket');
      }
    };

    const initializeZendeskWidget = (conversationHistory) => {
      // Load Zendesk script if not already loaded
      if (!window.zE) {
        // eslint-disable-next-line no-console
        console.log('📦 Loading Zendesk script...');
        
        const script = document.createElement('script');
        script.id = 'ze-snippet';
        script.src = 'https://static.zdassets.com/ekr/snippet.js?key=d00c5a70-85da-47ea-bd7d-7445bcc31c38';
        script.async = true;
        
        script.onload = () => {
          // eslint-disable-next-line no-console
          console.log('✅ Zendesk script loaded');
          setTimeout(() => {
            configureZendeskWidget(conversationHistory);
          }, 500);
        };
        
        script.onerror = () => {
          // eslint-disable-next-line no-console
          console.error('❌ Failed to load Zendesk script');
          setError('Failed to load support widget');
          setLoading(false);
        };
        
        document.head.appendChild(script);
      } else {
        // eslint-disable-next-line no-console
        console.log('✅ Zendesk already loaded');
        setTimeout(() => {
          configureZendeskWidget(conversationHistory);
        }, 500);
      }
    };

    const configureZendeskWidget = (conversationHistory) => {
      // eslint-disable-next-line no-console
      console.log('⚙️ Configuring Zendesk widget...');
      
      // Wait for Zendesk to be fully loaded
      const checkZE = setInterval(() => {
        if (window.zE) {
          clearInterval(checkZE);
          
          try {
            // eslint-disable-next-line no-console
            console.log('🔍 DEBUG: Processing conversation history...');
            
            // Process conversation history
            let fullMessage = '';
            if (conversationHistory && conversationHistory.length > 0) {
              // eslint-disable-next-line no-console
              console.log('🔍 DEBUG: History length:', conversationHistory.length);
              
              fullMessage = 'Previous conversation:\n\n';
              
              conversationHistory.forEach((message) => {
                const timeStr = formatTime(message.timestamp);
                const sender = message.type === 'user' ? '👤 Me' : '🤖 Bot';
                fullMessage += `${timeStr} - ${sender}: ${message.message}\n`;
              });
              
              fullMessage += '\n---\n\n🙋‍♀️ I need human support to continue this conversation.';
            } else {
              fullMessage = '🙋‍♀️ I need human support to continue this conversation.';
            }
            
            // eslint-disable-next-line no-console
            console.log('🔍 DEBUG: Formatted message:', fullMessage);
            
            // Log in user if we have their info
            if (user?.name && user?.email) {
              // eslint-disable-next-line no-console
              console.log('🔍 DEBUG: Logging in user:', user.name, user.email);
              window.zE('messenger', 'loginUser', {
                name: user.name,
                email: user.email
              });
              // eslint-disable-next-line no-console
              console.log('✅ DEBUG: User logged in successfully');
            }
            
            // Set conversation tags
            window.zE('messenger', 'set', 'tags', ['chat-transfer', 'support-request']);
            // eslint-disable-next-line no-console
            console.log('✅ DEBUG: Tags set successfully');
            
            // Open widget immediately 
            window.zE('messenger', 'open');
            // eslint-disable-next-line no-console
            console.log('✅ DEBUG: Widget opened successfully');
            
            // Use conversation fields to pass metadata to the ticket
            setTimeout(() => {
              // eslint-disable-next-line no-console
              console.log('🔍 DEBUG: Setting conversation fields...');
              try {
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
            }, 500);
            
            // eslint-disable-next-line no-console
            console.log('✅ Zendesk widget configured with conversation history');
            
            // Force clear loading state
            setTimeout(() => {
              setLoading(false);
              // eslint-disable-next-line no-console
              console.log('🎯 Loading state cleared - widget should be visible');
            }, 100);

          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('❌ Error configuring Zendesk widget:', error);
            setLoading(false);
          }
        }
      }, 500);

      // Timeout fallback
      setTimeout(() => {
        clearInterval(checkZE);
        setLoading(false);
        // eslint-disable-next-line no-console
        console.log('⏰ Zendesk widget initialization complete');
      }, 3000);
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
  }, []); // Empty dependency array with ESLint disable comment above

  const handleBackToWebsite = () => {
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
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Connecting you to support...</p>
          </div>
        ) : (
          <div className="support-ready">
            <div className="support-animation">
              <div className="floating-icon" style={{top: '10%', left: '15%', animationDelay: '0s'}}>💬</div>
              <div className="floating-icon" style={{top: '20%', right: '20%', animationDelay: '1s'}}>🎧</div>
              <div className="floating-icon" style={{bottom: '30%', left: '10%', animationDelay: '2s'}}>📞</div>
              <div className="floating-icon" style={{bottom: '15%', right: '15%', animationDelay: '0.5s'}}>💡</div>
              <div className="floating-icon" style={{top: '40%', left: '50%', animationDelay: '1.5s'}}>🚀</div>
            </div>
          </div>
        )}
        
        <div id="zendesk-widget-container">
          {/* Zendesk widget appears here automatically */}
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 