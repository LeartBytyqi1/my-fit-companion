const io = require('socket.io-client');

// Test WebSocket chat functionality
class ChatTestClient {
  constructor(serverUrl = 'http://localhost:5000', userId, username) {
    this.socket = io(serverUrl);
    this.userId = userId;
    this.username = username;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      console.log(`[${this.username}] Connected to server`);
      this.authenticate();
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[${this.username}] Disconnected:`, reason);
    });

    // Chat events
    this.socket.on('chat:authenticated', (data) => {
      console.log(`[${this.username}] Authenticated:`, data);
    });

    this.socket.on('chat:joined', (data) => {
      console.log(`[${this.username}] Joined room:`, data);
    });

    this.socket.on('chat:message', (data) => {
      console.log(`[${this.username}] Received message:`, {
        from: data.senderName || data.senderId,
        content: data.content,
        time: new Date(data.createdAt).toLocaleTimeString()
      });
    });

    this.socket.on('chat:message_sent', (data) => {
      console.log(`[${this.username}] Message sent confirmation:`, data.messageId);
    });

    this.socket.on('chat:typing', (data) => {
      if (data.isTyping) {
        console.log(`[${this.username}] ${data.username} is typing...`);
      } else {
        console.log(`[${this.username}] ${data.username} stopped typing`);
      }
    });

    this.socket.on('chat:history', (data) => {
      console.log(`[${this.username}] Chat history received:`, {
        room: data.room,
        messageCount: data.messages.length,
        hasMore: data.hasMore
      });
      data.messages.forEach(msg => {
        console.log(`  ${new Date(msg.createdAt).toLocaleTimeString()} - ${msg.senderId}: ${msg.content}`);
      });
    });

    this.socket.on('chat:user_online', (data) => {
      console.log(`[${this.username}] User came online:`, data.username);
    });

    this.socket.on('chat:user_offline', (data) => {
      console.log(`[${this.username}] User went offline:`, data.username);
    });

    this.socket.on('chat:error', (data) => {
      console.error(`[${this.username}] Chat error:`, data);
    });
  }

  authenticate() {
    this.socket.emit('chat:authenticate', {
      userId: this.userId,
      username: this.username
    });
  }

  joinChat(peerId, peerName) {
    this.socket.emit('chat:join', {
      userId: this.userId,
      peerId: peerId,
      peerName: peerName
    });
  }

  sendMessage(receiverId, content, messageType = 'text') {
    this.socket.emit('chat:send', {
      senderId: this.userId,
      receiverId: receiverId,
      content: content,
      messageType: messageType
    });
  }

  setTyping(receiverId, isTyping) {
    this.socket.emit('chat:typing', {
      receiverId: receiverId,
      isTyping: isTyping
    });
  }

  getChatHistory(peerId, limit = 50, offset = 0) {
    this.socket.emit('chat:get_history', {
      peerId: peerId,
      limit: limit,
      offset: offset
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}

// Example usage - Test with two clients
if (require.main === module) {
  console.log('Starting chat test clients...\n');

  // Create two test clients
  const client1 = new ChatTestClient('http://localhost:5000', 1, 'Alice');
  const client2 = new ChatTestClient('http://localhost:5000', 2, 'Bob');

  // Wait a bit then test the chat functionality
  setTimeout(() => {
    console.log('\n--- Testing chat functionality ---\n');
    
    // Join chat rooms
    client1.joinChat(2, 'Bob');
    client2.joinChat(1, 'Alice');

    // Send some test messages
    setTimeout(() => {
      client1.sendMessage(2, 'Hello Bob! How are you?');
    }, 1000);

    setTimeout(() => {
      client2.setTyping(1, true);
      setTimeout(() => {
        client2.setTyping(1, false);
        client2.sendMessage(1, 'Hi Alice! I\'m doing great, thanks for asking!');
      }, 2000);
    }, 2000);

    setTimeout(() => {
      client1.sendMessage(2, 'That\'s awesome! Want to work out together later?');
    }, 5000);

    // Get chat history
    setTimeout(() => {
      console.log('\n--- Getting chat history ---\n');
      client1.getChatHistory(2);
    }, 6000);

    // Cleanup after 10 seconds
    setTimeout(() => {
      console.log('\n--- Test completed, disconnecting ---\n');
      client1.disconnect();
      client2.disconnect();
      process.exit(0);
    }, 10000);

  }, 2000);
}

module.exports = ChatTestClient;
