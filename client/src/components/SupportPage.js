/* eslint-disable no-use-before-define */
import React, { useEffect, useState, useCallback } from 'react';
import zendeskIntegration from '../services/zendeskWidgetIntegration';
import './SupportPage.css';

function SupportPage() {
  const [loading, setLoading] = useState(true);
  const [widgetReady, setWidgetReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const clearPreviousWidgetData = () => {
      try {
        // Clear any previous widget-related data for fresh session
        localStorage.removeItem('zE_oauth');
        localStorage.removeItem('ZD-store');
        localStorage.removeItem('ZD-suid');
        localStorage.removeItem('ZD-buid');
        
        // Clear only Smooch-related storage (keep Zendesk widget storage)
        Object.keys(sessionStorage).forEach(key => {
          if (key.toLowerCase().includes('smooch')) {
            sessionStorage.removeItem(key);
          }
        });

        // Clear only Smooch-related cookies
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.toLowerCase().includes('smooch')) {
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
    
    // Clear any existing Smooch instances
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
    }
    
    // Initialize Zendesk widget integration
    // eslint-disable-next-line no-use-before-define
    initializeZendeskWidget();
  }, [initializeZendeskWidget]);

  const loadZendeskWidget = useCallback((widgetKey) => {
    // Load Zendesk widget script if not already loaded
    if (!window.zE) {
      const script = document.createElement('script');
      script.id = 'ze-snippet';
      script.src = `https://static.zdassets.com/ekr/snippet.js?key=${widgetKey}`;
      script.async = true;
      
      script.onload = () => {
        // eslint-disable-next-line no-console
        console.log('✅ Zendesk Widget script loaded');
        // eslint-disable-next-line no-use-before-define
        setupZendeskIntegration();
      };
      
      script.onerror = () => {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to load Zendesk Widget script');
        setError('Failed to load support widget');
        setLoading(false);
      };
      
      document.head.appendChild(script);
    } else {
      // eslint-disable-next-line no-console
      console.log('✅ Zendesk Widget already loaded');
      // eslint-disable-next-line no-use-before-define
      setupZendeskIntegration();
    }
  }, [setupZendeskIntegration]);
  
  const setupZendeskIntegration = useCallback(() => {
    try {
      // Initialize Zendesk integration with history transfer
      zendeskIntegration.init();
      
      setWidgetReady(true);
      setError(null);
      setLoading(false);
      
      // eslint-disable-next-line no-console
      console.log('🎉 Zendesk widget ready!');
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to setup Zendesk integration:', error);
      setError('Failed to setup support widget: ' + error.message);
      setLoading(false);
    }
  }, []);
  
  const initializeZendeskWidget = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('🚀 Initializing Zendesk Web Widget...');
    
    try {
      // Check if Zendesk widget key is configured
      const zendeskKey = process.env.REACT_APP_ZENDESK_WIDGET_KEY;
      
      if (!zendeskKey) {
        throw new Error('Zendesk widget key not configured. Please set REACT_APP_ZENDESK_WIDGET_KEY environment variable.');
      }
      
      // Load Zendesk widget script
      loadZendeskWidget(zendeskKey);
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to initialize Zendesk widget:', error);
      setError('Failed to initialize support widget: ' + error.message);
      setLoading(false);
    }
  }, [loadZendeskWidget]);


  const handleBackToWebsite = () => {
    localStorage.removeItem('conversationHistory');
    window.location.href = '/';
  };

  const handleOpenChat = () => {
    if (zendeskIntegration) {
      zendeskIntegration.openWidget();
    }
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
          {/* ticketCreated && (
            <div className="ticket-info">
              <span className="ticket-created">
                ✅ Ticket #{ticketId} created
              </span>
            </div>
          ) */}
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
              <p>Your support chat is ready! {widgetReady ? 'Click below to open the chat widget.' : 'The widget should load automatically.'}</p>
              
              {widgetReady && (
                <button 
                  className="open-chat-button"
                  onClick={handleOpenChat}
                  style={{
                    padding: '12px 24px',
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <i className="fas fa-comments"></i>
                  Open Support Chat
                </button>
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