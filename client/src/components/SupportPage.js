import React, { useEffect, useState, useRef } from 'react';
import './SupportPage.css';

const SupportPage = ({ user }) => {
  const [ticketCreated, setTicketCreated] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear conversations on page load and reset Zendesk
  useEffect(() => {
    // Clear localStorage conversations on hard refresh
    const clearConversations = () => {
      try {
        localStorage.removeItem('conversationHistory');
        localStorage.removeItem('zE_oauth');
        localStorage.removeItem('ZD-store');
        
        // Clear any Zendesk-related session storage
        Object.keys(sessionStorage).forEach(key => {
          if (key.toLowerCase().includes('zendesk') || key.toLowerCase().includes('ze_')) {
            sessionStorage.removeItem(key);
          }
        });
        
        // eslint-disable-next-line no-console
        console.log('🧹 Cleared all conversation and Zendesk data');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error clearing conversation history:', error);
      }
    };

    clearConversations();
  }, []);
  const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
  const hasInitialized = useRef(false);

  /* eslint-disable react-hooks/exhaustive-deps */
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

    const replayConversationHistory = async (conversationHistory) => {
      try {
        // eslint-disable-next-line no-console
        console.log('🌅 Replaying conversation history in Zendesk...');
        
        const response = await fetch('/api/zendesk/replay-conversation', {
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
          // eslint-disable-next-line no-console
          console.log('✅ Conversation history replayed:', result.conversationId);
          console.log('📊 Messages replayed:', result.messagesReplayed);
          return result;
        } else {
          // eslint-disable-next-line no-console
          console.error('❌ Failed to replay conversation:', result);
          throw new Error(result.error || 'Failed to replay conversation');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error replaying conversation:', error);
        throw error;
      }
    };

    const initializeZendeskWidget = (conversationHistory, replayResult = null) => {
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

    const configureZendeskWidget = (conversationHistory, replayResult = null) => {
      // eslint-disable-next-line no-console
      console.log('⚙️ Configuring Zendesk widget...');
      
      // Wait for Zendesk to be fully loaded
      const checkZE = setInterval(() => {
        if (window.zE) {
          clearInterval(checkZE);
          
          try {
            // Log in user if we have their info
            if (user?.name && user?.email) {
              // eslint-disable-next-line no-console
              console.log('🔍 DEBUG: Logging in user:', user.name, user.email);
              window.zE('messenger', 'loginUser', {
                name: user.name,
                email: user.email,
                // If we have a replayed conversation, use the external ID
                ...(replayResult && { 
                  externalId: `website_user_${user.email.replace('@', '_at_')}` 
                })
              });
              // eslint-disable-next-line no-console
              console.log('✅ DEBUG: User logged in successfully');
            }
            
            // Set conversation tags
            window.zE('messenger', 'set', 'tags', ['chat-transfer', 'support-request']);
            // eslint-disable-next-line no-console
            console.log('✅ DEBUG: Tags set successfully');

            // If we have a replayed conversation, try to open that specific conversation
            if (replayResult?.conversationId) {
              // eslint-disable-next-line no-console
              console.log('🎯 Opening specific conversation:', replayResult.conversationId);
              
              // Try to navigate to the specific conversation
              try {
                window.zE('messenger', 'set', 'conversationId', replayResult.conversationId);
              } catch (error) {
                // eslint-disable-next-line no-console
                console.log('⚠️ Could not set specific conversation, opening normally');
              }
            }
            
            // Open widget with multiple attempts to ensure it opens
            const openWidget = () => {
              try {
                window.zE('messenger', 'open');
                // eslint-disable-next-line no-console
                console.log('✅ DEBUG: Widget opened successfully');
                
                // Force widget to be visible and on top
                setTimeout(() => {
                  const iframe = document.querySelector('iframe[title*="Messaging"]') || 
                                document.querySelector('iframe[title*="messaging"]') ||
                                document.querySelector('iframe[title*="Chat"]');
                  if (iframe) {
                    iframe.style.display = 'block !important';
                    iframe.style.visibility = 'visible !important';
                    iframe.style.zIndex = '9999999 !important';
                    // eslint-disable-next-line no-console
                    console.log('✅ Widget iframe forced visible');
                  }
                }, 500);
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('❌ Error opening widget:', error);
              }
            };

            // Try opening immediately
            openWidget();
            
            // Try again after a delay in case first attempt failed
            setTimeout(openWidget, 1000);
            setTimeout(openWidget, 3000);
            
            // Set metadata for the conversation
            setTimeout(() => {
              try {
                if (replayResult?.conversationId) {
                  // If we have a replayed conversation, just set basic metadata
                  // eslint-disable-next-line no-console
                  console.log('✅ Using replayed conversation with full history');
                  setTicketCreated(true);
                  setTicketId(replayResult.conversationId);
                } else {
                  // Fallback to traditional conversation fields approach
                  // eslint-disable-next-line no-console
                  console.log('🔍 DEBUG: Setting conversation fields for fallback...');
                  
                  let fullMessage = '';
                  if (conversationHistory && conversationHistory.length > 0) {
                    fullMessage = 'Previous conversation:\n\n';
                    conversationHistory.forEach((message) => {
                      const timeStr = formatTime(message.timestamp);
                      const sender = message.sender === 'user' ? '👤 Customer' : '🤖 System';
                      fullMessage += `${timeStr} - ${sender}: ${message.text}\n`;
                    });
                    fullMessage += '\n---\n\n🙋‍♀️ Customer requested human support.';
                  } else {
                    fullMessage = '🙋‍♀️ Customer requested human support.';
                  }

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
                }
                
                // Clear loading since we're done configuring
                setLoading(false);
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('❌ DEBUG: Failed to configure conversation:', error);
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
        
        // Replay conversation history in Zendesk
        let replayResult = null;
        try {
          replayResult = await replayConversationHistory(conversationHistory);
          // eslint-disable-next-line no-console
          console.log('🌅 Successfully replayed conversation history');
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('❌ Error replaying conversation, falling back to traditional approach:', error);
        }
        
        // Initialize Zendesk widget
        initializeZendeskWidget(conversationHistory, replayResult);
        
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
  /* eslint-enable react-hooks/exhaustive-deps */

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
          <div className="error-container">
            <div className="error-illustration">
              <div className="error-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h2>Unable to connect to support</h2>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="retry-button">
                <i className="fas fa-redo"></i> Try Again
              </button>
            </div>
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
            <div className="support-illustration">
              <div className="support-icon">
                <i className="fas fa-headset"></i>
              </div>
              <h2>Connecting you to support...</h2>
              <p>Please wait while we prepare your chat session</p>
            </div>
          </div>
        ) : (
          <div className="success-container">
            <div className="success-illustration">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Connected to Support</h2>
              <p>Your support chat is ready! The widget should open automatically.</p>
              {ticketCreated && ticketId && (
                <div className="ticket-info">
                  <i className="fas fa-ticket-alt"></i>
                  <span>Session: #{ticketId}</span>
                </div>
              )}
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