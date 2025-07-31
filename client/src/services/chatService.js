const BASE_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : ''
);

const initializeConversation = async (psid) => {
  try {
    if (!psid) {
      throw new Error('PSID is required for conversation initialization');
    }
    
    const response = await fetch(`${BASE_URL}/api/conversations/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        psid,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      // eslint-disable-next-line no-console
      console.error('Server error response:', errorData);
      throw new Error(`Failed to initialize conversation: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error initializing conversation:', error);
    throw error;
  }
};

const sendMessage = async (message, psid) => {
  try {
    if (!message || !psid) {
      throw new Error('Message and PSID are required');
    }
    
    // COMMENTED OUT - Initialize conversation after Messenger Platform setup
    // await initializeConversation(psid);

    const response = await fetch(`${BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId: psid,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      // eslint-disable-next-line no-console
      console.error('Server error response:', errorData);
      throw new Error(`Failed to send message: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending message:', error);
    throw error;
  }
};

const fetchMessageHistory = async (psid, since = null) => {
  try {
    if (!psid) {
      throw new Error('PSID is required');
    }
    
    // Build URL with userId as query parameter
    let url = `${BASE_URL}/api/messages/history?userId=${encodeURIComponent(psid)}`;
    if (since) {
      url += `&since=${encodeURIComponent(since)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.text();
      // eslint-disable-next-line no-console
      console.error('Server error response:', errorData);
      throw new Error(`Failed to fetch message history: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching message history:', error);
    throw error;
  }
};

// Fetch only new messages since a timestamp
const fetchNewMessages = async (psid, since) => {
  return fetchMessageHistory(psid, since);
};

// Connect to Server-Sent Events for real-time message streaming
const connectToMessageStream = (psid, onMessage, onError = null) => {
  const url = `${BASE_URL}/api/messages/stream?userId=${encodeURIComponent(psid)}`;
  
  // eslint-disable-next-line no-console
  console.log('🌊 Connecting to message stream:', url);
  
  const eventSource = new EventSource(url);
  
  eventSource.onopen = () => {
    // eslint-disable-next-line no-console
    console.log('✅ SSE connection opened');
  };
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // eslint-disable-next-line no-console
      console.log('📨 SSE message received:', data);
      
      // Handle different event types
      switch (data.type) {
        case 'connected':
          // eslint-disable-next-line no-console
          console.log('🔗 SSE connection established for user:', data.userId);
          break;
        case 'new_message':
          // eslint-disable-next-line no-console
          console.log('🆕 New message via SSE:', data.message);
          onMessage(data.message);
          break;
        case 'heartbeat':
          // eslint-disable-next-line no-console
          console.log('💓 SSE heartbeat');
          break;
        default:
          // eslint-disable-next-line no-console
          console.log('❓ Unknown SSE event type:', data.type);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error parsing SSE message:', error);
      if (onError) onError(error);
    }
  };
  
  eventSource.onerror = (error) => {
    // eslint-disable-next-line no-console
    console.error('❌ SSE connection error:', error);
    if (onError) onError(error);
  };
  
  // Return the EventSource instance so caller can close it
  return eventSource;
};

export const chatService = {
  sendMessage,
  fetchMessageHistory,
  fetchNewMessages,
  connectToMessageStream,
  initializeConversation,
}; 