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
      facebookLogin: {
        appId: '30902396742455',
        currentScope: ['public_profile', 'email'],
        status: '⚠️ Login issues detected - Check Facebook App Configuration',
        requiredSettings: {
          appDomains: [host],
          validOAuthRedirectURIs: [`${baseUrl}/`],
          siteUrl: baseUrl,
          appType: 'Consumer (recommended)',
          appMode: 'Live (for production) or Development (for testing)'
        }
      },
      troubleshooting: {
        commonIssues: [
          'App is in Development mode but user is not a test user/admin',
          'Missing Facebook Login product in app',
          'Invalid OAuth Redirect URIs',
          'App Domains not configured',
          'Basic permissions not approved',
          'App needs to be switched to Live mode'
        ],
        checkSteps: [
          '1. Go to Facebook Developer Console',
          '2. Check App Status (Live vs Development)',
          '3. Verify Facebook Login product is added',
          '4. Check Valid OAuth Redirect URIs',
          '5. Verify App Domains',
          '6. Review basic permissions approval'
        ]
      },
      debugActions: [
        `Visit: https://developers.facebook.com/apps/30902396742455/settings/basic/`,
        `Check OAuth URIs: https://developers.facebook.com/apps/30902396742455/fb-login/settings/`,
        `Review permissions: https://developers.facebook.com/apps/30902396742455/app-review/permissions/`
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