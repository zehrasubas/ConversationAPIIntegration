// Debug endpoint for Facebook Login troubleshooting
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const debugInfo = {
      deploymentCheck: "DEPLOYMENT_TEST_2024_" + Date.now(),
      timestamp: new Date().toISOString(),
      domain: host,
      baseUrl: baseUrl,
      
      // Facebook App Configuration for Login
      facebookLogin: {
        appId: '30902396742455',
        status: '⚠️ Login issues detected',
        
        // What needs to be added to Facebook App
        addToAppDomains: [
          host,
          'localhost'
        ],
        
        addToRedirectUris: [
          `${baseUrl}/`,
          'http://localhost:3000/'
        ],
        
        setSiteUrl: baseUrl
      },
      
      // Current Login Scope (basic, safe approach)
      loginScope: ['public_profile', 'email'],
      messengerIntegration: 'Available on-demand when user sends first message',
      
      // Quick Setup Steps
      setupSteps: [
        {
          step: 1,
          action: 'Go to Facebook Developers Console',
          url: 'https://developers.facebook.com/apps/',
          details: 'Select App ID: 30902396742455'
        },
        {
          step: 2,
          action: 'Add App Domains',
          location: 'Settings → Basic → App Domains',
          value: host
        },
        {
          step: 3,
          action: 'Add OAuth Redirect URIs', 
          location: 'Products → Facebook Login → Settings → Valid OAuth Redirect URIs',
          value: `${baseUrl}/`
        },
        {
          step: 4,
          action: 'Set Site URL',
          location: 'Products → Facebook Login → Settings → Site URL', 
          value: baseUrl
        },
        {
          step: 5,
          action: 'Test Login',
          details: 'Deploy app and test Facebook login button'
        }
      ],
      
      // Common Issues & Solutions
      troubleshooting: {
        'User cancelled login or did not fully authorize': [
          'Add your domain to App Domains in Facebook App',
          'Add redirect URI to Facebook Login settings',
          'If app is in Development Mode, add yourself as Test User',
          'Clear browser cache and try again'
        ],
        'Facebook SDK not loading': [
          'Check browser console for script loading errors',
          'Verify no ad blockers are interfering',
          'Check network tab for failed requests'
        ],
        '401 errors on static files': [
          'Updated vercel.json should fix this',
          'Clear browser cache',
          'Check if domain is correctly configured'
        ]
      },
      
      // Test URLs
      testEndpoints: {
        debug: `${baseUrl}/api/debug`,
        home: `${baseUrl}/`,
        login: 'Click Facebook login button on homepage'
      }
    };

    res.json(debugInfo);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      error: 'Debug endpoint failed',
      details: error.message
    });
  }
} 