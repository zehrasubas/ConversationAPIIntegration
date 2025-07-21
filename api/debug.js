// Debug endpoint for Facebook Login troubleshooting
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { headers } = req;
    const host = headers.host;
    const protocol = headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    const debugInfo = {
      deploymentCheck: "DEPLOYMENT_TEST_2024_" + Date.now(),
      timestamp: new Date().toISOString(),
      domain: host,
      baseUrl: baseUrl,
      
      // Two-App Architecture
      facebookLogin: {
        appId: '21102398933175',
        purpose: 'Facebook Login only',
        currentScope: ['public_profile', 'email'],
        status: 'Active for basic login',
        requiredSettings: {
          appDomains: [host],
          validOAuthRedirectURIs: [`${baseUrl}/`],
          siteUrl: baseUrl,
          appType: 'Consumer (recommended)',
          appMode: 'Live (for production) or Development (for testing)'
        }
      },
      
      messengerPlatform: {
        appId: '46602389605039',
        purpose: 'Messenger Platform integration',
        status: 'Setup required - add Messenger Product',
        requiredSettings: {
          messengerProduct: 'Add Messenger Platform product',
          pageAccessToken: 'Generate Page Access Token',
          webhookUrl: `${baseUrl}/api/webhook`,
          verifyToken: 'HiMetaConvAPIHi'
        }
      },
      
      troubleshooting: {
        loginIssues: [
          'Check login app (21102398933175) configuration',
          'Verify OAuth Redirect URIs for login app',
          'Ensure login app is Live mode',
          'Clear browser cache and test'
        ],
        messengerIssues: [
          'Complete Messenger Platform setup on app 46602389605039',
          'Add environment variables to Vercel',
          'Verify webhook URL is accessible',
          'Test with Facebook Page admin'
        ]
      },
      
      debugActions: [
        `Login App: https://developers.facebook.com/apps/21102398933175/settings/basic/`,
        `Login OAuth: https://developers.facebook.com/apps/21102398933175/fb-login/settings/`,
        `Messenger App: https://developers.facebook.com/apps/46602389605039/`,
        `Messenger Setup: https://developers.facebook.com/apps/46602389605039/messenger/`
      ]
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