# Zendesk Sunshine Conversations Setup

This guide explains how to set up the new conversation history replay feature using Zendesk's Sunshine Conversations API.

## Overview

The new implementation replays your website chat history as actual messages in Zendesk, so customers see seamless conversation continuity when they're transferred to support.

## Required Environment Variables

Add these to your Vercel deployment:

### 1. Zendesk Sunshine App ID
```
ZENDESK_SUNSHINE_APP_ID=your_sunshine_app_id
```

### 2. Zendesk Sunshine API Key  
```
ZENDESK_SUNSHINE_API_KEY=your_sunshine_api_key
```

## How to Get These Values

### Step 1: Enable Sunshine Conversations
1. Go to **Zendesk Admin Center** → **Apps and integrations** → **APIs** → **Sunshine Conversations API**
2. Click **Enable Sunshine Conversations**

### Step 2: Create a Sunshine App
1. In Sunshine Conversations dashboard: https://app.smooch.io/
2. Create new app or use existing app
3. Note the **App ID** (use for `ZENDESK_SUNSHINE_APP_ID`)

### Step 3: Generate API Key
1. In your Sunshine app → **Settings** → **API Keys**
2. Create new **Server** key with **Full Access**
3. Copy the key (use for `ZENDESK_SUNSHINE_API_KEY`)

### Step 4: Connect to Zendesk
1. In Sunshine app → **Integrations** → **Zendesk**
2. Connect your Zendesk instance
3. Configure message routing

## How It Works

### Old Flow (Traditional):
1. Customer chats on website
2. Clicks "Get Support" 
3. Creates Zendesk ticket with history in description
4. Customer sees empty chat widget (no context)

### New Flow (With Replay):
1. Customer chats on website
2. Clicks "Get Support"
3. **API replays entire conversation as actual messages**
4. Customer sees full chat history in Zendesk widget
5. Seamless handoff to human agents

## Technical Implementation

### API Endpoint: `/api/zendesk/replay-conversation`

**Request:**
```json
{
  "conversationHistory": [
    {
      "text": "Hello, I need help",
      "sender": "user", 
      "timestamp": "2025-01-01T12:00:00Z"
    },
    {
      "text": "How can I help you?",
      "sender": "business",
      "timestamp": "2025-01-01T12:00:30Z"
    }
  ],
  "userEmail": "customer@example.com",
  "userName": "John Doe",
  "sessionId": "session_123"
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "conv_abc123",
  "userId": "user_xyz789",
  "messagesReplayed": 2,
  "message": "Conversation history replayed successfully"
}
```

### Process:
1. **Create Sunshine User** with customer email/name
2. **Create Conversation** in Sunshine
3. **Replay Messages** as actual chat messages
4. **Add Handoff Message** welcoming customer
5. **Open Zendesk Widget** with populated conversation

## Benefits

✅ **Seamless Experience**: Customer sees full conversation history  
✅ **Agent Context**: Agents have complete customer context  
✅ **No Lost Information**: All previous interactions preserved  
✅ **Professional Handoff**: Clean transition from bot to human  
✅ **Fallback Support**: Still works with traditional approach if Sunshine fails

## Testing

1. **Have a conversation** on your website chat
2. **Click "Get Support"** button  
3. **Verify** that Zendesk widget opens with full conversation history
4. **Check** that agents can see the complete context

## Environment Setup

In Vercel dashboard → Your Project → Settings → Environment Variables:

```bash
# Existing Zendesk variables (keep these)
ZENDESK_SUBDOMAIN=your_subdomain
ZENDESK_EMAIL=your_email
ZENDESK_API_TOKEN=your_token

# New Sunshine Conversations variables (add these)
ZENDESK_SUNSHINE_APP_ID=your_sunshine_app_id
ZENDESK_SUNSHINE_API_KEY=your_sunshine_api_key
```

## Troubleshooting

### Common Issues:

**1. "Failed to replay conversation"**
- Check Sunshine API credentials
- Verify app is connected to Zendesk
- Check network/API limits

**2. "Empty conversation appears"** 
- Fallback mode activated
- Check environment variables
- Review Vercel function logs

**3. "User authentication failed"**
- Verify user email/name provided
- Check Sunshine user creation logs
- Ensure unique external IDs

### Fallback Behavior:
If Sunshine replay fails, the system automatically falls back to the traditional Zendesk approach with conversation fields - so support always works! 