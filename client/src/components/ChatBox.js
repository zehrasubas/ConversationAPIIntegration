import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import './ChatBox.css';

const ChatBox = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectedToStream, setIsConnectedToStream] = useState(false);
  const messagesEndRef = useRef(null);
  const sseConnectionRef = useRef(null);

  // Get or create user ID (Facebook ID or session-based ID)
  const getUserId = useCallback(() => {
    // If user is logged in with Facebook, use their ID
    if (user?.id) {
      return user.id;
    }
    
    // Otherwise, get or create session-based ID
    let sessionUserId = sessionStorage.getItem('chatUserId');
    if (!sessionUserId) {
      sessionUserId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('chatUserId', sessionUserId);
      // eslint-disable-next-line no-console
      console.log('🆔 Generated new session user ID:', sessionUserId);
    }
    return sessionUserId;
  }, [user]);

  // Check if user is logged in (basic auth, not requiring PSID)
  const isAuthenticated = Boolean(user?.id);
  
  // Check if Messenger integration is available
  const hasMessengerIntegration = Boolean(user?.psid);

  // Load conversation history from Sunshine API on component mount
  useEffect(() => {
    const loadConversationHistory = () => {
      try {
        // Only load conversation history if we're not on the support page
        if (window.location.pathname === '/support') {
          // eslint-disable-next-line no-console
          console.log('🚫 Support page detected - not loading conversation history');
          return;
        }

        // eslint-disable-next-line no-console
        console.log('🌞 Loading conversation history from Sunshine API only');
        
        // We'll load from server via syncWithServerMessages instead of localStorage
        // No localStorage fallback - Sunshine API only
        
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error during conversation history setup:', error);
      }
    };

    loadConversationHistory();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // No longer save to localStorage - Sunshine API is the source of truth
  // Remove localStorage conversation history saving

  // Handle new messages from SSE stream
  const handleNewMessage = useCallback((newMessage) => {
    // eslint-disable-next-line no-console
    console.log('🆕 Received new message via SSE:', newMessage);
    
    // Check if we already have this message (avoid duplicates)
    setMessages(prev => {
      const existingIds = new Set(prev.map(msg => msg.id));
      if (existingIds.has(newMessage.id)) {
        // eslint-disable-next-line no-console
        console.log('🔄 Message already exists, skipping duplicate:', newMessage.id);
        return prev;
      }
      
      // eslint-disable-next-line no-console
      console.log('✨ Adding new message to chat:', newMessage);
      return [...prev, newMessage];
    });
  }, []);

  // Sync with server messages when opening chat
  const syncWithServerMessages = useCallback(async () => {
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Syncing with server messages...');
      
      const currentUserId = getUserId();
      // eslint-disable-next-line no-console
      console.log('🔄 Using user ID for sync:', currentUserId);
      
      // Fetch all messages from server (try Sunshine first, then fallback to old API)
      const response = await chatService.fetchMessageHistory(currentUserId);
      
      if (response?.success && response.messages?.length > 0) {
        // eslint-disable-next-line no-console
        console.log('📨 Server messages found:', response.messages.length);
        
        // Merge with local messages, avoiding duplicates
        const localIds = new Set(messages.map(msg => msg.id));
        const serverMessages = response.messages.filter(msg => !localIds.has(msg.id));
        
        if (serverMessages.length > 0) {
          // eslint-disable-next-line no-console
          console.log('✨ Merging server messages:', serverMessages.length);
          
          // Sort all messages by timestamp
          const allMessages = [...messages, ...serverMessages].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          setMessages(allMessages);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error syncing with server:', error);
    }
  }, [getUserId, messages]);

  // Connect to SSE stream for real-time messages
  const connectToMessageStream = useCallback(() => {
    if (!isAuthenticated || !user?.psid || sseConnectionRef.current) return;
    
    try {
      // eslint-disable-next-line no-console
      console.log('🌊 Connecting to message stream for user:', user.psid);
      
      const eventSource = chatService.connectToMessageStream(
        user.psid,
        handleNewMessage,
        (error) => {
          // eslint-disable-next-line no-console
          console.error('❌ SSE connection error:', error);
          setIsConnectedToStream(false);
        }
      );
      
      sseConnectionRef.current = eventSource;
      setIsConnectedToStream(true);
      
      // Handle connection state changes
      eventSource.addEventListener('open', () => {
        setIsConnectedToStream(true);
      });
      
      eventSource.addEventListener('error', () => {
        setIsConnectedToStream(false);
      });
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error connecting to message stream:', error);
      setIsConnectedToStream(false);
    }
  }, [isAuthenticated, user?.psid, handleNewMessage]);

  // Disconnect from SSE stream
  const disconnectFromMessageStream = useCallback(() => {
    if (sseConnectionRef.current) {
      // eslint-disable-next-line no-console
      console.log('🔌 Disconnecting from message stream');
      sseConnectionRef.current.close();
      sseConnectionRef.current = null;
      setIsConnectedToStream(false);
    }
  }, []);

  // Start/stop SSE connection based on chat state
  useEffect(() => {
    if (isOpen && isAuthenticated && user?.psid) {
      // Sync with server first, then connect to SSE stream
      syncWithServerMessages();
      connectToMessageStream();
    } else {
      // Disconnect SSE when chat is closed or user is not authenticated
      disconnectFromMessageStream();
    }

    // Cleanup on unmount
    return () => {
      disconnectFromMessageStream();
    };
  }, [isOpen, isAuthenticated, user?.psid, syncWithServerMessages, connectToMessageStream, disconnectFromMessageStream]);

  // Fetch message history when chat is opened - COMMENTED OUT until Messenger setup
  // NOTE: Disabled until PAGE_ACCESS_TOKEN and Messenger Platform are configured

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isAuthenticated) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      status: 'sending'
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    try {
      let userPSID = user?.psid;
      
      // If no PSID yet, try to get one (on-demand Messenger integration)
      if (!userPSID && user?.id) {
        // eslint-disable-next-line no-console
        console.log('🔄 First message - attempting Messenger integration...');
        try {
          const response = await fetch('/api/exchange-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: getUserId()
            })
          });

          const data = await response.json();
          // eslint-disable-next-line no-console
          console.log('📬 PSID Exchange Response:', data);
          
          if (data?.success && data?.psid) {
            userPSID = data.psid;
            // eslint-disable-next-line no-console
            console.log('✅ Messenger integration activated:', userPSID);
            
            // Update user data with PSID for future messages
            const userWithPSID = {
              ...user,
              psid: userPSID,
              messengerEnabled: true
            };
            localStorage.setItem('user', JSON.stringify(userWithPSID));
            // Note: Not updating React state during message send to avoid complexity
          } else {
            // eslint-disable-next-line no-console
            console.log('⚠️ Messenger integration not available - using local chat only');
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('❌ Error during Messenger integration:', error);
          // eslint-disable-next-line no-console
          console.log('📝 Continuing with local chat only');
        }
      }

      // Send message to backend (which will try to send to Messenger)
      // eslint-disable-next-line no-console
      console.log('📤 Sending message to backend - Messenger Platform setup pending...');
      const currentUserId = getUserId();
      const response = await chatService.sendMessage(inputMessage, userPSID || currentUserId);

      // eslint-disable-next-line no-console
      console.log('Message sent successfully:', response);
      
      // Show status in UI based on response
      if (response?.status === 'local_only') {
        // eslint-disable-next-line no-console
        console.log('💾 Message stored locally only - Messenger Platform not configured yet');
      }

      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: response?.status || 'sent' }
          : msg
      ));

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send message:', error);
      
      // Update message status to show error
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'local_only', error: true }
          : msg
      ));
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleGetSupport = () => {
    console.log('🎫 Redirecting to support page...');
    // eslint-disable-next-line no-console
    console.log('📝 Current conversation history:', messages);
    // eslint-disable-next-line no-console
    console.log('🔍 DEBUG: Messages length:', messages.length);
    
    // Conversation history is now stored in Sunshine API - no localStorage needed
    // eslint-disable-next-line no-console
    console.log('🌞 Conversation history available via Sunshine API');
    
    // Redirect to support page
    window.location.href = '/support';
  };

  return (
    <div className="chat-container">
      {/* Chat Toggle Button */}
      <button 
        className="chat-toggle-button"
        onClick={toggleChat}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-comments'}`}></i>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-content">
              <h3>Chat with Us</h3>
              {isAuthenticated && messages.length > 0 && (
                <button 
                  className="support-button"
                  onClick={handleGetSupport}
                  title="Get human support"
                >
                  <i className="fas fa-headset"></i>
                  Get Support
                </button>
              )}
            </div>
            {!isAuthenticated && (
              <div className="login-prompt">
                Please log in with Facebook to start chatting
              </div>
            )}
            {isAuthenticated && !hasMessengerIntegration && (
              <div className="login-prompt">
                Send a message to activate Messenger integration
              </div>
            )}
            {isAuthenticated && hasMessengerIntegration && isConnectedToStream && (
              <div className="polling-indicator">
                <i className="fas fa-wifi"></i> Connected to live messages
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="messages-container">
            {isLoading ? (
              <div className="loading-messages">Loading messages...</div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="no-messages">
                    {isAuthenticated ? "Start a conversation!" : "Log in to start chatting"}
                  </div>
                )}
                {messages.map(message => (
                  <div 
                    key={message.id}
                    className={`message ${message.sender === 'user' ? 'user-message' : 'business-message'}`}
                  >
                    <div className="message-content">
                      {message.text}
                    </div>
                    <div className="message-timestamp">
                      {formatTime(message.timestamp)}
                      {message.status === 'sending' && ' • Sending...'}
                      {message.status === 'failed' && ' • Failed'}
                      {message.status === 'local_only' && ' • Local chat'}
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="chat-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isAuthenticated ? "Type a message..." : "Please log in to chat"}
              className="chat-input"
              disabled={!isAuthenticated}
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={!inputMessage.trim() || !isAuthenticated}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBox; 