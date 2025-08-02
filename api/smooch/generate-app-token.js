// Test Basic Authentication for Sunshine Conversations API
const fetch = require('node-fetch');

export default async function handler(req, res) {
  console.log('🔑 Testing basic authentication with Sunshine Conversations API');
  console.log('📥 Request method:', req.method);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Sunshine Conversations credentials
    const appId = process.env.ZENDESK_SUNSHINE_APP_ID;
    const keyId = process.env.ZENDESK_SUNSHINE_KEY_ID;
    const secret = process.env.ZENDESK_SUNSHINE_SECRET;

    console.log('🔧 Environment check:');
    console.log('  - App ID present:', !!appId);
    console.log('  - Key ID present:', !!keyId);
    console.log('  - Secret present:', !!secret);
    console.log('  - App ID value:', appId);
    console.log('  - Key ID value:', keyId);

    if (!appId || !keyId || !secret) {
      throw new Error('Missing Sunshine Conversations credentials');
    }

    // Create basic authentication header exactly as documented
    // Authorization: Basic base64("{key_id}:{key_secret}")
    const authString = `${keyId}:${secret}`;
    const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;
    
    console.log('🔧 Auth string format:', `${keyId}:****`);
    console.log('🔧 Auth header (first 30 chars):', authHeader.substring(0, 30) + '...');

    // Test 1: Simple API connectivity test - GET app info
    // Following documentation format: https://{subdomain}.zendesk.com/sc/v2/apps/{app_id}
    const testUrl = `https://startup3297.zendesk.com/sc/v2/apps/${appId}`;
    
    console.log('🔧 Testing basic auth with URL:', testUrl);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 API response status:', response.status);
    console.log('📥 API response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Basic authentication successful!');
      console.log('📝 App info received:', {
        id: result.app?.id,
        name: result.app?.name,
        hasSettings: !!result.app?.settings
      });

      // Test 2: Try original Smooch.io endpoints for key creation
      // Maybe Zendesk subdomain endpoints don't support key creation
      const smoochUrls = [
        `https://api.smooch.io/v2/apps/${appId}/appKeys`,
        `https://api.smooch.io/v2/apps/${appId}/keys`
      ];

      for (const keyUrl of smoochUrls) {
        console.log('🔧 Trying Smooch.io endpoint:', keyUrl);

        try {
          const keyResponse = await fetch(keyUrl, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              displayName: 'Web Widget Token'
            })
          });

          console.log('📥 Smooch.io response status:', keyResponse.status);

          if (keyResponse.ok) {
            const keyResult = await keyResponse.json();
            console.log('✅ App key created successfully with Smooch.io!');
            
            res.status(200).json({
              success: true,
              message: 'Token created with Smooch.io API!',
              appInfo: result.app,
              appToken: keyResult.key?.secret,
              tokenId: keyResult.key?.id,
              appId: appId,
              usedEndpoint: keyUrl
            });
            return;
          } else {
            const errorData = await keyResponse.text();
            console.log(`❌ Smooch.io endpoint failed (${keyUrl}):`, keyResponse.status, errorData);
          }
        } catch (error) {
          console.log(`❌ Smooch.io request failed (${keyUrl}):`, error.message);
        }
      }

      // If Smooch.io endpoints also fail, fall back to the original Zendesk approach
      console.log('🔧 Smooch.io endpoints failed, trying Zendesk subdomain endpoints...');
      
      const keyUrl = `https://startup3297.zendesk.com/sc/v2/apps/${appId}/appKeys`;
      console.log('🔧 Now testing app key creation at:', keyUrl);

      const keyResponse = await fetch(keyUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          displayName: 'Web Widget Token'
          // Scope is determined automatically by the API key with basic auth
        })
      });

      console.log('📥 Key creation response status:', keyResponse.status);

      if (keyResponse.ok) {
        const keyResult = await keyResponse.json();
        console.log('✅ App key created successfully!');
        
        res.status(200).json({
          success: true,
          message: 'Basic authentication working!',
          appInfo: result.app,
          appToken: keyResult.key?.secret,
          tokenId: keyResult.key?.id,
          appId: appId,
          usedFallback: true
        });
      } else {
        const keyErrorData = await keyResponse.text();
        console.log('❌ Key creation failed with appKeys endpoint:', keyResponse.status, keyErrorData);
        
        // Try fallback with original keys endpoint
        const fallbackUrl = `https://startup3297.zendesk.com/sc/v2/apps/${appId}/keys`;
        console.log('🔧 Trying fallback URL:', fallbackUrl);
        
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            displayName: 'Web Widget Token'
          })
        });

        console.log('📥 Fallback response status:', fallbackResponse.status);

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          console.log('✅ App key created with fallback endpoint!');
          
          res.status(200).json({
            success: true,
            message: 'Basic authentication working with fallback!',
            appInfo: result.app,
            appToken: fallbackResult.key?.secret,
            tokenId: fallbackResult.key?.id,
            appId: appId,
            usedFallback: true
          });
        } else {
          const fallbackErrorData = await fallbackResponse.text();
          console.log('❌ Fallback also failed:', fallbackResponse.status, fallbackErrorData);
          
          // Parse both errors for detailed logging
          let parsedErrors = {};
          try {
            parsedErrors.appKeys = JSON.parse(keyErrorData);
          } catch (e) { parsedErrors.appKeys = keyErrorData; }
          
          try {
            parsedErrors.keys = JSON.parse(fallbackErrorData);
          } catch (e) { parsedErrors.keys = fallbackErrorData; }
          
          console.log('❌ All parsed errors:', parsedErrors);
          
          // Still success for basic auth, but couldn't create key
          res.status(200).json({
            success: true,
            message: 'Basic authentication working, but both key creation endpoints failed',
            appInfo: result.app,
            appId: appId,
            keyCreationError: {
              appKeysEndpoint: {
                status: keyResponse.status,
                error: keyErrorData
              },
              keysEndpoint: {
                status: fallbackResponse.status,
                error: fallbackErrorData
              },
              parsedErrors: parsedErrors
            }
          });
        }
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Basic authentication failed:', response.status, errorData);
      
      throw new Error(`Authentication failed: ${response.status} - ${errorData}`);
    }

  } catch (error) {
    console.error('❌ Error testing basic authentication:', error);
    res.status(500).json({
      error: 'Basic authentication test failed',
      details: error.message
    });
  }
} 