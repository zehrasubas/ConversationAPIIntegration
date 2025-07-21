import React from 'react';

const Footer = () => {
  const handleNavigation = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #5DADE2 0%, #2E86AB 100%)',
      color: 'white',
      padding: '40px 0 20px 0',
      marginTop: '40px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '30px',
          marginBottom: '30px'
        }}>
          <div>
            <h3 style={{ marginBottom: '15px', fontSize: '1.2rem', fontWeight: '600' }}>Wanderlust Travel</h3>
            <p style={{ opacity: '0.9', lineHeight: '1.6' }}>
              Discover the world's most amazing destinations with our curated travel experiences and expert guides.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: '15px', fontSize: '1rem', fontWeight: '600' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => handleNavigation('/destinations')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'white', 
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  opacity: '0.9',
                  transition: 'opacity 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.opacity = '1'}
                onMouseOut={(e) => e.target.style.opacity = '0.9'}
              >
                Destinations
              </button>
              <button 
                onClick={() => handleNavigation('/experiences')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'white', 
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  opacity: '0.9',
                  transition: 'opacity 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.opacity = '1'}
                onMouseOut={(e) => e.target.style.opacity = '0.9'}
              >
                Experiences
              </button>
              <button 
                onClick={() => handleNavigation('/tours')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'white', 
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  opacity: '0.9',
                  transition: 'opacity 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.opacity = '1'}
                onMouseOut={(e) => e.target.style.opacity = '0.9'}
              >
                Tours
              </button>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '15px', fontSize: '1rem', fontWeight: '600' }}>Follow Us</h4>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <i className="fab fa-facebook-f" style={{ fontSize: '1.2rem', cursor: 'pointer', transition: 'transform 0.3s ease' }}></i>
              <i className="fab fa-instagram" style={{ fontSize: '1.2rem', cursor: 'pointer', transition: 'transform 0.3s ease' }}></i>
              <i className="fab fa-twitter" style={{ fontSize: '1.2rem', cursor: 'pointer', transition: 'transform 0.3s ease' }}></i>
            </div>
          </div>
        </div>
        
        <div style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.2)', 
          paddingTop: '20px',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <p style={{ margin: '0', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
            © 2024 Wanderlust Travel. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => handleNavigation('/privacy')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgba(255, 255, 255, 0.8)', 
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.color = 'white'}
              onMouseOut={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => handleNavigation('/terms')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgba(255, 255, 255, 0.8)', 
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.color = 'white'}
              onMouseOut={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              Terms of Service
            </button>
            <button 
              onClick={() => handleNavigation('/')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgba(255, 255, 255, 0.8)', 
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'color 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.color = 'white'}
              onMouseOut={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 