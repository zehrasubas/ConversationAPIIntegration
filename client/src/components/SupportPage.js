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
      
      // eslint-disable-next-line no-console
      console.log('🔑 Zendesk widget key status:', zendeskKey ? 'Found' : 'Missing');
      
      if (!zendeskKey) {
        // eslint-disable-next-line no-console
        console.warn('⚠️ Zendesk widget key not configured - showing demo mode');
        setError('Demo Mode: Zendesk widget key not configured. Please set REACT_APP_ZENDESK_WIDGET_KEY environment variable to enable live chat.');
        setLoading(false);
        setWidgetReady(false);
        return;
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

  // Show demo mode instead of full error for missing widget key
  const isDemoMode = error && error.includes('Demo Mode');

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
        ) : isDemoMode ? (
          <div className="demo-container">
            <div className="demo-illustration">
              <div className="demo-icon">
                <i className="fas fa-tools"></i>
              </div>
              <h2>Support Center - Demo Mode</h2>
              <p>This is how your support page will look once configured.</p>
              
              <div className="demo-widget" style={{
                background: '#f8f9fa',
                border: '2px dashed #dee2e6',
                borderRadius: '8px',
                padding: '30px',
                margin: '20px 0',
                textAlign: 'center'
              }}>
                <i className="fas fa-comment-dots" style={{ fontSize: '48px', color: '#6c757d', marginBottom: '15px' }}></i>
                <h3 style={{ color: '#495057', marginBottom: '10px' }}>Zendesk Chat Widget</h3>
                <p style={{ color: '#6c757d', marginBottom: '15px' }}>Your live chat widget will appear here once configured</p>
                <div style={{ fontSize: '14px', color: '#868e96' }}>
                  <p>✅ Conversation history transfer</p>
                  <p>✅ Real-time customer support</p>
                  <p>✅ Agent dashboard integration</p>
                </div>
              </div>
              
              <div className="config-steps" style={{
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                padding: '15px',
                marginTop: '20px'
              }}>
                <h4 style={{ color: '#856404', marginBottom: '10px' }}>
                  <i className="fas fa-info-circle"></i> Configuration Required
                </h4>
                <p style={{ color: '#856404', fontSize: '14px', margin: '0' }}>
                  Add your Zendesk widget key to environment variables to enable live chat
                </p>
              </div>
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