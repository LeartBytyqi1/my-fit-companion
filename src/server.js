require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectMongo } = require('./config/mongo');
const { registerSockets } = require('./sockets');

// Route imports
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const workoutRoutes = require('./routes/workouts');
const dietRoutes = require('./routes/diets');
const exerciseRoutes = require('./routes/exercises');
const profileRoutes = require('./routes/profile');
const progressRoutes = require('./routes/progress');
const sessionRoutes = require('./routes/sessions');
const nutritionRoutes = require('./routes/nutrition');
const goalRoutes = require('./routes/goals');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Auth route rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit auth attempts
  message: 'Too many authentication attempts, please try again later.'
});

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// health check
app.get('/', (_req, res) => res.send('Fitness API is running'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// REST routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diets', dietRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/goals', goalRoutes);

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