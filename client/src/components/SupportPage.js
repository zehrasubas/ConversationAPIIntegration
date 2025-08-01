import React, { useEffect, useState, useRef } from 'react';
import './SupportPage.css';

const SupportPage = () => {
  const [ticketCreated, setTicketCreated] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear any previous widget sessions and prepare for fresh Smooch session
  useEffect(() => {
    const clearPreviousWidgetData = () => {
      try {
        // Clear any previous widget-related data for fresh session
        localStorage.removeItem('zE_oauth');
        localStorage.removeItem('ZD-store');
        localStorage.removeItem('ZD-suid');
        localStorage.removeItem('ZD-buid');
        
        // Clear widget session storage
        Object.keys(sessionStorage).forEach(key => {
          if (key.toLowerCase().includes('smooch') || 
              key.toLowerCase().includes('zendesk') || 
              key.toLowerCase().includes('ze_') ||
              key.toLowerCase().includes('zd-')) {
            sessionStorage.removeItem(key);
          }
        });

        // Clear any widget cookies if possible
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.toLowerCase().includes('smooch') ||
              name.toLowerCase().includes('zendesk') || 
              name.toLowerCase().includes('ze_') ||
              name.toLowerCase().includes('zd-')) {
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          }
        });
        
        // eslint-disable-next-line no-console
        console.log('🧹 Cleared all previous widget data for fresh session');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error clearing widget data:', error);
      }
    };

    clearPreviousWidgetData();
    
    // Force clear any existing widget instances
    if (window.Smooch) {
      try {
        // eslint-disable-next-line no-console
        console.log('🚪 Clearing existing Smooch session');
        window.Smooch.destroy();
        // eslint-disable-next-line no-console
        console.log('✅ Cleared existing Smooch session');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('ℹ️ No existing Smooch session to clear');
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('ℹ️ No existing widget session to clear');
    }
  }, []);
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
    


    const initializeSmoochWidget = () => {
      // eslint-disable-next-line no-console
      console.log('🚀 Initializing Smooch SDK widget...');
      
      const initializeSmooch = () => {
        try {
          // eslint-disable-next-line no-console
          console.log('🔧 Initializing Smooch with App ID: 66fe310b1f5b6f0929cb3051');
          
          window.Smooch.init({
            appId: '66fe310b1f5b6f0929cb3051' // Your App ID from screenshot
          }).then(() => {
            // eslint-disable-next-line no-console
            console.log('✅ Smooch widget ready - can display API conversations');
            
            // Widget is ready and will automatically show the conversation from our Sunshine API
            // No need to manually inject history - Smooch displays the actual conversation
            setTicketCreated(true);
            setTicketId('smooch-conversation-' + Date.now());
            setLoading(false);
            
            // eslint-disable-next-line no-console
            console.log('🎉 Support widget initialized successfully');
            
          }).catch((error) => {
            // eslint-disable-next-line no-console
            console.error('❌ Failed to initialize Smooch:', error);
            setError('Failed to initialize support widget');
            setLoading(false);
          });
          
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('❌ Error initializing Smooch:', error);
          setError('Failed to initialize support widget');
          setLoading(false);
        }
      };
      
      // Load Smooch SDK if not already loaded
      if (!window.Smooch) {
        const script = document.createElement('script');
        script.src = 'https://cdn.smooch.io/smooch.min.js';
        script.async = true;
        
        script.onload = () => {
          // eslint-disable-next-line no-console
          console.log('✅ Smooch SDK script loaded');
          initializeSmooch();
        };
        
        script.onerror = () => {
          // eslint-disable-next-line no-console
          console.error('❌ Failed to load Smooch SDK script');
          setError('Failed to load support widget');
          setLoading(false);
        };
        
        document.head.appendChild(script);
      } else {
        // eslint-disable-next-line no-console
        console.log('✅ Smooch SDK already loaded, initializing...');
        initializeSmooch();
      }
    };

    const initializeSupportPage = async () => {
      try {
        // Get conversation history from Sunshine API ONLY
        const getConversationHistory = async () => {
          try {
            // Try to get user ID from various sources
            let userId = null;
            
            // First, check if user is logged in via Facebook
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              userId = parsedUser.id; // Facebook user ID
              // eslint-disable-next-line no-console
              console.log('👤 Using Facebook user ID:', userId);
            }
            
            // If no Facebook user, check for session-based ID
            if (!userId) {
              userId = sessionStorage.getItem('chatUserId');
              if (!userId) {
                throw new Error('No user ID found - user must have an active chat session to access support');
              }
              // eslint-disable-next-line no-console
              console.log('🔒 Using session user ID:', userId);
            }

            // eslint-disable-next-line no-console
            console.log('🌞 Fetching Sunshine conversation history for user:', userId);

            // Fetch from Sunshine Conversations API - NO FALLBACKS
            const response = await fetch(`/api/zendesk/get-conversation-history?psid=${encodeURIComponent(userId)}`);
            
            if (!response.ok) {
              if (response.status === 404) {
                throw new Error('No conversation history found - user must start a chat first');
              }
              throw new Error(`Sunshine API error: ${response.status} ${response.statusText}`);
            }

            const sunshineData = await response.json();
            
            if (!sunshineData.success) {
              throw new Error(`Sunshine API returned error: ${sunshineData.error || 'Unknown error'}`);
            }

            if (!sunshineData.messages || sunshineData.messages.length === 0) {
              throw new Error('No conversation history found in Sunshine - user must start a chat first');
            }

            // eslint-disable-next-line no-console
            console.log('✅ Retrieved conversation history from Sunshine:', sunshineData.messages);
            console.log('📊 Found', sunshineData.messages.length, 'messages from Sunshine API');
            
            // Log each message for debugging
            sunshineData.messages.forEach((msg, index) => {
              // eslint-disable-next-line no-console
              console.log(`📝 Sunshine Message ${index + 1}: [${msg.sender}] ${msg.text}`);
            });
            
            return sunshineData.messages;

          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('❌ Failed to retrieve conversation history from Sunshine:', error);
            // Re-throw the error to be handled by the calling function
            throw error;
          }
        };

        // Validate that conversation history exists (throws error if not)
        await getConversationHistory();
        
        // Clear localStorage for future sessions (but conversation now comes from Sunshine)
        localStorage.removeItem('conversationHistory');
        
        // Initialize Smooch SDK widget (will display real Sunshine conversation)
        initializeSmoochWidget();
        
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to initialize support page:', error);
        
        // Show specific error message based on the failure
        let errorMessage = 'Failed to initialize support. ';
        if (error.message.includes('No user ID found')) {
          errorMessage += 'Please start a chat session first before accessing support.';
        } else if (error.message.includes('No conversation history found')) {
          errorMessage += 'No conversation history found. Please send a message in the main chat first.';
        } else if (error.message.includes('Sunshine API')) {
          errorMessage += 'Unable to connect to support system. Please try again later.';
        } else {
          errorMessage += 'Please try again.';
        }
        
        setError(errorMessage);
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
        
        <div id="smooch-widget-container">
          {/* Smooch widget appears here automatically */}
        </div>
      </div>
    </div>
  );
};

export default SupportPage; 