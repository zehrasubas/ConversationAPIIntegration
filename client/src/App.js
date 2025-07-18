import React, { useState, useEffect } from 'react';
import './App.css';
import ChatBox from './components/ChatBox';

function FacebookLogin({ onLogin }) {
  const [isSdkLoaded, setIsSdkLoaded] = React.useState(false);

  React.useEffect(() => {
    // Load the Facebook SDK
    const loadFacebookSDK = () => {
      console.log('🔄 Starting Facebook SDK load...');
      
      window.fbAsyncInit = function() {
        console.log('🔄 fbAsyncInit called');
        
        try {
          window.FB.init({
            appId: '32902521059386', // Your app ID - if this fails, try '1234567890123456'
            cookie: true,
            xfbml: true,
            version: 'v19.0'
          });
          console.log('✅ Facebook SDK initialized successfully');
          setIsSdkLoaded(true);
          
          // Test if FB is working
          window.FB.getLoginStatus(function(response) {
            console.log('📊 FB Login Status:', response);
          });
          
        } catch (error) {
          console.error('❌ Error initializing Facebook SDK:', error);
        }
      };

      // Load the SDK
      (function(d, s, id) {
        console.log('🔄 Loading Facebook SDK script...');
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          console.log('⚠️ Facebook SDK script already exists');
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        
        // Add load and error event listeners
        js.onload = function() {
          console.log('✅ Facebook SDK script loaded successfully');
        };
        
        js.onerror = function() {
          console.error('❌ Failed to load Facebook SDK script');
        };
        
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    loadFacebookSDK();
  }, []);

  const handleLogin = () => {
    if (!isSdkLoaded) {
      console.error('Facebook SDK not loaded yet');
      return;
    }

    window.FB.login(function(response) {
      console.log('Login response:', response);
      
      if (response.authResponse) {
        window.FB.api('/me', { fields: 'id,name,email' }, function(userInfo) {
          console.log('User info received:', userInfo);
          onLogin(userInfo);
        });
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {
      scope: 'email,pages_messaging,pages_show_list,public_profile',
      return_scopes: true,
      messenger_page_id: '29202387465526',
      auth_type: 'rerequest'
    });
  };

  return (
    <button 
      className="fb-login-btn" 
      onClick={handleLogin}
      disabled={!isSdkLoaded}
      style={{ 
        cursor: isSdkLoaded ? 'pointer' : 'not-allowed',
        opacity: isSdkLoaded ? 1 : 0.7,
        backgroundColor: '#4267B2',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <i className="fab fa-facebook-f"></i> 
      {isSdkLoaded ? 'Login with Facebook' : 'Loading Facebook...'}
    </button>
  );
}

function Navigation({ user, onLogout, onLogin }) {
  return (
    <nav className="nav-container">
      <div className="nav-left">
        <a href="/shop">Shop</a>
        <a href="/gift-cards">Gift Cards</a>
        <a href="/about">About</a>
        <a href="/blog" className="active">Blog</a>
      </div>
      <div className="nav-center">
        <h1 className="logo">CANDLE</h1>
      </div>
      <div className="nav-right">
        <a href="/facebook" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
        <a href="/pinterest" aria-label="Pinterest"><i className="fab fa-pinterest-p"></i></a>
        <a href="/instagram" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
        <button className="icon-button" aria-label="Search"><i className="fa fa-search"></i></button>
        
        <div style={{ margin: '0 15px', display: 'flex', alignItems: 'center' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#1c1e21', fontWeight: '500' }}>
                Hi, {user.name}
              </span>
              <button 
                onClick={onLogout}
                style={{
                  backgroundColor: '#4267B2',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          ) : (
            <FacebookLogin onLogin={onLogin} />
          )}
        </div>

        <button className="icon-button" aria-label="Cart"><i className="fa fa-shopping-cart"></i></button>
      </div>
    </nav>
  );
}

function BlogHero() {
  return (
    <section className="blog-hero">
      <div className="hero-content">
        <span className="subtitle">Featured Story</span>
        <h2>The Art of Candle Making: A Journey Through Time</h2>
      </div>
    </section>
  );
}

function NewsSection() {
  return (
    <section className="news-section">
      <h2>News</h2>
      <div className="news-grid">
        <article className="news-card">
          <div className="news-image-placeholder"></div>
          <div className="news-content">
            <h3>The Art of Candle Making</h3>
            <p>Discover the intricate process behind our handcrafted candles</p>
          </div>
        </article>
        <article className="news-card">
          <div className="news-image-placeholder"></div>
          <div className="news-content">
            <h3>New Fall Collection</h3>
            <p>Explore our latest seasonal fragrances</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleFacebookLogin = async (userInfo) => {
    console.log('Login successful:', userInfo);
    console.log('Facebook User ID:', userInfo.id);
    
    try {
      // Get the Facebook User ID from the login response
      const facebookUserId = userInfo.id;
      
      // Exchange Facebook User ID for PSID through our server
      const response = await fetch('/api/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: facebookUserId
        })
      });

      const data = await response.json();
      console.log('PSID Exchange Response:', data);
      
      if (data.success && data.psid) {
        console.log('Received PSID:', data.psid);
        console.log('Messenger Profile:', data.profile);
        console.log('User Data:', data.user);

        // Store both user info and PSID
        const userWithPSID = {
          ...userInfo,
          psid: data.psid
        };
        
        console.log('Storing user with PSID:', userWithPSID);
        localStorage.setItem('user', JSON.stringify(userWithPSID));
        setUser(userWithPSID);
      } else {
        console.error('Failed to get PSID:', data.error);
        // Still store the user info even if PSID exchange fails
        localStorage.setItem('user', JSON.stringify(userInfo));
        setUser(userInfo);
      }
    } catch (error) {
      console.error('Error exchanging Facebook ID for PSID:', error);
      // Still store the user info even if PSID exchange fails
      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    
    // First remove from localStorage and clear state
    localStorage.removeItem('user');
    setUser(null);

    // Then check FB SDK and handle logout
    if (typeof window.FB !== 'undefined' && window.FB.getAuthResponse()) {
      try {
        window.FB.logout(function(response) {
          console.log('Logged out from Facebook');
        });
      } catch (error) {
        console.log('Error during FB logout:', error);
        // Even if FB logout fails, we still want the local logout to succeed
      }
    }
  };

  return (
    <div className="App">
      <Navigation 
        user={user} 
        onLogout={handleLogout}
        onLogin={handleFacebookLogin}
      />
      <ChatBox user={user} />
      <main>
        <BlogHero />
        <NewsSection />
      </main>
    </div>
  );
}

export default App;
