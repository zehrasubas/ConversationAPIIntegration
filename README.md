# Facebook Messenger Platform Integration - Two-App Architecture

## 🏗️ **Architecture Overview**

This project uses **two separate Facebook Apps** for clean separation of concerns:

- **Login App**: Handles Facebook Login only
- **Messenger App**: Handles Messenger Platform integration

## 📋 **Required Environment Variables for Vercel**

Add these to your **Vercel Dashboard → Settings → Environment Variables**:

```env
# Domain Configuration
APP_DOMAIN=your-domain.vercel.app
VERCEL_URL=your-domain.vercel.app

# Login App Configuration  
FACEBOOK_LOGIN_APP_ID=your_login_app_id

# Messenger App Configuration
FACEBOOK_APP_ID=your_messenger_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Page Access Token (Generate from Messenger App)
PAGE_ACCESS_TOKEN=your_facebook_page_access_token
PAGE_ID=your_facebook_page_id

# Webhook Configuration  
VERIFY_TOKEN=your_webhook_verify_token
WEBHOOK_SECRET=your_webhook_secret

# Zendesk Sunshine Conversations
ZENDESK_SUNSHINE_APP_ID=your_sunshine_app_id
ZENDESK_SUNSHINE_KEY_ID=your_sunshine_key_id
ZENDESK_SUNSHINE_SECRET=your_sunshine_secret
ZENDESK_SUBDOMAIN=your_zendesk_subdomain
```

## 🔧 **Facebook Developer Console Setup**

### **Part 1: Login App Setup**

1. **Go to:** https://developers.facebook.com/apps/[YOUR_LOGIN_APP_ID]/
2. **Settings → Basic**:
   - **App Domains:** `[YOUR_DOMAIN]`
   - **Site URL:** `https://[YOUR_DOMAIN]/`
3. **Products → Facebook Login → Settings**:
   - **Valid OAuth Redirect URIs:** `https://[YOUR_DOMAIN]/`
4. **Ensure App is Live mode** (not Development)

### **Part 2: Messenger App Setup**

1. **Go to:** https://developers.facebook.com/apps/[YOUR_MESSENGER_APP_ID]/
2. **Add Messenger Product**: **+ Add Product** → **Messenger** → **Set Up**
3. **Generate Page Access Token**:
   - **Messenger → Settings → Access Tokens**
   - **Select your Facebook Page** (create one if needed)
   - **Copy the Page Access Token**
   - **Add to Vercel as `PAGE_ACCESS_TOKEN`**
4. **Configure Webhook**:
   - **Messenger → Settings → Webhooks**
   - **Callback URL:** `https://[YOUR_DOMAIN]/api/webhook`
   - **Verify Token:** `[YOUR_VERIFY_TOKEN]`
   - **Subscribe to:** `messages`, `messaging_postbacks`

### **Step 4: Required Permissions**
Request these permissions in **App Review → Permissions**:
- ✅ `pages_messaging` - Send/receive messages
- ✅ `pages_manage_metadata` - Access conversation data
- ✅ `pages_read_engagement` - Read message engagement

## 🧪 **Testing Setup**

### **Test Webhook Verification**
```bash
curl -X GET "https://[YOUR_DOMAIN]/api/webhook?hub.verify_token=[YOUR_VERIFY_TOKEN]&hub.challenge=test&hub.mode=subscribe"
```
**Should return**: `test`

### **Test Message Sending**
```bash
curl -X POST "https://[YOUR_DOMAIN]/api/messages/send" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message", "userId": "USER_PSID"}'
```

## 🔄 **Message Flow**

### **Chat Bubble → Messenger**
1. User types in chat bubble
2. Message sent to `/api/messages/send`
3. API forwards to Facebook Messenger
4. Message appears in business Messenger

### **Messenger → Chat Bubble**
1. User messages your Facebook Page
2. Facebook sends webhook to `/api/webhook`
3. Webhook stores message
4. Chat bubble fetches new messages

## 🚧 **Implementation Steps**

1. ✅ **Facebook Console Setup** - Add Messenger Platform
2. ✅ **Environment Variables** - Add tokens and secrets
3. 🔄 **Update Chat Integration** - Connect to Messenger API
4. 🔄 **Test Bidirectional Messaging** - Verify both directions work

## 🆘 **Common Issues**

### **Webhook Verification Failed**
- Verify `VERIFY_TOKEN` matches exactly
- Check webhook URL is accessible
- Ensure `/api/webhook` endpoint is working

### **Message Sending Failed**
- Check `PAGE_ACCESS_TOKEN` is valid
- Verify user has messaged your page first (24-hour window)
- Check user PSID is correct

### **Permission Denied**
- Request Advanced Access for required permissions
- Add app to Facebook Page as admin
- Verify page access token has correct permissions

## 🎯 **Next Steps**

Once environment variables are set up, we'll implement:
1. **PSID Exchange** - Convert Facebook User ID to Page-scoped ID
2. **Send Message Integration** - Chat bubble → Messenger
3. **Receive Message Handling** - Messenger → Chat bubble
4. **Real-time Updates** - Live message synchronization
