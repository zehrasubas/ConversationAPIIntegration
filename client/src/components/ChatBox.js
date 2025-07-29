import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../services/chatService';
import './ChatBox.css';

const ChatBox = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Check if user is logged in (basic auth, not requiring PSID)
  const isAuthenticated = Boolean(user?.id);
  
  // Check if Messenger integration is available
  const hasMessengerIntegration = Boolean(user?.psid);

  // Load conversation history from localStorage on component mount
  useEffect(() => {
    const loadConversationHistory = () => {
      try {
        const stored = localStorage.getItem('conversationHistory');
        if (stored) {
          const history = JSON.parse(stored);
          console.log('📝 Loaded conversation history:', history.length, 'messages');
          setMessages(history);
        }
      } catch (error) {
        console.error('❌ Error loading conversation history:', error);
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

  // Save conversation history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('conversationHistory', JSON.stringify(messages));
        console.log('💾 Saved conversation history:', messages.length, 'messages');
      } catch (error) {
        console.error('❌ Error saving conversation history:', error);
      }
    }
  }, [messages]);

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
        console.log('🔄 First message - attempting Messenger integration...');
        try {
          const response = await fetch('/api/exchange-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id
            })
          });

          const data = await response.json();
          console.log('📬 PSID Exchange Response:', data);
          
          if (data?.success && data?.psid) {
            userPSID = data.psid;
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
            console.log('⚠️ Messenger integration not available - using local chat only');
          }
        } catch (error) {
          console.error('❌ Error during Messenger integration:', error);
          console.log('📝 Continuing with local chat only');
        }
      }

      // Send message to backend (which will try to send to Messenger)
      console.log('📤 Sending message to backend - Messenger Platform setup pending...');
      const response = await chatService.sendMessage(inputMessage, userPSID || user.id);

      console.log('Message sent successfully:', response);
      
      // Show status in UI based on response
      if (response?.status === 'local_only') {
        console.log('💾 Message stored locally only - Messenger Platform not configured yet');
      }

      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: response?.status || 'sent' }
          : msg
      ));

    } catch (error) {
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
    console.log('📝 Current conversation history:', messages);
    console.log('🔍 DEBUG: Messages length:', messages.length);
    
    // Force save conversation history before redirect
    try {
      localStorage.setItem('conversationHistory', JSON.stringify(messages));
      console.log('💾 DEBUG: Manually saved conversation history before redirect');
      
      // Verify it was saved
      const saved = localStorage.getItem('conversationHistory');
      const parsed = saved ? JSON.parse(saved) : [];
      console.log('✅ DEBUG: Verified saved history:', parsed);
    } catch (error) {
      console.error('❌ Error saving conversation history:', error);
    }
    
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