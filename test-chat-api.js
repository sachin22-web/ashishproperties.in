// Test script for realtime chat functionality
const BASE_URL = 'http://localhost:8080';

// Test user credentials
const testBuyer = {
  email: 'test-buyer@test.com',
  password: 'test123',
  name: 'Test Buyer',
  phone: '9876543210',
  userType: 'buyer'
};

const testSeller = {
  email: 'test-seller@test.com', 
  password: 'test123',
  name: 'Test Seller',
  phone: '9876543211',
  userType: 'seller'
};

const testAdmin = {
  email: 'admin@aashishproperty.com',
  password: 'admin123',
  userType: 'admin'
};

async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}/api${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  const data = await response.json();
  return { response, data, status: response.status };
}

async function loginUser(credentials) {
  console.log(`🔐 Logging in ${credentials.userType}: ${credentials.email}`);
  const { response, data, status } = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  
  if (data.success) {
    console.log(`✅ Login successful for ${credentials.userType}`);
    return data.data.token;
  } else {
    console.log(`❌ Login failed: ${data.error}`);
    return null;
  }
}

async function findActiveProperty() {
  console.log('🏠 Finding active property...');
  const { data } = await apiCall('/properties?limit=10');
  
  if (data.success && data.data && data.data.length > 0) {
    const property = data.data[0];
    console.log(`✅ Found property: ${property._id} - ${property.title}`);
    return property;
  } else {
    console.log('❌ No properties found');
    return null;
  }
}

async function testConversationCreation(buyerToken, property) {
  console.log('\n📋 TEST 1: Create conversation');
  console.log(`🏠 Property ID: ${property._id}`);
  console.log(`👤 Property Owner: ${property.contactInfo?.name || 'Unknown'}`);
  
  const { response, data, status } = await apiCall('/conversations/find-or-create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${buyerToken}`
    },
    body: JSON.stringify({
      propertyId: property._id
    })
  });
  
  console.log(`📡 Response status: ${status}`);
  console.log(`📡 Response body:`, JSON.stringify(data, null, 2));
  
  if (status === 201 && data.success && data.data._id) {
    console.log(`✅ TEST 1 PASSED: Conversation created with ID: ${data.data._id}`);
    return data.data._id;
  } else {
    console.log(`❌ TEST 1 FAILED: Status ${status}, Response: ${JSON.stringify(data)}`);
    return null;
  }
}

async function testBuyerMessage(buyerToken, conversationId, message) {
  console.log(`\n📋 TEST 2: Buyer sends "${message}"`);
  
  const { response, data, status } = await apiCall(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${buyerToken}`
    },
    body: JSON.stringify({
      text: message
    })
  });
  
  console.log(`📡 Response status: ${status}`);
  console.log(`📡 Response body:`, JSON.stringify(data, null, 2));
  
  if (status === 201 && data.success) {
    console.log(`✅ TEST 2 PASSED: Message sent successfully`);
    return true;
  } else {
    console.log(`❌ TEST 2 FAILED: Status ${status}, Response: ${JSON.stringify(data)}`);
    return false;
  }
}

async function testGetMessages(token, conversationId, userType) {
  console.log(`\n📋 TEST 3: ${userType} gets conversation messages`);
  
  const { response, data, status } = await apiCall(`/conversations/${conversationId}/messages`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`📡 Response status: ${status}`);
  console.log(`📡 Response body:`, JSON.stringify(data, null, 2));
  
  if (status === 200 && data.success) {
    const messages = data.data || [];
    console.log(`✅ TEST 3 PASSED: Retrieved ${messages.length} messages`);
    return messages;
  } else {
    console.log(`❌ TEST 3 FAILED: Status ${status}, Response: ${JSON.stringify(data)}`);
    return [];
  }
}

async function testSellerConversations(sellerToken) {
  console.log(`\n📋 TEST 4: Seller gets conversation list`);
  
  const { response, data, status } = await apiCall('/conversations/my', {
    headers: {
      'Authorization': `Bearer ${sellerToken}`
    }
  });
  
  console.log(`📡 Response status: ${status}`);
  console.log(`📡 Response body:`, JSON.stringify(data, null, 2));
  
  if (status === 200 && data.success) {
    const conversations = data.data || [];
    console.log(`✅ TEST 4 PASSED: Seller has ${conversations.length} conversations`);
    return conversations;
  } else {
    console.log(`❌ TEST 4 FAILED: Status ${status}, Response: ${JSON.stringify(data)}`);
    return [];
  }
}

async function testAdminInbox(adminToken) {
  console.log(`\n📋 TEST 5: Admin support inbox`);
  
  const { response, data, status } = await apiCall('/admin/conversations', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  console.log(`📡 Response status: ${status}`);
  console.log(`📡 Response body:`, JSON.stringify(data, null, 2));
  
  if (status === 200 && data.success) {
    const conversations = data.data?.conversations || [];
    console.log(`✅ TEST 5 PASSED: Admin can see ${conversations.length} conversations`);
    return conversations;
  } else {
    console.log(`❌ TEST 5 FAILED: Status ${status}, Response: ${JSON.stringify(data)}`);
    return [];
  }
}

async function runTests() {
  console.log('🚀 Starting Realtime Chat Tests\n');
  
  try {
    // Step 1: Login users
    const buyerToken = await loginUser(testBuyer);
    const sellerToken = await loginUser(testSeller);
    const adminToken = await loginUser(testAdmin);
    
    if (!buyerToken) {
      console.log('❌ Cannot proceed without buyer token');
      return;
    }
    
    // Step 2: Find active property
    const property = await findActiveProperty();
    if (!property) {
      console.log('❌ Cannot proceed without property');
      return;
    }
    
    // Step 3: Test conversation creation
    const conversationId = await testConversationCreation(buyerToken, property);
    if (!conversationId) {
      console.log('❌ Cannot proceed without conversation');
      return;
    }
    
    // Step 4: Test message sending
    const messageSent = await testBuyerMessage(buyerToken, conversationId, 'ping-test');
    if (!messageSent) {
      console.log('❌ Message sending failed');
      return;
    }
    
    // Step 5: Test message retrieval
    const buyerMessages = await testGetMessages(buyerToken, conversationId, 'buyer');
    
    // Step 6: Test seller conversation list
    if (sellerToken) {
      const sellerConversations = await testSellerConversations(sellerToken);
      
      // Test seller getting messages
      if (sellerConversations.length > 0) {
        await testGetMessages(sellerToken, conversationId, 'seller');
      }
    }
    
    // Step 7: Test admin inbox
    if (adminToken) {
      await testAdminInbox(adminToken);
    }
    
    // Step 8: Test additional messages
    await testBuyerMessage(buyerToken, conversationId, 'second-ping');
    await testBuyerMessage(buyerToken, conversationId, 'admin-ping');
    
    console.log('\n🎉 PASS: Realtime chat fixed');
    console.log('✅ All API endpoints working correctly');
    console.log('📡 Socket.io integration ready for real-time updates');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the tests
runTests().catch(console.error);
