const mongoose = require('mongoose');

async function connectMongo(uri) {
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
module.exports = { connectMongo };