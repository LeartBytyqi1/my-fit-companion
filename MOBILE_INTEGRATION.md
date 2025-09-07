# Mobile App Integration Guide

## Server URLs (Update these after deployment)
```javascript
// Replace with your actual deployed URL
const SERVER_URL = 'https://your-app.railway.app'; // or .onrender.com
const API_BASE = `${SERVER_URL}/api`;
const SOCKET_URL = SERVER_URL;
```

## React Native Setup Example:

### 1. Install Dependencies
```bash
npm install socket.io-client axios @react-native-async-storage/async-storage
```

### 2. API Service (apiService.js)
```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://your-app.railway.app/api';

const apiService = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Add auth token to requests
apiService.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiService;
```

### 3. Socket Connection (socketService.js)
```javascript
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId, username) {
    this.socket = io('https://your-app.railway.app', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.authenticate(userId, username);
    });
  }

  authenticate(userId, username) {
    this.socket.emit('chat:authenticate', { userId, username });
  }

  // Add other socket methods...
}

export default new SocketService();
```

## Testing Endpoints:
- Health: GET https://your-app.railway.app/
- Auth: POST https://your-app.railway.app/api/auth/login
- Chat: Socket connection to https://your-app.railway.app
