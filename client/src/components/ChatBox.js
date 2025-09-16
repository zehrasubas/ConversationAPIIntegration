import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import chatHistoryManager from '../services/chatHistoryManager';
import './ChatBox.css';

const ChatBox = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize chat history manager
  const initializeChatHistory = useCallback(() => {
    try {
      // Load existing conversation history
      const existingMessages = chatHistoryManager.getAllMessages();
      setMessages(existingMessages);
      setHistoryLoaded(true);

      // eslint-disable-next-line no-console
      console.log('📖 Chat history initialized:', existingMessages.length, 'messages loaded');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to initialize chat history:', error);
      setHistoryLoaded(true); // Still mark as loaded to avoid blocking UI
    }
  }, []);

  // Generate user display name for chat history
  // eslint-disable-next-line no-unused-vars
  const getUserDisplayName = useCallback(() => {
    if (user?.name) {
      return user.name;
    }
    return 'You';
  }, [user]);

  // Get or create PSID for messaging
  const [userPSID, setUserPSID] = useState(null);
  const [psidLoading, setPsidLoading] = useState(false);
  const [sseConnection, setSseConnection] = useState(null);

  // Get Facebook User ID
  const getFacebookUserId = useCallback(() => {
    if (user?.id) {
      return user.id;
    }
    return null;
  }, [user]);

  // Get or create user ID (Facebook ID or session-based ID)
  const getUserId = useCallback(() => {
    // If we have a PSID, use that for messaging
    if (userPSID) {
      return userPSID;
    }

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
  }, [user, userPSID]);

  // Exchange Facebook User ID for PSID
  const exchangeForPSID = useCallback(async () => {
    const facebookUserId = getFacebookUserId();
    if (!facebookUserId || psidLoading) return;

    setPsidLoading(true);
    try {
      // eslint-disable-next-line no-console
      console.log('🔄 Exchanging Facebook User ID for PSID:', facebookUserId);

      const response = await fetch('/api/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facebookUserId: facebookUserId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // eslint-disable-next-line no-console
        console.log('✅ Successfully obtained PSID:', data.psid);
        setUserPSID(data.psid);

        // Store PSID for future use
        sessionStorage.setItem('userPSID', data.psid);
      } else {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to get PSID:', data);
        // Continue without PSID - messages will be local only
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ PSID exchange error:', error);
    } finally {
      setPsidLoading(false);
    }
  }, [getFacebookUserId, psidLoading]);

  // Check if user is logged in (basic auth, not requiring PSID)
  const isAuthenticated = Boolean(user?.id);

  // Real-time messaging state

  // Load stored PSID on component mount
  useEffect(() => {
    const storedPSID = sessionStorage.getItem('userPSID');
    if (storedPSID) {
      setUserPSID(storedPSID);
    }
  }, []);

  // Exchange for PSID when user logs in
  useEffect(() => {
    if (user?.id && !userPSID && !psidLoading) {
      exchangeForPSID();
    }
  }, [user, userPSID, psidLoading, exchangeForPSID]);


  // Set up SSE connection for real-time messages
  useEffect(() => {
    if (!isAuthenticated || !isOpen || !userPSID) return;

    // eslint-disable-next-line no-console
    console.log('🌊 Setting up SSE connection for PSID:', userPSID);

    // Connect to message stream
    const eventSource = chatService.connectToMessageStream(
      userPSID,
      (newMessage) => {
        // eslint-disable-next-line no-console
        console.log('📨 Received new message via SSE:', newMessage);
        
        // Add message to chat if it's not already there
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (!exists) {
            return [...prev, newMessage];
          }
          return prev;
        });
        
        // Add to chat history manager
        chatHistoryManager.addMessage(newMessage.text, newMessage.sender === 'user' ? 'customer' : 'agent');
      },
      (error) => {
        // eslint-disable-next-line no-console
        console.error('❌ SSE connection error:', error);
      }
    );

    setSseConnection(eventSource);

    return () => {
      if (eventSource) {
        // eslint-disable-next-line no-console
        console.log('🔌 Closing SSE connection');
        eventSource.close();
        setSseConnection(null);
      }
    };
  }, [isAuthenticated, isOpen, userPSID]);

  // Close SSE connection when chat is closed
  useEffect(() => {
    if (!isOpen && sseConnection) {
      // eslint-disable-next-line no-console
      console.log('🔌 Closing SSE connection (chat closed)');
      sseConnection.close();
      setSseConnection(null);
    }
  }, [isOpen, sseConnection]);

  // Initialize chat history when component mounts (not on support page)
  useEffect(() => {
    const setupChatHistory = () => {
      try {
        // Only initialize if we're not on the support page
        if (window.location.pathname === '/support') {
          // eslint-disable-next-line no-console
          console.log('🚫 Support page detected - not initializing ChatBox history');
          return;
        }

        // eslint-disable-next-line no-console
        console.log('📜 Setting up chat history manager');

        // Initialize chat history
        initializeChatHistory();

      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error during chat history setup:', error);
      }
    };

    setupChatHistory();
  }, [initializeChatHistory]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Chat history is now managed by chatHistoryManager
  // Messages are persisted to localStorage/sessionStorage for transfer to Zendesk

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageText = inputMessage;
    setInputMessage('');

    try {
      if (!isAuthenticated) return;

      const newMessage = {
        id: Date.now(),
        text: messageText,
        sender: 'user',
        timestamp: new Date().toISOString(),
        status: 'sending'
      };

      // Optimistically add message to UI
      setMessages(prev => [...prev, newMessage]);

      // Add message to chat history manager
      chatHistoryManager.addMessage(messageText, 'customer');

      // Send through chat service using PSID for Messenger Platform
      const messageUserId = userPSID || getUserId();

      const response = await chatService.sendMessage(messageText, messageUserId, null);

      // Update message status
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id
          ? { ...msg, status: response?.status || 'sent' }
          : msg
      ));

      // If this is a bot response scenario, add automated response
      // This is a simple example - you can integrate with your actual chat API
      if (response?.reply) {
        const botMessage = {
          id: Date.now() + 1,
          text: response.reply,
          sender: 'business',
          timestamp: new Date().toISOString(),
          status: 'sent'
        };

        setMessages(prev => [...prev, botMessage]);
        chatHistoryManager.addMessage(response.reply, 'agent');
      }

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send message:', error);

      // Update message status to show error
      setMessages(prev => prev.map(msg =>
        msg.text === messageText
          ? { ...msg, status: 'failed', error: true }
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
    // eslint-disable-next-line no-console
    console.log('🎫 Preparing to transfer to support page...');

    // First, let's check what's in the chat history manager
    const allMessages = chatHistoryManager.getAllMessages();
    const currentConversation = chatHistoryManager.getFormattedConversation();

    // eslint-disable-next-line no-console
    console.log('📊 Debug - Current messages in UI:', messages.length);
    // eslint-disable-next-line no-console
    console.log('📊 Debug - Messages in history manager:', allMessages.length);
    // eslint-disable-next-line no-console
    console.log('📊 Debug - Current conversation data:', currentConversation);

    // If no conversation exists, create a sample one for testing
    if (!currentConversation && messages.length === 0) {
      // eslint-disable-next-line no-console
      console.log('⚠️ No conversation found, creating test conversation...');

      // Add some test messages
      chatHistoryManager.addMessage('Hi, I need help with my order', 'customer');
      chatHistoryManager.addMessage('Hello! I\'d be happy to help you with your order. What seems to be the issue?', 'agent');
      chatHistoryManager.addMessage('My order #12345 hasn\'t arrived yet and it was supposed to be here yesterday', 'customer');
      chatHistoryManager.addMessage('I understand your concern. Let me transfer you to our support team for immediate assistance.', 'agent');
    }

    // Prepare conversation for transfer
    const transferData = chatHistoryManager.prepareTransfer();

    if (transferData) {
      // eslint-disable-next-line no-console
      console.log('📋 Conversation prepared for transfer:', transferData.metadata);
      // eslint-disable-next-line no-console
      console.log('🔢 Messages to transfer:', transferData.messages.length);
      // eslint-disable-next-line no-console
      console.log('📝 Formatted text preview:', transferData.formattedText?.substring(0, 200) + '...');
    } else {
      // eslint-disable-next-line no-console
      console.log('⚠️ No conversation history to transfer');
    }

    // Redirect to support page where Zendesk widget will load with prefilled history
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
            {!historyLoaded && isAuthenticated && (
              <div className="login-prompt">
                Loading chat history...
              </div>
            )}
            {historyLoaded && (
              <div className="polling-indicator">
                <i className="fas fa-comments"></i> Chat ready
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
