import React, { useState, useRef, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import './ChatBox.css';

const ChatBox = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [smoochInitialized, setSmoochInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize Smooch SDK for anonymous conversations
  const initializeSmooch = useCallback(async () => {
    if (smoochInitialized || window.Smooch) return;

    try {
      // Load Smooch SDK script
      if (!window.Smooch) {
        const script = document.createElement('script');
        script.src = 'https://cdn.smooch.io/smooch.min.js';
        script.async = true;
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Get or create web integration
      const integrationResponse = await fetch('/api/smooch/create-web-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!integrationResponse.ok) {
        throw new Error('Failed to create web integration');
      }

      const integrationData = await integrationResponse.json();
      
      if (!integrationData.success || !integrationData.integrationId) {
        throw new Error('No integration ID received');
      }

      // Initialize Smooch with browser storage for anonymous users
      await window.Smooch.init({
        integrationId: integrationData.integrationId,
        browserStorage: 'sessionStorage', // Persist during session, clear on browser close
        embedded: false, // Don't show the widget in main chat
        soundNotificationEnabled: false, // Disable sounds in main chat
        menuItems: {} // Hide menu in main chat mode
      });

      setSmoochInitialized(true);
      // eslint-disable-next-line no-console
      console.log('✅ Smooch initialized for anonymous conversation');
      
      // Hide the Smooch widget since we're using our custom chat
      if (window.Smooch.close) {
        window.Smooch.close();
      }

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to initialize Smooch:', error);
    }
  }, [smoochInitialized]);

  // Get or create consistent external ID for Sunshine conversations
  const getExternalId = useCallback(() => {
    // If user is logged in with Facebook, use their ID as base
    if (user?.id) {
      return `facebook_${user.id}`;
    }
    
    // Otherwise, get or create session-based external ID
    let externalId = sessionStorage.getItem('sunshineExternalId');
    if (!externalId) {
      externalId = `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sunshineExternalId', externalId);
      // eslint-disable-next-line no-console
      console.log('🆔 Generated new Sunshine external ID:', externalId);
    }
    return externalId;
  }, [user]);

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

  // Initialize Smooch when component mounts (not on support page)
  useEffect(() => {
    const setupConversation = async () => {
      try {
        // Only initialize if we're not on the support page
        if (window.location.pathname === '/support') {
          // eslint-disable-next-line no-console
          console.log('🚫 Support page detected - not initializing Smooch in ChatBox');
          return;
        }

        // eslint-disable-next-line no-console
        console.log('🌞 Setting up anonymous conversation with Smooch');
        
        // Initialize Smooch for anonymous conversations
        await initializeSmooch();
        
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error during conversation setup:', error);
      }
    };

    setupConversation();
  }, [initializeSmooch]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // No longer save to localStorage - Sunshine API is the source of truth
  // Remove localStorage conversation history saving

  // Smooch handles real-time messaging automatically
  // No need for manual SSE connections

  // Fetch message history when chat is opened - COMMENTED OUT until Messenger setup
  // NOTE: Disabled until PAGE_ACCESS_TOKEN and Messenger Platform are configured

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageText = inputMessage;
    setInputMessage('');

    try {
      // If Smooch is initialized, send message through Smooch
      if (smoochInitialized && window.Smooch) {
        // eslint-disable-next-line no-console
        console.log('📤 Sending message through Smooch:', messageText);
        
        // Send message through Smooch - it will handle the conversation
        await window.Smooch.sendMessage({
          type: 'text',
          text: messageText
        });

        // Add message to local UI for immediate feedback
        const newMessage = {
          id: Date.now(),
          text: messageText,
          sender: 'user',
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        setMessages(prev => [...prev, newMessage]);

        // eslint-disable-next-line no-console
        console.log('✅ Message sent through Smooch successfully');
        return;
      }

      // Fallback to original logic if Smooch not available
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

      // Send through original API
      const currentUserId = getUserId();
      const currentExternalId = getExternalId();
      
      const response = await chatService.sendMessage(messageText, currentUserId, currentExternalId);

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
            {!smoochInitialized && isAuthenticated && (
              <div className="login-prompt">
                Initializing secure conversation...
              </div>
            )}
            {smoochInitialized && (
              <div className="polling-indicator">
                <i className="fas fa-shield-alt"></i> Secure conversation ready
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