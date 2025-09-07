# WebSocket Chat Implementation

This document describes how to use the WebSocket chat functionality for your Android fitness app.

## Overview

The chat system uses Socket.IO for real-time communication between users. Messages are stored in MongoDB and include features like typing indicators, read receipts, and user presence tracking.

## Connection Setup

### 1. Connect to WebSocket Server

```javascript
// Android clients should connect to your server URL
const socket = io('http://your-server-url:5000');
```

### 2. Authenticate User

Before using any chat features, authenticate the user:

```javascript
socket.emit('chat:authenticate', {
  userId: 123,           // User's unique ID
  username: 'john_doe'   // User's display name
});

// Listen for authentication response
socket.on('chat:authenticated', (data) => {
  console.log('Authenticated successfully:', data);
});
```

## Core Chat Events

### 1. Join a Chat Room

Join a chat room with another user:

```javascript
socket.emit('chat:join', {
  userId: 123,        // Your user ID
  peerId: 456,        // Friend's user ID
  peerName: 'Jane'    // Friend's display name (optional)
});

// Listen for join confirmation
socket.on('chat:joined', (data) => {
  console.log('Joined chat room:', data.room);
});
```

### 2. Send Messages

Send a message to another user:

```javascript
socket.emit('chat:send', {
  senderId: 123,         // Your user ID
  receiverId: 456,       // Recipient's user ID
  content: 'Hello!',     // Message content
  messageType: 'text'    // Optional: 'text', 'image', 'file', 'emoji'
});

// Listen for send confirmation
socket.on('chat:message_sent', (data) => {
  console.log('Message sent:', data.messageId);
});
```

### 3. Receive Messages

Listen for incoming messages:

```javascript
socket.on('chat:message', (data) => {
  console.log('New message:', {
    messageId: data._id,
    from: data.senderName,
    content: data.content,
    timestamp: data.createdAt
  });
  
  // Update your UI with the new message
  displayMessage(data);
});
```

### 4. Typing Indicators

Show when someone is typing:

```javascript
// Start typing
socket.emit('chat:typing', {
  receiverId: 456,
  isTyping: true
});

// Stop typing
socket.emit('chat:typing', {
  receiverId: 456,
  isTyping: false
});

// Listen for typing status
socket.on('chat:typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.username);
  } else {
    hideTypingIndicator();
  }
});
```

### 5. Chat History

Retrieve previous messages:

```javascript
socket.emit('chat:get_history', {
  peerId: 456,      // Friend's user ID
  limit: 50,        // Number of messages to retrieve
  offset: 0         // Pagination offset
});

// Listen for history response
socket.on('chat:history', (data) => {
  console.log('Chat history:', data.messages);
  data.messages.forEach(message => {
    displayMessage(message);
  });
});
```

### 6. Read Receipts

Mark messages as read:

```javascript
socket.emit('chat:mark_read', {
  messageIds: ['msg_id_1', 'msg_id_2'],  // Array of message IDs
  senderId: 456                          // Original sender's ID
});

// Listen for read receipts
socket.on('chat:message_read', (data) => {
  console.log('Messages read by:', data.readBy);
  updateMessageReadStatus(data.messageIds);
});
```

## Presence Tracking

### User Online/Offline Status

```javascript
// Listen for users coming online
socket.on('chat:user_online', (data) => {
  console.log('User came online:', data.username);
  updateUserStatus(data.userId, 'online');
});

// Listen for users going offline
socket.on('chat:user_offline', (data) => {
  console.log('User went offline:', data.username);
  updateUserStatus(data.userId, 'offline');
});
```

## Error Handling

Always listen for errors:

```javascript
socket.on('chat:error', (error) => {
  console.error('Chat error:', error.message);
  // Show error to user
  showErrorMessage(error.message);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Handle connection issues
});
```

## Android Implementation Example

Here's a basic structure for Android implementation using a WebSocket library:

```java
// Pseudo-code for Android
public class ChatManager {
    private Socket socket;
    private int userId;
    private String username;
    
    public void connect(String serverUrl) {
        try {
            socket = IO.socket(serverUrl);
            setupEventHandlers();
            socket.connect();
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }
    
    private void setupEventHandlers() {
        socket.on(Socket.EVENT_CONNECT, args -> {
            authenticate();
        });
        
        socket.on("chat:message", args -> {
            JSONObject data = (JSONObject) args[0];
            // Handle incoming message
            runOnUiThread(() -> displayMessage(data));
        });
        
        socket.on("chat:error", args -> {
            JSONObject error = (JSONObject) args[0];
            // Handle error
            runOnUiThread(() -> showError(error.getString("message")));
        });
    }
    
    public void authenticate(int userId, String username) {
        this.userId = userId;
        this.username = username;
        
        JSONObject auth = new JSONObject();
        try {
            auth.put("userId", userId);
            auth.put("username", username);
            socket.emit("chat:authenticate", auth);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
    
    public void sendMessage(int receiverId, String content) {
        JSONObject message = new JSONObject();
        try {
            message.put("senderId", userId);
            message.put("receiverId", receiverId);
            message.put("content", content);
            socket.emit("chat:send", message);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
```

## Testing

You can test the chat functionality using the provided test client:

```bash
# Start your server first
npm start

# In another terminal, run the test client
cd src/test
node chat-test-client.js
```

## Security Considerations

1. **Authentication**: Always authenticate users before allowing chat operations
2. **Validation**: All input is validated on the server side
3. **Rate Limiting**: Consider implementing rate limiting for message sending
4. **Content Filtering**: Add content filtering if needed for your app
5. **User Permissions**: Ensure users can only chat with their friends/connections

## Database Schema

Messages are stored with the following structure:

```javascript
{
  _id: ObjectId,
  room: "1:2",                    // Sorted user IDs
  senderId: 1,                    // Sender's user ID
  receiverId: 2,                  // Receiver's user ID
  content: "Hello!",              // Message content
  messageType: "text",            // Message type
  isRead: false,                  // Read status
  readAt: Date,                   // When message was read
  createdAt: Date,                // When message was created
  updatedAt: Date                 // When message was updated
}
```

## Next Steps

1. Implement the Android client using Socket.IO Android library
2. Add friend system integration
3. Implement message encryption for security
4. Add file/image sharing capabilities
5. Implement push notifications for offline users
6. Add message search functionality
7. Implement chat rooms/group chats if needed
