# Messaging Troubleshooting Guide

## 🚨 Current Issues Identified

### Problem 1: Messages from Facebook Page → Website not appearing
### Problem 2: Messages from Website → Facebook Page not being delivered

## 🔍 Root Cause Analysis

Based on code analysis, here are the likely issues:

### Issue 1: PSID (Page-Scoped ID) Management
- **Problem**: The chat system uses Facebook User ID for login, but needs PSID for messaging
- **Location**: `ChatBox.js` uses `user.id` (Facebook User ID) instead of PSID
- **Impact**: Messages can't be properly routed between systems

### Issue 2: Message Polling/Real-time Updates Missing
- **Problem**: Website doesn't actively check for new messages from Facebook
- **Location**: ChatBox component doesn't implement message polling
- **Impact**: Incoming Facebook messages aren't displayed on website

### Issue 3: Webhook Message Display Logic
- **Problem**: Webhook receives messages but they may not propagate to UI
- **Location**: No mechanism to push webhook messages to active chat sessions
- **Impact**: Real-time message sync broken

## 🛠 Step-by-Step Fixes Required

### Fix 1: PSID Exchange Implementation
1. Create PSID exchange endpoint
2. Convert Facebook User ID to PSID when user starts chatting
3. Store PSID mapping for message routing

### Fix 2: Message Polling System
1. Implement periodic message fetching in ChatBox
2. Add Server-Sent Events for real-time updates
3. Connect webhook messages to active sessions

### Fix 3: Environment Variable Check
1. Verify all Facebook tokens are correctly set
2. Test webhook connectivity
3. Validate Facebook app permissions

## 🧪 Testing Protocol

1. **Run diagnostic script**: `node debug-messaging.js`
2. **Test webhook**: Send message from Facebook Page
3. **Test send API**: Send message from website
4. **Check logs**: Monitor console and server logs
5. **Verify PSID**: Ensure correct PSID is being used

## 📋 Facebook Configuration Checklist

### Messenger App Configuration
- [ ] Webhook URL: `https://your-domain.vercel.app/api/webhook`
- [ ] Verify Token: Matches `VERIFY_TOKEN` env var
- [ ] Subscribed Events: `messages`, `messaging_postbacks`
- [ ] Page Access Token: Generated and added to env vars
- [ ] Permissions: `pages_messaging`, `pages_manage_metadata`

### Login App Configuration
- [ ] Valid OAuth Redirect URIs: `https://your-domain.vercel.app/`
- [ ] App Domains: `your-domain.vercel.app`
- [ ] Both apps in Live mode (not Development)

## 🔧 Required Environment Variables

```env
# Domain
APP_DOMAIN=your-domain.vercel.app
VERCEL_URL=your-domain.vercel.app

# Login App
FACEBOOK_LOGIN_APP_ID=your_login_app_id

# Messenger App
FACEBOOK_APP_ID=your_messenger_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
PAGE_ACCESS_TOKEN=your_page_access_token
PAGE_ID=your_facebook_page_id
VERIFY_TOKEN=your_verify_token

# Optional: Zendesk
REACT_APP_ZENDESK_WIDGET_KEY=your_zendesk_key
```

## 🚀 Immediate Action Plan

1. **Run diagnostics**: Use the debug script to identify specific issues
2. **Fix PSID exchange**: Implement proper PSID handling
3. **Add message polling**: Enable real-time message updates
4. **Test end-to-end**: Verify bidirectional messaging works
5. **Monitor logs**: Check for any remaining errors

## 📞 Quick Test Commands

```bash
# Test webhook verification
curl -X GET "https://your-domain.vercel.app/api/webhook?hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test&hub.mode=subscribe"

# Test message send
curl -X POST "https://your-domain.vercel.app/api/messages/send" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message", "userId": "USER_PSID"}'
```

## 🎯 Expected Behavior After Fixes

1. **Facebook → Website**: Messages sent to your Facebook Page appear in website chat
2. **Website → Facebook**: Messages typed in website chat appear in Facebook Messenger
3. **Real-time sync**: Messages appear immediately in both directions
4. **Proper routing**: Each user's messages are correctly threaded
5. **Error handling**: Clear error messages for failed operations
