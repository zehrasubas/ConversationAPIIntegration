import React from 'react';

const Footer = () => {
  const handleNavigation = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <footer style={{
      backgroundColor: '#f8f9fa',
      padding: '20px 0',
      marginTop: '40px',
      borderTop: '1px solid #e9ecef',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <p style={{ margin: '0 0 10px 0', color: '#6c757d' }}>
          © 2024 Candle Shop. All rights reserved.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleNavigation('/privacy')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#4267B2', 
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => handleNavigation('/terms')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#4267B2', 
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Terms of Service
          </button>
          <button 
            onClick={() => handleNavigation('/')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#4267B2', 
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Home
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 