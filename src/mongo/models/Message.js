const { Schema, model } = require('mongoose');

const messageSchema = new Schema({
  room: { type: String, index: true }, // user-user or booking room
  senderId: { type: Number, required: true, index: true },
  receiverId: { type: Number, required: true, index: true },
  content: { type: String, required: true, maxlength: 1000 },
  messageType: { type: String, default: 'text', enum: ['text', 'image', 'file', 'emoji'] },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Index for efficient querying
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

module.exports = model('Message', messageSchema);