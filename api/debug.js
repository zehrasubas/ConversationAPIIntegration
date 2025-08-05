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

    // Get app IDs from environment variables
    const loginAppId = process.env.FACEBOOK_LOGIN_APP_ID;
    const messengerAppId = process.env.FACEBOOK_APP_ID;
    const verifyToken = process.env.VERIFY_TOKEN;

    const debugInfo = {
      deploymentCheck: "DEPLOYMENT_TEST_2024_" + Date.now(),
      timestamp: new Date().toISOString(),
      domain: host,
      baseUrl: baseUrl,
      
      // Two-App Architecture
      facebookLogin: {
        appId: loginAppId || 'NOT_SET',
        purpose: 'Facebook Login only',
        currentScope: ['public_profile', 'email'],
        status: loginAppId ? 'Active for basic login' : 'Missing APP ID',
        requiredSettings: {
          appDomains: [host],
          validOAuthRedirectURIs: [`${baseUrl}/`],
          siteUrl: baseUrl,
          appType: 'Consumer (recommended)',
          appMode: 'Live (for production) or Development (for testing)'
        }
      },
      
      messengerPlatform: {
        appId: messengerAppId || 'NOT_SET',
        purpose: 'Messenger Platform integration',
        status: messengerAppId ? 'Setup required - add Messenger Product' : 'Missing APP ID',
        requiredSettings: {
          messengerProduct: 'Add Messenger Platform product',
          pageAccessToken: 'Generate Page Access Token',
          webhookUrl: `${baseUrl}/api/webhook`,
          verifyToken: verifyToken || 'NOT_SET'
        }
      },
      
      troubleshooting: {
        commonIssues: [
          'Check login app configuration',
          'Complete Messenger Platform setup',
          'Verify environment variables are set',
          'Ensure webhook URL is accessible'
        ],
        quickLinks: [
          `Login App: https://developers.facebook.com/apps/${loginAppId || '[LOGIN_APP_ID]'}/settings/basic/`,
          `Login OAuth: https://developers.facebook.com/apps/${loginAppId || '[LOGIN_APP_ID]'}/fb-login/settings/`,
          `Messenger App: https://developers.facebook.com/apps/${messengerAppId || '[MESSENGER_APP_ID]'}/`,
          `Messenger Setup: https://developers.facebook.com/apps/${messengerAppId || '[MESSENGER_APP_ID]'}/messenger/`
        ]
      },

      environmentCheck: {
        loginAppId: !!loginAppId,
        messengerAppId: !!messengerAppId,
        verifyToken: !!verifyToken,
        pageAccessToken: !!process.env.PAGE_ACCESS_TOKEN,
        pageId: !!process.env.PAGE_ID
      }
    };

    res.status(200).json(debugInfo);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      error: 'Debug endpoint failed', 
      details: error.message 
    });
  }
} 