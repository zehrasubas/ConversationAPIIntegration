import React, { useState, useEffect } from 'react';
import './App.css';
import ChatBox from './components/ChatBox';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Footer from './components/Footer';

function FacebookLogin({ onLogin }) {
  const [isSdkLoaded, setIsSdkLoaded] = React.useState(false);
  const [sdkFailed, setSdkFailed] = React.useState(false);

  React.useEffect(() => {
    let timeoutId;
    
    // Load the Facebook SDK
    const loadFacebookSDK = () => {
      console.log('🔄 Starting Facebook SDK load...');
      
      window.fbAsyncInit = function() {
        console.log('🔄 fbAsyncInit called - SDK is initializing');
        console.log('🌐 Current domain:', window.location.hostname);
        console.log('🌐 Current URL:', window.location.href);
        console.log('🌐 Current protocol:', window.location.protocol);
        
        try {
          console.log('🔧 Attempting to initialize with App ID: 30902396742455');
          window.FB.init({
            appId: '30902396742455',
            cookie: true,
            xfbml: true,
            version: 'v19.0'
          });
          console.log('✅ Facebook SDK initialized successfully');
          
          // Check if FB is actually working
          console.log('🔍 Testing FB object:', typeof window.FB);
          console.log('🔍 FB.getLoginStatus exists:', typeof window.FB.getLoginStatus);
          
          setIsSdkLoaded(true);
          
          // Clear timeout since SDK loaded successfully
          if (timeoutId) clearTimeout(timeoutId);
          
          // Test if FB is working
          window.FB.getLoginStatus(function(response) {
            console.log('📊 FB Login Status:', response);
            console.log('📊 FB Auth Response:', response.authResponse);
            console.log('📊 FB Status:', response.status);
          });
          
        } catch (error) {
          console.error('❌ Error initializing Facebook SDK:', error);
          console.error('❌ Error details:', error.message);
          setIsSdkLoaded(false);
          setSdkFailed(true);
          if (timeoutId) clearTimeout(timeoutId);
        }
      };

      // Add a check to see if fbAsyncInit is being called at all
      console.log('🔧 Setting up fbAsyncInit function...');

      // Add timeout fallback - no dependency on isSdkLoaded state
      timeoutId = setTimeout(() => {
        console.log('⚠️ Facebook SDK timeout after 8 seconds');
        console.log('⚠️ fbAsyncInit was called:', typeof window.fbAsyncInit === 'function');
        console.log('⚠️ FB object exists:', typeof window.FB !== 'undefined');
        console.log('⚠️ SDK script loaded:', !!document.getElementById('facebook-jssdk'));
        setIsSdkLoaded(false);
        setSdkFailed(true);
      }, 8000); // 8 second timeout for better debugging

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
          console.log('✅ Waiting for fbAsyncInit to be called...');
          
          // Add a backup check in case fbAsyncInit doesn't fire
          setTimeout(() => {
            if (typeof window.FB !== 'undefined' && typeof window.FB.init === 'function') {
              console.log('🔄 FB object available, checking if already initialized...');
              // Check if FB is already initialized by testing a method
              try {
                window.FB.getLoginStatus(function(response) {
                  console.log('✅ FB already initialized, status:', response.status);
                  setIsSdkLoaded(true);
                  if (timeoutId) clearTimeout(timeoutId);
                });
              } catch (error) {
                console.log('🔄 FB not initialized, trying manual init');
                try {
                  window.FB.init({
                    appId: '30902396742455',
                    cookie: true,
                    xfbml: true,
                    version: 'v19.0'
                  });
                  console.log('✅ Manual Facebook SDK initialization successful');
                  setIsSdkLoaded(true);
                  if (timeoutId) clearTimeout(timeoutId);
                } catch (initError) {
                  console.error('❌ Manual initialization failed:', initError);
                }
              }
            }
          }, 2000);
        };
        
        js.onerror = function() {
          console.error('❌ Failed to load Facebook SDK script');
          setIsSdkLoaded(false); // Allow app to continue without Facebook
          setSdkFailed(true);
          if (timeoutId) clearTimeout(timeoutId);
        };
        
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    loadFacebookSDK();
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleLogin = () => {
    if (!isSdkLoaded) {
      console.error('Facebook SDK not loaded yet');
      return;
    }

    window.FB.login(function(response) {
      console.log('Login response:', response);
      
      if (response.authResponse) {
        console.log('✅ Login successful, getting user info...');
        window.FB.api('/me', { fields: 'id,name,email' }, function(userInfo) {
          console.log('👤 User info received from Facebook API:', userInfo);
          console.log('👤 User ID:', userInfo.id);
          console.log('👤 User Name:', userInfo.name);
          console.log('📧 User Email:', userInfo.email);
          console.log('🔄 Calling onLogin with userInfo...');
          onLogin(userInfo);
        });
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, {
      scope: 'public_profile,email',
      return_scopes: true
    });
  };

  const getButtonText = () => {
    if (sdkFailed) return 'Facebook Login Unavailable';
    if (isSdkLoaded) return 'Login with Facebook';
    return 'Loading Facebook...';
  };

  return (
    <button 
      className="fb-login-btn" 
      onClick={handleLogin}
      disabled={!isSdkLoaded || sdkFailed}
      style={{ 
        cursor: (isSdkLoaded && !sdkFailed) ? 'pointer' : 'not-allowed',
        opacity: (isSdkLoaded && !sdkFailed) ? 1 : 0.7
      }}
    >
      <i className="fab fa-facebook-f"></i> 
      {getButtonText()}
    </button>
  );
}

function Navigation({ user, onLogout, onLogin }) {
  // Debug logging to see what user data we have
  console.log('🔍 Navigation render - user:', user);
  console.log('🔍 Navigation render - user type:', typeof user);
  console.log('🔍 Navigation render - user name:', user?.name);
  
  return (
    <nav className="nav-container">
      <div className="nav-left">
        <a href="/destinations">Destinations</a>
        <a href="/experiences">Experiences</a>
        <a href="/tours">Tours</a>
        <a href="/blog" className="active">Travel Blog</a>
      </div>
      <div className="nav-center">
        <h1 className="logo">WANDERLUST</h1>
      </div>
      <div className="nav-right">
        <a href="/facebook" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
        <a href="/instagram" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
        <a href="/twitter" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
        <button className="icon-button" aria-label="Search"><i className="fa fa-search"></i></button>
        
        <div style={{ margin: '0 15px', display: 'flex', alignItems: 'center' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#1c1e21', fontWeight: '500' }}>
                Hi, {user.name || 'User'}
              </span>
              <button 
                onClick={onLogout}
                style={{
                  backgroundColor: '#5DADE2',
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

        <button className="icon-button" aria-label="Favorites"><i className="fa fa-heart"></i></button>
      </div>
    </nav>
  );
}

function BlogHero() {
  return (
    <section className="blog-hero">
      <div className="hero-content">
        <span className="subtitle">Featured Destination</span>
        <h2>Discover Hidden Gems Around the World</h2>
        <p>From ancient temples to pristine beaches, explore the most breathtaking destinations our planet has to offer</p>
      </div>
    </section>
  );
}

function NewsSection() {
  return (
    <section className="news-section">
      <div className="container">
        <h2>Latest Travel Stories</h2>
        <div className="news-grid">
          <article className="news-card">
            <img src="/sample1.jpg" alt="Mountain Adventure" />
            <div className="news-content">
              <h3>Epic Mountain Adventures Await</h3>
              <p>Discover the thrill of high-altitude trekking and breathtaking mountain vistas that will leave you speechless.</p>
            </div>
          </article>
          <article className="news-card">
            <img src="/sample2.jpg" alt="Cultural Experience" />
            <div className="news-content">
              <h3>Immerse in Local Cultures</h3>
              <p>Experience authentic traditions, taste local cuisines, and connect with communities around the globe.</p>
            </div>
          </article>
          <article className="news-card">
            <img src="/sample3.jpg" alt="Ocean Paradise" />
            <div className="news-content">
              <h3>Paradise Found: Tropical Escapes</h3>
              <p>Unwind on pristine beaches, dive into crystal-clear waters, and experience the ultimate tropical getaway.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Debug user state changes
  console.log('🏠 App render - current user state:', user);

  // Track user state changes
  useEffect(() => {
    console.log('🔄 User state changed to:', user);
    if (user) {
      console.log('✅ User is now logged in:', user.name);
    } else {
      console.log('❌ User is not logged in');
    }
  }, [user]);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      console.log('📱 Found stored user in localStorage:', storedUser);
      const parsedUser = JSON.parse(storedUser);
      console.log('📱 Parsed stored user:', parsedUser);
      setUser(parsedUser);
    } else {
      console.log('📱 No stored user found in localStorage');
    }

    // Listen for navigation changes
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleFacebookLogin = (userInfo) => {
    console.log('✅ Facebook login successful:', userInfo);
    console.log('👤 Facebook User ID:', userInfo?.id);
    console.log('📧 User Email:', userInfo?.email);
    console.log('👤 User Name:', userInfo?.name);
    
    // Store basic user info - keep login simple and fast
    console.log('💾 Storing user info in localStorage...');
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    
    console.log('🎉 Login completed successfully!');
    console.log('📝 Messenger integration available - will activate when user sends first message');
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

  // Check if we're on privacy policy page
  if (currentPath === '/privacy') {
    return (
      <div className="App">
        <Navigation 
          user={user} 
          onLogout={handleLogout}
          onLogin={handleFacebookLogin}
        />
        <PrivacyPolicy />
        <Footer />
      </div>
    );
  }

  // Check if we're on terms of service page
  if (currentPath === '/terms') {
    return (
      <div className="App">
        <Navigation 
          user={user} 
          onLogout={handleLogout}
          onLogin={handleFacebookLogin}
        />
        <TermsOfService />
        <Footer />
      </div>
    );
  }

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
      <Footer />
    </div>
  );
}

export default App;
