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

      // Test 2: Try to create app key for token generation
      // Following the pattern from documentation
      const keyUrl = `https://startup3297.zendesk.com/sc/v2/apps/${appId}/keys`;
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
          appId: appId
        });
      } else {
        const keyErrorData = await keyResponse.text();
        console.log('❌ Key creation failed:', keyResponse.status, keyErrorData);
        console.log('❌ Key creation headers:', Object.fromEntries(keyResponse.headers.entries()));
        
        // Try to parse error as JSON for better details
        try {
          const errorJson = JSON.parse(keyErrorData);
          console.log('❌ Parsed error details:', errorJson);
        } catch (e) {
          console.log('❌ Raw error text:', keyErrorData);
        }
        
        // Still success for basic auth, but couldn't create key
        res.status(200).json({
          success: true,
          message: 'Basic authentication working, but key creation failed',
          appInfo: result.app,
          appId: appId,
          keyCreationError: {
            status: keyResponse.status,
            error: keyErrorData
          }
        });
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