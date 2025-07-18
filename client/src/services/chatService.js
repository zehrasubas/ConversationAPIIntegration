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
      console.error('Server error response:', errorData);
      throw new Error(`Failed to initialize conversation: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error initializing conversation:', error);
    throw error;
  }
};

const sendMessage = async (message, psid) => {
  try {
    if (!message || !psid) {
      throw new Error('Message and PSID are required');
    }
    
    // First, ensure we have an active conversation
    await initializeConversation(psid);

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
      console.error('Server error response:', errorData);
      throw new Error(`Failed to send message: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

const fetchMessageHistory = async (psid) => {
  try {
    if (!psid) {
      throw new Error('PSID is required');
    }
    
    // First, ensure we have an active conversation
    await initializeConversation(psid);
    
    const response = await fetch(`${BASE_URL}/api/messages/history/${psid}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Server error response:', errorData);
      throw new Error(`Failed to fetch message history: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching message history:', error);
    throw error;
  }
};

export const chatService = {
  sendMessage,
  fetchMessageHistory,
  initializeConversation,
}; 