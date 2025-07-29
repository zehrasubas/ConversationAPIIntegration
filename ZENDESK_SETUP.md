# Zendesk Integration Setup Guide

## 🎯 Overview

This integration adds Zendesk support functionality to your Facebook Messenger conversation API project. Users can now seamlessly transfer from your website chat widget to Zendesk support while preserving their conversation history.

## 🏗️ Flow Architecture

1. **User chats** on website via custom chat widget
2. **Conversation history** is stored in localStorage  
3. **"Get Support" button** appears when user has messages
4. **Click redirects** to `/support` page
5. **Support page automatically**:
   - Creates Zendesk ticket with conversation history
   - Loads Zendesk messaging widget
   - Transfers context seamlessly

## 📋 Environment Variables Required

Add these to your **Vercel Dashboard → Settings → Environment Variables**:

```env
# Existing Facebook vars (keep these)
FACEBOOK_LOGIN_APP_ID=21102398933175
FACEBOOK_APP_ID=30902396742455
FACEBOOK_APP_SECRET=your_facebook_app_secret
PAGE_ACCESS_TOKEN=your_facebook_page_access_token
VERIFY_TOKEN=HiMetaConvAPIHi
PAGE_ID=29202387465526
WEBHOOK_SECRET=0e7e5f5869595f2f8a68d686cfd87cdb

# New Zendesk Integration Variables
ZENDESK_SUBDOMAIN=startup3297
ZENDESK_EMAIL=swapnilchavada@gmail.com
ZENDESK_API_TOKEN=eQ9c60jNhZshcV3zKCT7TYDZM43USbYRMpb0gAOi
ZENDESK_WIDGET_KEY=d00c5a70-85da-47ea-bd7d-7445bcc31c38
ZENDESK_CONVERSATION_HISTORY_FIELD_ID=39467850731803
ZENDESK_SESSION_ID_FIELD_ID=39467890996891
```

## 🔧 Zendesk Configuration

### 1. Widget Setup (Already Done)
- **Widget Key**: `d00c5a70-85da-47ea-bd7d-7445bcc31c38`
- **Subdomain**: `startup3297.zendesk.com`

### 2. Custom Fields (Already Created)
- **Conversation History Field**: ID `39467850731803`
- **Chat Session ID Field**: ID `39467890996891`

### 3. API Token (Already Generated)
- **Token**: `eQ9c60jNhZshcV3zKCT7TYDZM43USbYRMpb0gAOi`
- **Email**: `swapnilchavada@gmail.com`

## 🚀 Deployment Steps

### Step 1: Add Environment Variables to Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add all the Zendesk variables listed above
3. **Important**: Make sure to deploy after adding variables

### Step 2: Deploy the Updated Code

```bash
# From your project root
npm run deploy

# Or using Vercel CLI
vercel --prod
```

### Step 3: Test the Integration

1. **Go to**: https://conversation-api-integration.vercel.app/
2. **Login** with Facebook
3. **Send a message** in the chat widget
4. **Click "Get Support"** button that appears
5. **Verify** you're redirected to `/support` page
6. **Check** that Zendesk widget loads and opens automatically
7. **Verify** ticket is created in your Zendesk dashboard

## 🧪 Testing URLs

### Development Testing
```bash
# Test ticket creation API
curl -X POST "https://conversation-api-integration.vercel.app/api/zendesk/create-ticket" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_123",
    "conversationHistory": [
      {"text": "Hello", "sender": "user", "timestamp": "2025-01-09T10:00:00Z"},
      {"text": "Hi there!", "sender": "bot", "timestamp": "2025-01-09T10:00:05Z"}
    ],
    "userEmail": "test@example.com",
    "userName": "Test User"
  }'
```

### Production URLs
- **Main Site**: https://conversation-api-integration.vercel.app/
- **Support Page**: https://conversation-api-integration.vercel.app/support
- **Ticket API**: https://conversation-api-integration.vercel.app/api/zendesk/create-ticket

## 📂 New Files Added

```
├── api/
│   └── zendesk/
│       └── create-ticket.js          # Zendesk ticket creation API
├── client/src/components/
│   ├── SupportPage.js                # Support page component
│   └── SupportPage.css               # Support page styles
└── ZENDESK_SETUP.md                  # This setup guide
```

## 🔄 Updated Files

```
├── client/src/
│   ├── App.js                        # Added /support routing
│   └── components/
│       ├── ChatBox.js                # Added conversation storage & support button
│       └── ChatBox.css               # Added support button styles
```

## 🎮 Features Implemented

### ✅ Chat Widget Enhancements
- **Conversation History Storage**: Automatically saves to localStorage
- **Get Support Button**: Appears when user has sent messages  
- **Seamless Handoff**: One-click redirect to support page

### ✅ Support Page Features
- **Automatic Ticket Creation**: Creates Zendesk ticket with conversation history
- **Widget Auto-Load**: Zendesk messaging widget loads and opens automatically
- **Context Transfer**: Session ID and conversation history passed to Zendesk
- **Error Handling**: Graceful fallbacks for loading issues
- **Responsive Design**: Works on desktop and mobile

### ✅ Backend API
- **Ticket Creation Endpoint**: `/api/zendesk/create-ticket`
- **Conversation History Formatting**: Readable format for support agents
- **Custom Field Population**: Automatically fills Zendesk custom fields
- **Error Handling**: Comprehensive error responses

## 🔍 Troubleshooting

### Widget Not Loading
1. **Check Environment Variables**: Ensure `ZENDESK_WIDGET_KEY` is correct
2. **Check Console**: Look for JavaScript errors
3. **Verify Domain**: Ensure your domain is whitelisted in Zendesk

### Ticket Creation Failing
1. **Check API Token**: Verify `ZENDESK_API_TOKEN` is correct
2. **Check Custom Fields**: Ensure field IDs match your Zendesk setup
3. **Check Console**: Review API response for error details

### Support Button Not Appearing  
1. **Login Required**: User must be logged in with Facebook
2. **Messages Required**: User must have sent at least one message
3. **Check Chat Widget**: Ensure ChatBox component is loaded

## 📊 Analytics & Monitoring

Monitor these metrics in your Zendesk dashboard:
- **Ticket Volume**: Track tickets with tag `chat-transfer`
- **Response Times**: Monitor support response metrics
- **Conversation Quality**: Review conversation history quality

## 🔐 Security Notes

- **API Token**: Stored securely in Vercel environment variables
- **Custom Fields**: Only accessible to Zendesk admins
- **Conversation Data**: Stored temporarily in localStorage, cleared after support transfer

## 🎯 Next Steps

1. **Train Support Team**: Educate agents on chat transfer tickets
2. **Monitor Usage**: Track support page visits and ticket creation
3. **User Feedback**: Collect feedback on support experience
4. **Performance**: Monitor Zendesk widget loading times

## 📧 Support

For questions about this integration:
- **Technical Issues**: Check Vercel deployment logs
- **Zendesk Configuration**: Contact Zendesk support
- **Feature Requests**: Update this documentation

---

**✅ Integration Complete**: Your Facebook Messenger chat widget now seamlessly connects to Zendesk support! 