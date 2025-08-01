import React, { useEffect, useState, useRef } from 'react';
import './SupportPage.css';

const SupportPage = ({ user }) => {
  const [ticketCreated, setTicketCreated] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear Zendesk conversations and prepare for fresh session
  useEffect(() => {
    const clearZendeskData = () => {
      try {
        // Clear Zendesk-related data (but NOT conversationHistory yet - we need it first!)
        localStorage.removeItem('zE_oauth');
        localStorage.removeItem('ZD-store');
        localStorage.removeItem('ZD-suid');
        localStorage.removeItem('ZD-buid');
        
        // Clear Zendesk session storage
        Object.keys(sessionStorage).forEach(key => {
          if (key.toLowerCase().includes('zendesk') || 
              key.toLowerCase().includes('ze_') ||
              key.toLowerCase().includes('zd-')) {
            sessionStorage.removeItem(key);
          }
        });

        // Clear any Zendesk cookies if possible
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.toLowerCase().includes('zendesk') || 
              name.toLowerCase().includes('ze_') ||
              name.toLowerCase().includes('zd-')) {
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          }
        });
        
        // eslint-disable-next-line no-console
        console.log('🧹 Cleared all Zendesk data for fresh session');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error clearing Zendesk data:', error);
      }
    };

    clearZendeskData();
    
    // Force clear any existing Zendesk widget
    if (window.zE) {
      try {
        window.zE('messenger', 'logout');
        // eslint-disable-next-line no-console
        console.log('🚪 Logged out of existing Zendesk session');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('ℹ️ No existing Zendesk session to logout');
      }
    }
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
    


    const initializeZendeskWidget = (conversationHistory, replayResult = null) => {
      // eslint-disable-next-line no-console
      console.log('🚀 Initializing modern Zendesk Web Widget...');
      
      // Load Zendesk script if not already loaded
      if (!window.zE) {
        const script = document.createElement('script');
        script.id = 'ze-snippet';
        script.src = 'https://static.zdassets.com/ekr/snippet.js?key=d00c5a70-85da-47ea-bd7d-7445bcc31c38';
        script.async = true;
        
        script.onload = () => {
          // eslint-disable-next-line no-console
          console.log('✅ Zendesk Web Widget script loaded');
          setTimeout(() => {
            configureModernWidget(conversationHistory);
          }, 1000);
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
        console.log('✅ Zendesk already loaded, configuring...');
        setTimeout(() => {
          configureModernWidget(conversationHistory);
        }, 500);
      }
    };

    const configureModernWidget = (conversationHistory) => {
      // eslint-disable-next-line no-console
      console.log('⚙️ Configuring modern Zendesk widget...');
      
      // Robust widget readiness check
      const waitForZendeskReady = () => {
        return new Promise((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max
          
          const checkReady = () => {
            attempts++;
            
            // Check if zE exists and has messenger functionality
            if (window.zE && 
                typeof window.zE === 'function' &&
                window.zE.messenger !== undefined) {
              
              try {
                // Test if we can safely call zE methods
                window.zE('messenger', 'get', 'display:state', (state) => {
                  // eslint-disable-next-line no-console
                  console.log('✅ Zendesk widget is fully ready, state:', state);
                  resolve();
                });
              } catch (error) {
                if (attempts >= maxAttempts) {
                  // eslint-disable-next-line no-console
                  console.error('❌ Zendesk widget failed to initialize after maximum attempts');
                  reject(new Error('Widget initialization timeout'));
                } else {
                  setTimeout(checkReady, 100);
                }
              }
            } else {
              if (attempts >= maxAttempts) {
                // eslint-disable-next-line no-console
                console.error('❌ Zendesk widget not available after maximum attempts');
                reject(new Error('Widget not available'));
              } else {
                setTimeout(checkReady, 100);
              }
            }
          };
          
          checkReady();
        });
      };

      // Initialize widget once it's ready
      waitForZendeskReady()
        .then(() => {
          try {
            // eslint-disable-next-line no-console
            console.log('🔧 Widget is ready, starting configuration...');
            
            // Set up widget event listeners first
            window.zE('messenger:on', 'open', () => {
              // eslint-disable-next-line no-console
              console.log('📂 Widget opened');
            });

            window.zE('messenger:on', 'close', () => {
              // eslint-disable-next-line no-console
              console.log('📕 Widget closed');
            });

            window.zE('messenger:on', 'unreadCountChanged', (count) => {
              // eslint-disable-next-line no-console
              console.log(`📬 Unread count changed: ${count}`);
            });

            // Show the widget
            window.zE('messenger', 'show');
            
            // Set conversation tags for chat transfer identification
            window.zE('messenger:set', 'conversationTags', ['chat-transfer', 'external-handoff', 'support-request']);
            
            // Format and set conversation history using conversation fields
            if (conversationHistory && conversationHistory.length > 0) {
              // eslint-disable-next-line no-console
              console.log('📝 Adding conversation context via conversation fields...');
              
              // Format history summary for agents
              const historySummary = conversationHistory.map((msg, index) => {
                const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString();
                const speaker = msg.sender === 'user' ? 'Customer' : 'Assistant';
                return `[${time}] ${speaker}: ${msg.text}`;
              }).join(' | ');
              
              // Set conversation fields that agents can see
              window.zE('messenger:set', 'conversationFields', [
                { 
                  id: 'chat_history_summary', 
                  value: historySummary 
                },
                { 
                  id: 'message_count', 
                  value: conversationHistory.length.toString() 
                },
                { 
                  id: 'transfer_timestamp', 
                  value: new Date().toISOString() 
                },
                { 
                  id: 'handoff_reason', 
                  value: 'Customer requested human support from chat widget' 
                }
              ]);
              
              // eslint-disable-next-line no-console
              console.log('✅ Conversation context added via fields');
              console.log(`📊 Context: ${conversationHistory.length} messages transferred`);
              setTicketCreated(true);
              setTicketId('widget-conversation-' + Date.now());
            } else {
              // eslint-disable-next-line no-console
              console.log('ℹ️ No conversation history found - opening fresh support chat');
              setTicketCreated(false);
              setTicketId(null);
            }
            
            // eslint-disable-next-line no-console
            console.log('✅ Widget configuration complete');
            
            // Open widget with a single, reliable attempt
            setTimeout(() => {
              try {
                window.zE('messenger', 'open');
                // eslint-disable-next-line no-console
                console.log('✅ Widget opened successfully');
                setLoading(false);
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('❌ Error opening widget:', error);
                setLoading(false);
              }
            }, 500);
            
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('❌ Error configuring widget:', error);
            setError('Failed to configure support widget');
            setLoading(false);
          }
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('❌ Widget initialization failed:', error);
          setError('Support widget failed to initialize');
          setLoading(false);
        });
    };

    const initializeSupportPage = async () => {
      try {
        // IMPORTANT: Get conversation history FIRST before clearing anything
        const getConversationHistory = () => {
          try {
            const stored = localStorage.getItem('conversationHistory');
            const history = stored ? JSON.parse(stored) : [];
            // eslint-disable-next-line no-console
            console.log('📚 Retrieved conversation history BEFORE clearing:', history);
            console.log('📊 Found', history.length, 'messages from main chat');
            
            // Log each message for debugging
            history.forEach((msg, index) => {
              // eslint-disable-next-line no-console
              console.log(`📝 Message ${index + 1}: [${msg.sender}] ${msg.text}`);
            });
            
            return history;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('❌ Error retrieving conversation history:', error);
            return [];
          }
        };

        // GET the conversation history first
        const conversationHistory = getConversationHistory();
        
        // NOW clear localStorage for future sessions (but keep the history we just got)
        localStorage.removeItem('conversationHistory');
        
        // Initialize Zendesk widget with simple approach (no API calls needed)
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