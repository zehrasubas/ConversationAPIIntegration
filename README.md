# Facebook Messenger Platform Integration with Vercel

A React app with Facebook Messenger Platform integration deployed on Vercel using serverless functions.

## Project Structure

```
your-project/
├── api/                              # Vercel serverless functions
│   ├── webhook.js                    # Facebook webhook endpoint
│   ├── exchange-token.js             # Convert Facebook ID to PSID
│   ├── messages/
│   │   ├── send.js                   # Send messages endpoint
│   │   └── history/
│   │       └── [userId].js           # Get message history (dynamic route)
│   └── conversations/
│       └── initialize.js             # Initialize conversations
├── client/                           # React frontend
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
├── package.json                      # Root package.json
├── vercel.json                       # Vercel configuration
└── README.md
```

## API Endpoints

Once deployed, your endpoints will be:

- `GET/POST /api/webhook` - Facebook webhook verification and events
- `POST /api/messages/send` - Send messages to Facebook users
- `GET /api/messages/history/[userId]` - Get message history for a user
- `POST /api/exchange-token` - Exchange Facebook user ID for PSID
- `POST /api/conversations/initialize` - Initialize Facebook conversation

## Environment Variables

Add these to your Vercel project:

```env
PAGE_ACCESS_TOKEN=your_facebook_page_access_token
VERIFY_TOKEN=your_webhook_verify_token
PAGE_ID=your_facebook_page_id
```

## Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# For production deployment
vercel --prod
```

### 2. Configure Facebook App

1. Go to [Facebook Developers Console](https://developers.facebook.com/apps/32902521059386)
2. Update **App Domains**: Add your Vercel domain
3. Update **Valid OAuth Redirect URIs**: Add your Vercel URL
4. Update **Webhook URL**: `https://your-vercel-url.vercel.app/api/webhook`
5. Add required permissions: `pages_messaging`, `pages_show_list`, etc.

### 3. Set Environment Variables

In Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add all required environment variables
3. Redeploy to apply changes

## Local Development

### Backend (API functions)
```bash
# Install Vercel CLI for local testing
npm install -g vercel

# Run serverless functions locally
vercel dev
```

### Frontend (React app)
```bash
cd client
npm install
npm start
```

The React app will run on `http://localhost:3000` and proxy API requests to the Vercel functions.

## Key Changes from Express.js

- **No Express server**: Uses Vercel serverless functions
- **Individual endpoints**: Each API route is a separate file
- **Automatic routing**: `/api/webhook.js` becomes `/api/webhook`
- **Dynamic routes**: `[userId].js` handles `/api/messages/history/123`
- **Environment variables**: Managed through Vercel dashboard

## Facebook Integration Features

- ✅ Webhook verification and event handling
- ✅ Send/receive messages
- ✅ Message history storage (in-memory, replace with DB)
- ✅ PSID-based user identification
- ✅ Auto-reply functionality
- ✅ Facebook Login integration

## Next Steps

1. **Database**: Replace in-memory storage with a database (MongoDB, PostgreSQL)
2. **Rich messaging**: Add templates, quick replies, attachments
3. **Conversation routing**: Implement handover protocol for human agents
4. **Message tags**: Add support for different message types
5. **Rate limiting**: Implement proper rate limiting for Facebook API

## Troubleshooting

### Webhook Issues
- Check Vercel function logs in dashboard
- Verify environment variables are set
- Test webhook URL: `https://your-app.vercel.app/api/webhook`

### Facebook Login Issues
- Verify app domains in Facebook Developer Console
- Check browser console for JavaScript errors
- Ensure correct App ID in React app

### API Issues
- Check Vercel function logs
- Verify environment variables
- Test endpoints manually with tools like Postman 