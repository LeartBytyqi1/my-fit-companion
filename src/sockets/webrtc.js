function registerWebRTC(io, socket) {
  socket.on('webrtc:join', ({ room }) => socket.join(room));
  socket.on('webrtc:offer', ({ room, sdp, from }) => socket.to(room).emit('webrtc:offer', { sdp, from }));
  socket.on('webrtc:answer', ({ room, sdp, from }) => socket.to(room).emit('webrtc:answer', { sdp, from }));
  socket.on('webrtc:ice', ({ room, candidate, from }) => socket.to(room).emit('webrtc:ice', { candidate, from }));
}
module.exports = { registerWebRTC };