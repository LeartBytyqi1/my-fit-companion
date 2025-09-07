// Test script for deployed server
const axios = require('axios');

const SERVER_URL = 'https://your-deployed-url.railway.app'; // Update this

async function testDeployedServer() {
  console.log('🚀 Testing deployed server...');
  console.log('Server URL:', SERVER_URL);
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(SERVER_URL);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test 2: Register user
    console.log('\n2. Testing user registration...');
    const registerData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    };
    
    const registerResponse = await axios.post(`${SERVER_URL}/api/auth/register`, registerData);
    console.log('✅ Registration:', registerResponse.data);
    
    // Test 3: Login
    console.log('\n3. Testing user login...');
    const loginResponse = await axios.post(`${SERVER_URL}/api/auth/login`, {
      email: registerData.email,
      password: registerData.password
    });
    console.log('✅ Login successful, token received');
    
    console.log('\n🎉 All tests passed! Server is ready for mobile app integration.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Update the SERVER_URL above and run: node test-deployment.js
testDeployedServer();
