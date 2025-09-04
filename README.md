# My Fit Companion Backend

A comprehensive fitness tracking backend API built with Node.js, Express, Prisma, and MongoDB for Android clients.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (USER, COACH, ADMIN)
- Secure password hashing with bcrypt

### 👤 User Management
- User profiles with fitness metrics
- Progress tracking (weight, body fat, muscle mass)
- Goal setting and tracking
- Profile image support

### 💪 Workout System
- Exercise library with detailed instructions
- Custom workout creation
- Workout session tracking
- Progress monitoring

### 🥗 Nutrition Tracking
- Food database with nutritional information
- Diet plan creation
- Meal tracking and logging
- Calorie and macro tracking

### 📱 Social Features
- Posts with images and comments
- Like system
- Real-time chat
- WebRTC video calls (coach-client)

### 📊 Analytics & Insights
- Progress statistics
- Workout analytics
- Nutrition insights
- Goal achievement tracking

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT
- **Database**: SQLite (Prisma) + MongoDB (Mongoose)
- **Real-time**: Socket.io
- **Password Hashing**: bcrypt

## API Endpoints

### Authentication
```
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
```

### User Profile
```
GET  /api/profile          # Get current user profile
PUT  /api/profile          # Update user profile
```

### Exercises
```
GET  /api/exercises        # Get all exercises (with filters)
GET  /api/exercises/:id    # Get exercise by ID
POST /api/exercises        # Create exercise (coach/admin)
PUT  /api/exercises/:id    # Update exercise
DELETE /api/exercises/:id  # Delete exercise
```

### Workouts
```
GET  /api/workouts         # Get all workouts
POST /api/workouts         # Create workout (coach/admin)
```

### Diets
```
GET  /api/diets            # Get all diet plans
POST /api/diets            # Create diet plan (coach/admin)
```

### Progress Tracking
```
GET  /api/progress         # Get user progress entries
POST /api/progress         # Add progress entry
GET  /api/progress/stats   # Get progress statistics
```

### Social Features
```
GET  /api/posts            # Get posts feed
POST /api/posts            # Create post
POST /api/posts/:id/like   # Like/unlike post
POST /api/posts/:id/comment # Comment on post
```

## Setup Instructions

1. **Clone and Install**
```bash
git clone <repository-url>
cd my-fit-companion
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npm run migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

4. **Start Development Server**
```bash
npm run dev
```

## Database Schema

### User Model (Prisma/SQLite)
- Basic user info (email, password, name)
- Physical metrics (height, weight, body fat)
- Fitness goals and preferences
- Role-based permissions

### Exercise & Workout Models
- Exercise library with instructions
- Workout plans with exercise combinations
- Session tracking and completion

### Nutrition Models
- Food database with nutritional info
- Diet plans and meal planning
- Daily nutrition tracking

### Progress & Goals
- Weight and body composition tracking
- Goal setting and achievement
- Progress photos and notes

### Social Models (MongoDB)
- Posts with media support
- Comments and likes system
- Real-time messaging

## Android Integration Considerations

### API Design
- RESTful endpoints optimized for mobile
- JSON responses with consistent structure
- Proper HTTP status codes
- Pagination for large datasets

### Authentication
- JWT tokens for stateless auth
- Token refresh mechanism
- Secure password requirements

### File Uploads
- Image upload for progress photos
- Profile picture support
- Exercise demonstration videos

### Push Notifications
- Workout reminders
- Goal achievements
- Social interactions
- Coach messages

### Offline Support
- Cache workout data
- Sync progress when online
- Conflict resolution strategies

## Recommended Additions

### 1. File Upload Service
```javascript
// Add multer for file uploads
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
```

### 2. Push Notifications
```javascript
// Add Firebase Cloud Messaging
const admin = require('firebase-admin');
```

### 3. Email Service
```javascript
// Add nodemailer for email notifications
const nodemailer = require('nodemailer');
```

### 4. Data Validation
```javascript
// Add joi or express-validator
const joi = require('joi');
```

### 5. Rate Limiting
```javascript
// Add express-rate-limit
const rateLimit = require('express-rate-limit');
```

### 6. API Documentation
```javascript
// Add swagger for API docs
const swaggerUi = require('swagger-ui-express');
```

### 7. Monitoring & Logging
```javascript
// Add winston for logging
const winston = require('winston');
```

## Deployment Considerations

### Database
- Migrate from SQLite to PostgreSQL/MySQL for production
- Set up MongoDB Atlas for social features
- Implement proper database backups

### Security
- Environment variable management
- CORS configuration
- API rate limiting
- Input validation and sanitization

### Performance
- Database indexing
- Query optimization
- Caching strategies (Redis)
- CDN for file storage

### Monitoring
- Error tracking (Sentry)
- Performance monitoring
- API analytics
- Health checks

## Mobile App Integration Tips

### Network Handling
- Implement retry logic for failed requests
- Handle network connectivity changes
- Optimize for slow connections

### Data Synchronization
- Implement local caching
- Background sync for offline changes
- Conflict resolution for concurrent edits

### User Experience
- Loading states and progress indicators
- Optimistic UI updates
- Proper error handling and user feedback

### Security
- Certificate pinning
- API key management
- Secure storage for tokens

This backend provides a solid foundation for a comprehensive fitness app with room for growth and feature expansion.
