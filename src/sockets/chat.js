const Message = require('../mongo/models/Message');

// Store connected users and their socket IDs for presence tracking
const connectedUsers = new Map();

// Simple room name convention to keep messages grouped
const roomId = (a, b) => [a, b].sort().join(':');

function registerChat(io, socket) {
  console.log('New socket connected:', socket.id);

  // Handle user authentication/identification
  socket.on('chat:authenticate', ({ userId, username }) => {
    try {
      if (!userId) {
        socket.emit('chat:error', { message: 'User ID is required' });
        return;
      }

      // Store user info with socket
      socket.userId = userId;
      socket.username = username;
      
      // Track connected users
      connectedUsers.set(userId, {
        socketId: socket.id,
        username: username,
        lastSeen: new Date()
      });

      socket.emit('chat:authenticated', { 
        userId, 
        username,
        message: 'Successfully authenticated' 
      });

      // Broadcast user online status to friends (you can implement friend logic later)
      socket.broadcast.emit('chat:user_online', { userId, username });

      console.log(`User ${username} (${userId}) authenticated with socket ${socket.id}`);
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('chat:error', { message: 'Authentication failed' });
    }
  });

  // Join a chat room with a specific user
  socket.on('chat:join', ({ userId, peerId, peerName }) => {
    try {
      if (!socket.userId) {
        socket.emit('chat:error', { message: 'Please authenticate first' });
        return;
      }

      if (!userId || !peerId) {
        socket.emit('chat:error', { message: 'Both user IDs are required' });
        return;
      }

      const room = roomId(userId, peerId);
      socket.join(room);
      
      socket.emit('chat:joined', { 
        room,
        userId,
        peerId,
        peerName,
        message: `Joined chat with ${peerName || peerId}`
      });

      // Notify the other user if they're online
      const peerConnection = connectedUsers.get(peerId);
      if (peerConnection) {
        socket.to(peerConnection.socketId).emit('chat:peer_joined', {
          room,
          userId,
          username: socket.username,
          message: `${socket.username} joined the chat`
        });
      }

      console.log(`User ${socket.userId} joined room: ${room}`);
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('chat:error', { message: 'Failed to join chat room' });
    }
  });

  // Send a message
  socket.on('chat:send', async ({ senderId, receiverId, content, messageType = 'text' }) => {
    try {
      // Validate input
      if (!socket.userId) {
        socket.emit('chat:error', { message: 'Please authenticate first' });
        return;
      }

      if (!senderId || !receiverId || !content) {
        socket.emit('chat:error', { message: 'Sender ID, receiver ID, and content are required' });
        return;
      }

      if (senderId !== socket.userId) {
        socket.emit('chat:error', { message: 'Sender ID must match authenticated user' });
        return;
      }

      if (content.trim().length === 0) {
        socket.emit('chat:error', { message: 'Message content cannot be empty' });
        return;
      }

      if (content.length > 1000) {
        socket.emit('chat:error', { message: 'Message too long (max 1000 characters)' });
        return;
      }

      const room = roomId(senderId, receiverId);
      
      // Save message to database
      const msg = await Message.create({ 
        room, 
        senderId, 
        receiverId, 
        content: content.trim(),
        messageType 
      });

      const messageData = {
        _id: msg._id,
        room,
        senderId,
        receiverId,
        content: msg.content,
        messageType,
        createdAt: msg.createdAt,
        senderName: socket.username
      };

      // Send to all users in the room
      io.to(room).emit('chat:message', messageData);

      // Send delivery confirmation to sender
      socket.emit('chat:message_sent', {
        messageId: msg._id,
        room,
        timestamp: msg.createdAt
      });

      console.log(`Message sent in room ${room}: ${content.substring(0, 50)}...`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('chat:error', { 
        message: 'Failed to send message',
        details: error.message 
      });
    }
  });

  // Handle typing indicators
  socket.on('chat:typing', ({ receiverId, isTyping }) => {
    try {
      if (!socket.userId || !receiverId) return;

      const room = roomId(socket.userId, receiverId);
      
      socket.to(room).emit('chat:typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping
      });
    } catch (error) {
      console.error('Typing indicator error:', error);
    }
  });

  // Mark messages as read
  socket.on('chat:mark_read', async ({ messageIds, senderId }) => {
    try {
      if (!socket.userId || !messageIds || !Array.isArray(messageIds)) {
        socket.emit('chat:error', { message: 'Invalid read receipt data' });
        return;
      }

      // Here you could update message read status in database if needed
      // For now, just emit read receipt
      const room = roomId(socket.userId, senderId);
      
      socket.to(room).emit('chat:message_read', {
        messageIds,
        readBy: socket.userId,
        readAt: new Date()
      });

      socket.emit('chat:read_receipt', {
        messageIds,
        status: 'confirmed'
      });
    } catch (error) {
      console.error('Mark read error:', error);
      socket.emit('chat:error', { message: 'Failed to mark messages as read' });
    }
  });

  // Get chat history
  socket.on('chat:get_history', async ({ peerId, limit = 50, offset = 0 }) => {
    try {
      if (!socket.userId || !peerId) {
        socket.emit('chat:error', { message: 'User ID and peer ID are required' });
        return;
      }

      const room = roomId(socket.userId, peerId);
      
      const messages = await Message.find({ room })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      socket.emit('chat:history', {
        room,
        messages: messages.reverse(), // Return in chronological order
        hasMore: messages.length === parseInt(limit)
      });
    } catch (error) {
      console.error('Get history error:', error);
      socket.emit('chat:error', { message: 'Failed to retrieve chat history' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    try {
      if (socket.userId) {
        // Remove from connected users
        connectedUsers.delete(socket.userId);
        
        // Broadcast user offline status
        socket.broadcast.emit('chat:user_offline', { 
          userId: socket.userId,
          username: socket.username,
          lastSeen: new Date()
        });

        console.log(`User ${socket.username} (${socket.userId}) disconnected: ${reason}`);
      } else {
        console.log(`Unauthenticated socket ${socket.id} disconnected: ${reason}`);
      }
    } catch (error) {
      console.error('Disconnect handler error:', error);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('chat:error', { message: 'Connection error occurred' });
  });
}

// Helper function to get online users (you can expose this if needed)
function getOnlineUsers() {
  return Array.from(connectedUsers.values());
}

// Helper function to check if user is online
function isUserOnline(userId) {
  return connectedUsers.has(userId);
}

module.exports = { 
  registerChat, 
  getOnlineUsers, 
  isUserOnline 
};