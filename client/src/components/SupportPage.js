import React, { useEffect, useState } from 'react';
import './SupportPage.css';

function SupportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const getExternalId = () => {
    try {
      // Get external ID from session storage (set during chat initialization)
      let externalId = sessionStorage.getItem('supportExternalId');
      
      if (!externalId) {
        // Generate from current user ID pattern if available
        const currentUserId = sessionStorage.getItem('currentUserId');
        const userPSID = sessionStorage.getItem('userPSID');
        
        if (currentUserId && currentUserId.startsWith('facebook_')) {
          externalId = currentUserId; // Already in facebook_USER format
        } else if (userPSID) {
          externalId = `facebook_${userPSID}`;
        } else {
          // Generate anonymous external ID
          externalId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Store for future use
        sessionStorage.setItem('supportExternalId', externalId);
        
        // eslint-disable-next-line no-console
        console.log('🔑 Generated external ID for support:', externalId);
      } else {
        // eslint-disable-next-line no-console
        console.log('🔑 Using existing external ID for support:', externalId);
      }
      
      return externalId;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error getting external ID:', error);
      return null;
    }
  };

  // Ensure external ID is set
  useEffect(() => {
    const setupExternalId = () => {
      try {
        const externalId = getExternalId();
        if (externalId) {
          // eslint-disable-next-line no-console
          console.log('✅ External ID prepared for Smooch widget:', externalId);
        } else {
          // eslint-disable-next-line no-console
          console.warn('⚠️ No external ID available for support page');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to prepare external ID for Smooch widget:', error);
        setError('Failed to prepare support session');
      }
    };

    setupExternalId();
  }, []);

  const initializeSmoochWidget = () => {
    // eslint-disable-next-line no-console
    console.log('🚀 Initializing Smooch SDK widget...');
    
    const createWebIntegrationAndInit = async () => {
      try {
        // eslint-disable-next-line no-console
        console.log('🔧 Creating web integration first...');
        
        // Step 1: Create web integration
        const integrationResponse = await fetch('/api/smooch/create-web-integration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!integrationResponse.ok) {
          const errorText = await integrationResponse.text();
          throw new Error(`Failed to create web integration: ${integrationResponse.status} - ${errorText}`);
        }

        const integrationData = await integrationResponse.json();
        
        if (!integrationData.success || !integrationData.integrationId) {
          throw new Error(`No integration ID received. Response: ${JSON.stringify(integrationData)}`);
        }

        // eslint-disable-next-line no-console
        console.log('✅ Web integration created successfully!');
        console.log('🔧 Integration ID:', integrationData.integrationId);

        // Step 2: Get JWT for anonymous user
        const supportExternalId = sessionStorage.getItem('supportExternalId');
        if (!supportExternalId) {
          throw new Error('No external ID found for JWT generation');
        }

        // eslint-disable-next-line no-console
        console.log('🔧 Generating JWT for anonymous user...');

        const jwtResponse = await fetch('/api/smooch/generate-jwt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            externalId: supportExternalId
          })
        });

        if (!jwtResponse.ok) {
          const errorText = await jwtResponse.text();
          throw new Error(`Failed to get JWT: ${jwtResponse.status} - ${errorText}`);
        }

        const jwtData = await jwtResponse.json();
        
        if (!jwtData.success || !jwtData.jwt) {
          throw new Error('No JWT received from API');
        }

        // eslint-disable-next-line no-console
        console.log('✅ JWT generated successfully!');

        // Step 3: Initialize Smooch with BOTH integration ID and JWT
        const smoochConfig = {
          integrationId: integrationData.integrationId,
          jwt: jwtData.jwt  // For anonymous users
        };

        // eslint-disable-next-line no-console
        console.log('🔧 Initializing Smooch with integration ID + JWT...');
        console.log('🔧 Config:', {
          hasIntegrationId: !!smoochConfig.integrationId,
          hasJWT: !!smoochConfig.jwt,
          jwtLength: smoochConfig.jwt.length
        });

        return window.Smooch.init(smoochConfig).then(() => {
          // eslint-disable-next-line no-console
          console.log('✅ Smooch initialized successfully with integration ID + JWT!');
          
          setError(null);
          setLoading(false);
          
          // eslint-disable-next-line no-console
          console.log('🎉 Support widget initialized successfully!');
          
        });
        
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Integration + JWT initialization failed:', error);
        setError('Failed to initialize support widget - integration + JWT approach failed');
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
        createWebIntegrationAndInit();
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
      console.log('✅ Smooch SDK already loaded, creating web integration...');
      createWebIntegrationAndInit();
    }
  };

  // Initialize Smooch widget when component is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeSmoochWidget();
    }, 1000); // Small delay to ensure external ID is set

    return () => clearTimeout(timer);
  }, []);

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
              <p>Your support chat is ready! The widget should open automatically.</p>
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