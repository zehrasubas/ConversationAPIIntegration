# Zendesk Web Widget Integration Setup

This guide explains how to set up the Zendesk Web Widget with conversation history prefill functionality.

## Overview

This integration uses the **Zendesk Web Widget** with prefill functionality to transfer conversation history from your main chat to Zendesk support. The flow is:

1. User chats on main website (stored in localStorage/sessionStorage)
2. User clicks "Get Support" 
3. Chat history is prepared for transfer
4. User is redirected to support page
5. Zendesk Web Widget loads with prefilled conversation history

## Required Environment Variables

Add this environment variable to your Vercel deployment:

```bash
REACT_APP_ZENDESK_WIDGET_KEY=your_zendesk_widget_key
```

## Setup Steps

### 1. Get Your Zendesk Widget Key

1. Log into **Zendesk Admin Center**
2. Go to **Channels** → **Messaging and social** → **Messaging**
3. Click **Installation** 
4. Copy your widget key from the snippet:
   ```html
   <script id="ze-snippet" src="https://static.zdassets.com/ekr/snippet.js?key=YOUR_KEY_HERE"></script>
   ```
5. The key is the value after `?key=`

### 2. Configure Environment Variable

1. Go to your **Vercel project dashboard**
2. Navigate to **Settings** → **Environment Variables**
3. Add the variable:
   - **Name**: `REACT_APP_ZENDESK_WIDGET_KEY`
   - **Value**: Your widget key from step 1

### 3. Test the Integration

#### Option A: Use Test Script (Recommended)

1. Open your website in the browser
2. Open browser console (F12)
3. Run the test script:
   ```javascript
   // Load test script if not already loaded
   const script = document.createElement('script');
   script.src = '/test-chat-transfer.js';
   document.head.appendChild(script);
   
   // After script loads, run test
   setTimeout(() => {
     chatTransferTest.testTransferFlow();
   }, 1000);
   ```
4. Navigate to `/support` page to see prefilled widget

#### Option B: Manual Testing

1. **Login with Facebook** on your main site
2. **Open the chat widget** and send a few messages
3. **Click "Get Support"** button
4. You should be redirected to the support page
5. **Zendesk widget should open** with your conversation history prefilled

## How It Works

### Chat History Capture

- **File**: `client/src/services/chatHistoryManager.js`
- **Purpose**: Captures and stores conversation history
- **Storage**: Uses both sessionStorage and localStorage
- **Format**: Structured conversation data with metadata

### Zendesk Widget Integration

- **File**: `client/src/services/zendeskWidgetIntegration.js`
- **Purpose**: Loads conversation history and prefills Zendesk widget
- **Method**: Uses `zE('messenger', 'prefill', {...})` API

### Transfer Flow

1. **ChatBox component** captures messages via `chatHistoryManager`
2. **"Get Support" button** calls `chatHistoryManager.prepareTransfer()`
3. **SupportPage component** loads Zendesk widget
4. **zendeskWidgetIntegration** injects conversation history
5. **Widget opens** with prefilled conversation

## Configuration Options

### Chat History Manager

Located in `client/src/services/chatHistoryManager.js`:

```javascript
// Modify these settings as needed
const STORAGE_KEY = 'chat_transfer_context';
const MAX_MESSAGES = 50; // Maximum messages to transfer
```

### Zendesk Integration

Located in `client/src/services/zendeskWidgetIntegration.js`:

```javascript
// Modify these settings as needed
this.maxAttempts = 50; // How long to wait for widget (5 seconds)
this.conversation.metadata.status = 'transferred'; // Transfer status
```

## Troubleshooting

### Widget Doesn't Load

1. **Check environment variable**: Ensure `REACT_APP_ZENDESK_WIDGET_KEY` is set
2. **Verify widget key**: Test the key manually:
   ```html
   <script id="ze-snippet" src="https://static.zdassets.com/ekr/snippet.js?key=YOUR_KEY"></script>
   ```
3. **Check browser console** for JavaScript errors

### No History Transfer

1. **Check storage**: Run in console:
   ```javascript
   chatTransferTest.checkStorage();
   ```
2. **Verify conversation was marked as transferred**:
   ```javascript
   const data = sessionStorage.getItem('chat_transfer_context');
   console.log(JSON.parse(data));
   ```
3. **Check support page console** for integration logs

### Widget Opens But No Prefill

1. **Check widget ready event**: Look for "Zendesk messenger ready" in console
2. **Verify prefill format**: Check that conversation text is properly formatted
3. **Test manually**:
   ```javascript
   window.zE('messenger', 'prefill', {
     message: { value: 'Test prefill message' }
   });
   ```

### Common Issues

1. **Cross-tab navigation**: Use localStorage instead of sessionStorage if navigating in new tab
2. **Storage cleared too early**: Adjust timing in `clearStorage()` function
3. **Widget conflicts**: Ensure no other chat widgets are loaded simultaneously

## Testing Commands

Open browser console and run:

```javascript
// Test complete flow
chatTransferTest.testTransferFlow();

// Check storage contents
chatTransferTest.checkStorage();

// Test conversation preparation
chatTransferTest.testConversationPreparation();

// Check Zendesk widget status
chatTransferTest.checkZendeskWidget();

// Open widget manually
chatTransferTest.openZendeskWidget();

// Clear test data
chatTransferTest.clearTestData();
```

## Features

✅ **Conversation history capture** from main chat  
✅ **Automatic storage** in localStorage/sessionStorage  
✅ **Transfer preparation** with status tracking  
✅ **Zendesk widget prefill** with formatted history  
✅ **Cross-page navigation** support  
✅ **Error handling** and fallbacks  
✅ **Transfer notifications** for user feedback  
✅ **Test utilities** for debugging  

## Integration Benefits

- **Seamless user experience**: No lost conversation context
- **Agent context**: Full conversation history available immediately
- **No external dependencies**: Uses standard Zendesk Web Widget
- **Fallback support**: Works even if prefill fails
- **Debugging tools**: Built-in test utilities

## Support

If you encounter issues:

1. **Check browser console** for error messages
2. **Use test utilities** to debug specific components
3. **Verify environment variables** are correctly set
4. **Test with simple conversation** first
5. **Check Zendesk widget documentation** for additional features
