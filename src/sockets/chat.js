const Message = require('../mongo/models/Message');

// simple room name convention to keep messages grouped
const roomId = (a, b) => [a, b].sort().join(':');

function registerChat(io, socket) {
  socket.on('chat:join', ({ userId, peerId }) => {
    const room = roomId(userId, peerId);
    socket.join(room);
    socket.emit('chat:joined', { room });
  });

  socket.on('chat:send', async ({ room, senderId, receiverId, content }) => {
    const msg = await Message.create({ room, senderId, receiverId, content });
    io.to(room).emit('chat:message', {
      _id: msg._id, room, senderId, receiverId, content, createdAt: msg.createdAt
    });
  });
}

module.exports = { registerChat };