const { registerChat } = require('./chat');
const { registerWebRTC } = require('./webrtc');

function registerSockets(io) {
  io.on('connection', (socket) => {
    registerChat(io, socket);
    registerWebRTC(io, socket);
  });
}
module.exports = { registerSockets };