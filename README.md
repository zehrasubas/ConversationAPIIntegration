# Facebook Messenger Platform Integration - Step by Step Guide

## 🎯 **Current Status: Adding Messenger Platform**

Your Facebook login works! Now we're adding full **Messenger Platform integration** so messages from your chat bubble appear in Facebook Messenger.

## 📋 **Required Environment Variables for Vercel**

Add these to your **Vercel Dashboard → Settings → Environment Variables**:

```env
# Facebook App Configuration
FACEBOOK_APP_ID=46602389605039
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Page Access Token (Generate from FB Console)
PAGE_ACCESS_TOKEN=your_facebook_page_access_token

# Webhook Configuration  
VERIFY_TOKEN=HiMetaConvAPIHi
PAGE_ID=29202387465526

# Optional: For webhook signature verification (recommended)
WEBHOOK_SECRET=0e7e5f5869595f2f8a68d686cfd87cdb
```

## 🔧 **Facebook Developer Console Setup**

### **Step 1: Add Messenger Platform**
1. Go to [Facebook Developers Console](https://developers.facebook.com/apps/)
2. Select App ID: `46602389605039`
3. Click **"Add Product"** → **"Messenger"** → **"Set Up"**

### **Step 2: Generate Page Access Token**
1. In **Messenger → Settings → Access Tokens**
2. **Select your Facebook Page** (create one if needed)
3. **Copy the Page Access Token**
4. **Add to Vercel environment variables** as `PAGE_ACCESS_TOKEN`

### **Step 3: Configure Webhook**
1. In **Messenger → Settings → Webhooks**
2. **Callback URL**: `https://conversation-api-integration.vercel.app/api/webhook`
3. **Verify Token**: Use the same value as your `VERIFY_TOKEN` env var
4. **Subscribe to**: `messages`, `messaging_postbacks`

### **Step 4: Required Permissions**
Request these permissions in **App Review → Permissions**:
- ✅ `pages_messaging` - Send/receive messages
- ✅ `pages_manage_metadata` - Access conversation data
- ✅ `pages_read_engagement` - Read message engagement

## 🧪 **Testing Setup**

### **Test Webhook Verification**
```bash
curl -X GET "https://conversation-api-integration.vercel.app/api/webhook?hub.verify_token=HiMetaConvAPIHi&hub.challenge=test&hub.mode=subscribe"
```
**Should return**: `test`

### **Test Message Sending**
```bash
curl -X POST "https://conversation-api-integration.vercel.app/api/messages/send" \
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