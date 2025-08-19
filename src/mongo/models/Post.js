const { Schema, model } = require('mongoose');

const commentSchema = new Schema({
  userId: { type: Number, required: true }, // Prisma User.id
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const postSchema = new Schema({
  authorId: { type: Number, required: true },
  content: { type: String, required: true },
  images: [String],
  likes: [Number], // store User.id who liked
  comments: [commentSchema]
}, { timestamps: true });

module.exports = model('Post', postSchema);