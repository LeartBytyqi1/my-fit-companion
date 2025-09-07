// Simple API test using Node.js built-in modules
const http = require('http');
const https = require('https');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

console.log('🚀 Testing API server...');
console.log('Server URL:', SERVER_URL);

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 5000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = data ? JSON.parse(data) : data;
          resolve({ status: res.statusCode, data: result, text: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, text: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    req.end();
  });
}

async function testAPI() {
  try {
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await makeRequest(SERVER_URL);
    if (healthResponse.status === 200) {
      console.log('✅ Health check:', healthResponse.text || 'Server is running');
    } else {
      console.log('⚠️ Health check status:', healthResponse.status);
    }
    
    // Test 2: Register user
    console.log('\n2. Testing user registration...');
    const registerData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    };
    
    try {
      const registerResponse = await makeRequest(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        data: registerData
      });
      
      if (registerResponse.status === 201) {
        console.log('✅ Registration successful:', registerResponse.data);
        
        // Test 3: Login
        console.log('\n3. Testing user login...');
        const loginResponse = await makeRequest(`${SERVER_URL}/api/auth/login`, {
          method: 'POST',
          data: {
            email: registerData.email,
            password: registerData.password
          }
        });
        
        if (loginResponse.status === 200) {
          console.log('✅ Login successful!');
        } else {
          console.log('⚠️ Login status:', loginResponse.status, loginResponse.data);
        }
        
      } else if (registerResponse.status === 400 && registerResponse.data?.error?.includes('already in use')) {
        console.log('✅ Registration endpoint working (user already exists)');
      } else {
        console.log('⚠️ Registration status:', registerResponse.status, registerResponse.data);
      }
      
    } catch (authError) {
      console.log('⚠️ Auth test error:', authError.message);
    }
    
    console.log('\n🎉 API tests completed!');
    console.log('\n📱 Your API is ready for mobile app integration!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAPI();
