# Facebook Login Integration - Getting Started

## 🎯 Current Focus: Basic Facebook Login

We're focusing on getting **basic Facebook login** working first, before adding Messenger Platform features.

## ❌ Current Issues

Based on console logs:
- "User cancelled login or did not fully authorize"
- 401 errors on manifest.json 
- Facebook App configuration problems

## 🔧 Quick Fix Steps

### 1. Facebook App Configuration (CRITICAL)

**Go to [Facebook Developers Console](https://developers.facebook.com/apps/)**
**Select your App ID: 30902396742455**

#### **App Domains** (Settings → Basic):
```
your-vercel-domain.vercel.app
localhost
```

#### **Valid OAuth Redirect URIs** (Products → Facebook Login → Settings):
```
https://your-vercel-domain.vercel.app/
http://localhost:3000/
```

#### **Site URL** (Products → Facebook Login → Settings):
```
https://your-vercel-domain.vercel.app/
```

### 2. Required Products in Facebook App

Add these products to your app:
- ✅ **Facebook Login** (Essential)
- ✅ **Webhooks** (For later)

### 3. Basic Permissions (App Review → Permissions)

For basic login, you only need:
- ✅ `public_profile` (Default - no review needed)
- ✅ `email` (Default - no review needed)

**Note:** No Advanced Access needed for basic login!

### 4. Test Users (if app is in Development Mode)

If your app is still in Development Mode:
- Go to **Roles → Test Users**
- Add yourself as a Test User
- OR switch app to **Live Mode** (Settings → Basic → App Mode)

## 🚀 Deploy and Test

### Deploy to Vercel
```bash
vercel --prod
```

### Test the Login
1. Visit your deployed app
2. Open browser console (F12)
3. Click "Login with Facebook"
4. Check console for detailed logs

## 🐛 Debugging Common Issues

### "User cancelled login or did not fully authorize"

**Most common causes:**
1. ❌ **App Domain missing** - Add your domain to App Domains
2. ❌ **Redirect URI missing** - Add your URL to Valid OAuth Redirect URIs  
3. ❌ **App in Development Mode** - Add yourself as Test User or switch to Live
4. ❌ **Wrong App ID** - Verify App ID `30902396742455` is correct

### 401 Errors on Static Files

**Quick fix:**
- The updated `vercel.json` should fix this
- If still happening, try clearing browser cache

### Facebook SDK Not Loading

**Console will show:**
- "Facebook SDK script loaded successfully" ✅
- "Facebook SDK initialized successfully" ✅
- If you see timeouts or errors, check browser network tab

## 🎯 Testing Checklist

**Before testing:**
- [ ] App Domain added to Facebook App
- [ ] Redirect URI added to Facebook Login settings
- [ ] App deployed to Vercel
- [ ] Browser cache cleared

**During testing:**
- [ ] Open browser console before clicking login
- [ ] Click "Login with Facebook" button
- [ ] Should redirect to Facebook
- [ ] After auth, should see "Login completed successfully!" in console
- [ ] User name should appear in navigation

## 🔍 Debug Tools

Visit `https://your-domain.vercel.app/api/debug` to see:
- Current domain and URLs
- What needs to be configured in Facebook App
- Environment variables status

## ⚡ Quick Test

Try this minimal test:
1. Deploy your app
2. Visit the debug endpoint: `/api/debug`
3. Copy the URLs shown and add them to Facebook App settings
4. Test login immediately

---

## 🚧 What We're NOT Doing Yet

- Messenger Platform integration
- PSID exchange
- Advanced permissions
- Webhook handling for messages

**Goal:** Get basic Facebook login working first, then we can add the messaging features later!

## 🆘 Need Help?

If login still fails:
1. Check browser console for exact error messages
2. Verify Facebook App settings match your deployed domain exactly
3. Test with a different browser or incognito mode
4. Make sure you're using the correct App ID: `30902396742455` 