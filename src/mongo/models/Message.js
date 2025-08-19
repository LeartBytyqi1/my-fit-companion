const { Schema, model } = require('mongoose');

const messageSchema = new Schema({
  room: { type: String, index: true }, // user-user or booking room
  senderId: { type: Number, required: true },
  receiverId: { type: Number, required: true },
  content: { type: String, required: true }
}, { timestamps: true });

module.exports = model('Message', messageSchema);