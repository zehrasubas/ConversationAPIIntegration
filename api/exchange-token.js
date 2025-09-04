// PSID Exchange Endpoint - Convert Facebook User ID to Page-Scoped ID
const fetch = require('node-fetch');

/**
 * Exchange Facebook User ID for Page-Scoped ID (PSID)
 * This is required for Messenger Platform messaging
 */
async function exchangeForPSID(facebookUserId) {
    console.log('🔄 Exchanging Facebook User ID for PSID:', facebookUserId);

    if (!process.env.PAGE_ACCESS_TOKEN) {
        throw new Error('PAGE_ACCESS_TOKEN environment variable is required');
    }

    try {
        // Use Facebook's ID Matching API to get PSID
        const response = await fetch(
            `https://graph.facebook.com/v19.0/${facebookUserId}/ids_for_pages?page=${process.env.PAGE_ID}&access_token=${process.env.PAGE_ACCESS_TOKEN}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        const data = await response.json();
        console.log('📤 Facebook ID exchange response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('❌ Facebook ID exchange error:', data);
            throw new Error(`Facebook API Error: ${data.error?.message || 'Unknown error'}`);
        }

        // Extract PSID from response
        if (data.data && data.data.length > 0) {
            const psid = data.data[0].id;
            console.log('✅ Successfully obtained PSID:', psid);
            return psid;
        }

        throw new Error('No PSID found in Facebook response');

    } catch (error) {
        console.error('❌ Error exchanging for PSID:', error.message);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { facebookUserId } = req.body;

        if (!facebookUserId) {
            return res.status(400).json({ error: 'facebookUserId is required' });
        }

        console.log('🔍 PSID exchange request for Facebook User ID:', facebookUserId);

        // Check environment variables
        if (!process.env.PAGE_ACCESS_TOKEN || !process.env.PAGE_ID) {
            return res.status(500).json({
                error: 'Server configuration incomplete',
                details: 'PAGE_ACCESS_TOKEN and PAGE_ID must be configured'
            });
        }

        const psid = await exchangeForPSID(facebookUserId);

        res.json({
            success: true,
            facebookUserId: facebookUserId,
            psid: psid,
            note: 'Use this PSID for sending messages via Messenger Platform'
        });

    } catch (error) {
        console.error('❌ PSID exchange error:', error);

        // Handle specific Facebook API errors
        if (error.message.includes('Facebook API Error')) {
            return res.status(400).json({
                error: 'Facebook API Error',
                details: error.message,
                suggestion: 'User may need to message your Facebook Page first to establish PSID'
            });
        }

        res.status(500).json({
            error: 'Failed to exchange for PSID',
            details: error.message
        });
    }
}
