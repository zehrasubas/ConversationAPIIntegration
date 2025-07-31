# Zendesk Sunshine Conversations Integration Setup

This guide explains how to set up the Zendesk Sunshine Conversations integration for seamless conversation transfer.

## Overview

This integration uses **Zendesk Sunshine Conversations API** to create conversations that automatically appear in the Zendesk Web Widget. The flow is: Your System → Sunshine API → Zendesk Backend → Web Widget Display.

## Required Environment Variables

Add these environment variables to your Vercel deployment:

```bash
ZENDESK_SUNSHINE_APP_ID=your-app-id        # Your Sunshine Conversations App ID
ZENDESK_SUNSHINE_API_KEY=your-api-key      # Your Sunshine Conversations API Key
```

## Setup Steps

### 1. Enable Sunshine Conversations in Zendesk
1. Go to Zendesk Admin Center
2. Navigate to **Apps and integrations** → **APIs** → **Sunshine Conversations API**
3. Enable Sunshine Conversations if not already enabled

### 2. Create a Sunshine Conversations App
1. In Admin Center, go to **Apps and integrations** → **Sunshine Conversations**
2. Click **Create app** or use existing app
3. Note your **App ID** (without the `app_` prefix)

### 3. Generate API Key
1. In your Sunshine Conversations app settings
2. Go to **Settings** → **API keys**
3. Click **Create API key**
4. Copy the generated **Key ID** and **Secret**
5. Use the **Key ID** (with `app_` prefix) as your API key

### 4. Connect to Zendesk
1. In Sunshine Conversations, go to **Integrations**
2. Add **Zendesk** integration
3. Connect to your Zendesk instance
4. Note the **Integration ID** for the Web Widget

### 5. Add Environment Variables to Vercel
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the two variables listed above

## How It Works

### Conversation Transfer Flow
1. **User Request**: Customer clicks "Get Support" after chatting on website
2. **Sunshine API Call**: Creates conversation with formatted history summary
3. **User & Conversation Creation**: Sunshine automatically creates user and conversation
4. **Message Transfer**: Chat history formatted as beautiful summary message
5. **Widget Display**: Zendesk Web Widget automatically shows the conversation
6. **Agent Handoff**: Agents see full context and can continue conversation

### Technical Details
- Uses **Sunshine Conversations API** (`https://api.smooch.io/v2/apps/{appId}`)
- **Basic Auth** with API key (`Basic base64(apiKey:)`)
- **Automatic user creation** with profile information
- **Formatted conversation summary** with timestamps and speakers
- **Native widget integration** through Sunshine-Zendesk connection

### Benefits
- ✅ **Seamless integration** between Sunshine and Zendesk
- ✅ **Beautiful formatting** for conversation history
- ✅ **Automatic user management** - no manual user creation needed
- ✅ **Rich conversation context** with timestamps and speaker identification
- ✅ **Real-time widget updates** as conversation is created

## Troubleshooting

### Common Issues
1. **Authentication errors**: Verify App ID and API Key are correct
2. **Conversation not appearing**: Check if Sunshine-Zendesk integration is active
3. **Widget not loading**: Verify Web Widget key in SupportPage.js

### Debugging
- Check browser console for widget loading errors
- Review Vercel function logs for API call details
- Test Sunshine API connection manually if needed

### Testing the Integration
Use this example flow to verify everything works:
1. Chat on main website and send some messages
2. Click "Get Support" button
3. Should see support page with success message
4. Widget should auto-open showing conversation history

## Environment Variables Summary

Make sure you have these set in Vercel:
```bash
ZENDESK_SUNSHINE_APP_ID=67a0e949f0305f4a391e9d97
ZENDESK_SUNSHINE_API_KEY=app_67a0e949f0305f4a391e9d97:sk-1a2b3c4d5e6f...
```

## Success Indicators

When working correctly, you should see:
- ✅ Console logs: "Sunshine conversation created"
- ✅ Widget auto-opens with conversation history
- ✅ Formatted summary message visible in chat
- ✅ Follow-up message about agent wait time 