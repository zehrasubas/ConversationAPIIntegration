/**
 * Test script for conversation transfer
 * Use this to test your implementation in browser console
 */

// Test data generator
function generateTestConversation() {
  const testConversation = {
    messages: [
      {
        text: "Hi, I need help with my order",
        sender: "customer",
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        text: "Hello! I'd be happy to help. What's your order number?",
        sender: "agent",
        timestamp: new Date(Date.now() - 240000).toISOString()
      },
      {
        text: "It's ORDER-12345",
        sender: "customer",
        timestamp: new Date(Date.now() - 180000).toISOString()
      },
      {
        text: "Let me check that for you...",
        sender: "agent",
        timestamp: new Date(Date.now() - 120000).toISOString()
      },
      {
        text: "I see the issue. Let me transfer you to our support team for further assistance.",
        sender: "agent",
        timestamp: new Date(Date.now() - 60000).toISOString()
      }
    ],
    metadata: {
      startTime: new Date(Date.now() - 300000).toISOString(),
      lastUpdateTime: new Date(Date.now() - 60000).toISOString(),
      topic: "Order Issue - ORDER-12345",
      status: "active",
      sessionId: "test_session_12345"
    }
  };
  
  // Save to storage
  sessionStorage.setItem('chat_transfer_context', JSON.stringify(testConversation));
  localStorage.setItem('chat_transfer_context', JSON.stringify(testConversation));
  
  console.log('✅ Test conversation saved:', testConversation);
  return testConversation;
}

// Debug function to check storage
function checkStorage() {
  const sessionData = sessionStorage.getItem('chat_transfer_context');
  const localData = localStorage.getItem('chat_transfer_context');
  
  console.log('SessionStorage:', sessionData ? JSON.parse(sessionData) : 'Empty');
  console.log('LocalStorage:', localData ? JSON.parse(localData) : 'Empty');
}

// Clear storage
function clearTestData() {
  sessionStorage.removeItem('chat_transfer_context');
  localStorage.removeItem('chat_transfer_context');
  console.log('🧹 Test data cleared');
}

// Test the transfer flow
function testTransferFlow() {
  console.log('=== Testing Transfer Flow ===');
  
  // Step 1: Generate test data
  console.log('1. Generating test conversation...');
  generateTestConversation();
  
  // Step 2: Check storage
  console.log('2. Checking storage...');
  checkStorage();
  
  // Step 3: Simulate page navigation
  console.log('3. Ready for transfer. Navigate to support page or reload.');
  console.log('   The conversation should be prefilled in Zendesk widget.');
}

// Test conversation preparation
function testConversationPreparation() {
  const conversation = generateTestConversation();
  
  // Mark as transferred
  conversation.metadata.status = 'transferred';
  conversation.metadata.transferTime = new Date().toISOString();
  
  // Save updated conversation
  sessionStorage.setItem('chat_transfer_context', JSON.stringify(conversation));
  localStorage.setItem('chat_transfer_context', JSON.stringify(conversation));
  
  console.log('✅ Conversation marked as transferred');
  console.log('🔄 Navigate to /support to see prefilled widget');
}

// Mock the chat history manager for testing
function testHistoryManager() {
  // Mock adding messages
  console.log('📝 Testing chat history manager...');
  
  const messages = [
    "Hello, I have a question about shipping",
    "Can you help me track my order?",
    "My order number is ORD-123456"
  ];
  
  messages.forEach((msg, index) => {
    setTimeout(() => {
      // Simulate adding messages to history manager
      const message = {
        text: msg,
        sender: 'customer',
        timestamp: new Date().toISOString()
      };
      
      console.log(`💬 Message ${index + 1} added:`, message);
      
      if (index === messages.length - 1) {
        console.log('✅ All test messages added');
        console.log('🎯 Try clicking "Get Support" button to transfer to Zendesk');
      }
    }, index * 1000);
  });
}

// Check Zendesk widget status
function checkZendeskWidget() {
  if (typeof window.zE !== 'undefined') {
    console.log('✅ Zendesk widget is loaded');
    console.log('🔧 Widget functions available:', Object.keys(window.zE));
    
    // Try to get widget status
    try {
      window.zE('messenger:get', 'display', (display) => {
        console.log('📊 Widget display status:', display);
      });
    } catch (error) {
      console.log('⚠️ Could not get widget status:', error.message);
    }
  } else {
    console.log('❌ Zendesk widget not loaded');
    console.log('💡 Make sure REACT_APP_ZENDESK_WIDGET_KEY is configured');
  }
}

// Force open Zendesk widget
function openZendeskWidget() {
  if (typeof window.zE !== 'undefined') {
    try {
      window.zE('messenger', 'open');
      console.log('✅ Zendesk widget opened');
    } catch (error) {
      console.log('❌ Failed to open widget:', error.message);
    }
  } else {
    console.log('❌ Zendesk widget not available');
  }
}

// Make functions available globally
window.chatTransferTest = {
  generateTestConversation,
  checkStorage,
  clearTestData,
  testTransferFlow,
  testConversationPreparation,
  testHistoryManager,
  checkZendeskWidget,
  openZendeskWidget
};

console.log('🧪 Test functions loaded!');
console.log('📖 Available functions:');
console.log('  - chatTransferTest.testTransferFlow() - Test the complete flow');
console.log('  - chatTransferTest.testConversationPreparation() - Prepare test conversation');
console.log('  - chatTransferTest.checkStorage() - Check storage contents');
console.log('  - chatTransferTest.clearTestData() - Clear test data');
console.log('  - chatTransferTest.testHistoryManager() - Test history manager');
console.log('  - chatTransferTest.checkZendeskWidget() - Check widget status');
console.log('  - chatTransferTest.openZendeskWidget() - Open widget manually');
console.log('');
console.log('🚀 Quick start: Run chatTransferTest.testTransferFlow()');
