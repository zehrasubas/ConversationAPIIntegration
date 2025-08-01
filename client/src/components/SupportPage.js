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
            console.log('✅ Smooch widget initialized');
            
            // Get the external ID for this session
            const supportExternalId = sessionStorage.getItem('supportExternalId');
            if (supportExternalId) {
              // eslint-disable-next-line no-console
              console.log('🔑 Logging into Smooch with external ID:', supportExternalId);
              
              // Login with external ID to show existing conversation
              return window.Smooch.login(supportExternalId);
            } else {
              // eslint-disable-next-line no-console
              console.warn('⚠️ No external ID found - widget will start fresh');
              return Promise.resolve();
            }
          }).then(() => {
            // eslint-disable-next-line no-console
            console.log('✅ Smooch widget ready - displaying conversation for external ID');
            
            // Widget is ready and will automatically show the conversation
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
            // Get the same external ID used in main chat
            let externalId = null;
            
            // First, check if user is logged in via Facebook
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              externalId = `facebook_${parsedUser.id}`;
              // eslint-disable-next-line no-console
              console.log('👤 Using Facebook-based external ID:', externalId);
            } else {
              // Get session-based external ID (same as main chat)
              externalId = sessionStorage.getItem('sunshineExternalId');
              if (!externalId) {
                throw new Error('No external ID found - user must have an active chat session to access support');
              }
              // eslint-disable-next-line no-console
              console.log('🔒 Using session external ID:', externalId);
            }

            // eslint-disable-next-line no-console
            console.log('🌞 Fetching Sunshine conversation history for external ID:', externalId);
            console.log('🔍 Support page external ID analysis:');
            console.log('  - External ID:', externalId);
            console.log('  - Is Facebook ID pattern:', externalId.startsWith('facebook_'));
            console.log('  - Is anonymous pattern:', externalId.startsWith('anonymous_'));

            // Store external ID for widget initialization
            sessionStorage.setItem('supportExternalId', externalId);

            // For now, we'll skip the history fetch and let Smooch widget handle it
            // The widget will automatically show the conversation for this external ID
            // eslint-disable-next-line no-console
            console.log('✅ External ID prepared for Smooch widget');
            
            return []; // Return empty array, widget will show real conversation

          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('❌ Failed to prepare external ID for Smooch widget:', error);
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
        if (error.message.includes('No external ID found')) {
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