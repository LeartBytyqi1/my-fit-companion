require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectMongo } = require('./config/mongo');
const { registerSockets } = require('./sockets');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const workoutRoutes = require('./routes/workouts');
const dietRoutes = require('./routes/diets');

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// health check
app.get('/', (_req, res) => res.send('Fitness API is running'));

// REST routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diets', dietRoutes);

// HTTP + Socket.io server
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });
registerSockets(io);

const PORT = process.env.PORT || 5000;

(async () => {
  await connectMongo(process.env.MONGO_URI);
  server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
})();