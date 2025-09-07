// Simple WebSocket test
const io = require('socket.io-client');

console.log('Connecting to WebSocket server...');

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Connected to server!');
  
  // Test authentication
  socket.emit('chat:authenticate', {
    userId: 1,
    username: 'TestUser'
  });
});

socket.on('chat:authenticated', (data) => {
  console.log('✅ Authentication successful:', data);
  
  // Test joining a chat
  socket.emit('chat:join', {
    userId: 1,
    peerId: 2,
    peerName: 'Friend'
  });
});

socket.on('chat:joined', (data) => {
  console.log('✅ Successfully joined chat room:', data);
  
  // Test sending a message
  socket.emit('chat:send', {
    senderId: 1,
    receiverId: 2,
    content: 'Hello! This is a test message from the WebSocket client.'
  });
});

socket.on('chat:message', (data) => {
  console.log('✅ Message received:', {
    from: data.senderName,
    content: data.content,
    time: new Date(data.createdAt).toLocaleTimeString()
  });
  
  console.log('\n🎉 WebSocket chat is working perfectly!');
  
  // Disconnect after successful test
  setTimeout(() => {
    socket.disconnect();
    console.log('✅ Test completed successfully');
    process.exit(0);
  }, 1000);
});

socket.on('chat:error', (error) => {
  console.error('❌ Chat error:', error);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('Test timeout reached');
  process.exit(0);
}, 10000);
