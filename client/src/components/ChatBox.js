import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../services/chatService';
import './ChatBox.css';

const ChatBox = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Check if user is properly authenticated with PSID
  const isAuthenticated = Boolean(user?.psid);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch message history when chat is opened
  useEffect(() => {
    const loadMessageHistory = async () => {
      try {
        setIsLoading(true);
        const response = await chatService.fetchMessageHistory(user.psid);
        console.log('Message history loaded:', response);
        if (response.messages) {
          setMessages(response.messages);
        }
      } catch (error) {
        console.error('Failed to load message history:', error);
        // Show error in UI
        setMessages([{
          id: 'error',
          text: 'Failed to load messages. Please try again later.',
          sender: 'system',
          timestamp: new Date().toISOString()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && isAuthenticated) {
      loadMessageHistory();
    }
  }, [isOpen, isAuthenticated, user.psid]);

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
      // Send message to backend
      const response = await chatService.sendMessage(inputMessage, user.psid);
      console.log('Message sent successfully:', response);
      
      // Update message status on success
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'sent', id: response.messageId } 
          : msg
      ));

      // If there's an immediate response from the business
      if (response.reply) {
        setMessages(prev => [...prev, {
          id: response.reply.id,
          text: response.reply.text,
          sender: 'business',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Update message status on failure
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, status: 'failed', error: error.message } 
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
            <h3>Chat with Us</h3>
            {!isAuthenticated && (
              <div className="login-prompt">
                Please log in with Facebook to start chatting
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