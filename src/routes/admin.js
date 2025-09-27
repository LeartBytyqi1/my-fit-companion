const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// GET /admin/users - Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        heightCm: true,
        weightKg: true,
        bodyFatPct: true,
        goalWeightKg: true,
        goalBodyFatPct: true,
        age: true,
        gender: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password field for security
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the response to match Android expectations
    const userResponse = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      bodyFatPct: user.bodyFatPct,
      goalWeightKg: user.goalWeightKg,
      goalBodyFatPct: user.goalBodyFatPct,
      age: user.age,
      gender: user.gender,
      profileImage: user.profileImage,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }));

    res.json(userResponse);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



// PUT /admin/users/:id - Update user
router.put("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { firstName, lastName, email, role } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['USER', 'TRAINER', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: "Invalid role. Must be one of: USER, TRAINER, ADMIN" 
        });
      }
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });
      if (emailTaken) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Build update data object (only include fields that were provided)
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;



    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        heightCm: true,
        weightKg: true,
        bodyFatPct: true,
        goalWeightKg: true,
        goalBodyFatPct: true,
        age: true,
        gender: true,
        
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Transform response
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      heightCm: updatedUser.heightCm,
      weightKg: updatedUser.weightKg,
      bodyFatPct: updatedUser.bodyFatPct,
      goalWeightKg: updatedUser.goalWeightKg,
      goalBodyFatPct: updatedUser.goalBodyFatPct,
      age: updatedUser.age,
      gender: updatedUser.gender,
      
      profileImage: updatedUser.profileImage,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString()
    };

    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/users/:id - Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== MEALS ENDPOINTS =====

// POST /admin/meals - Create new meal
router.post("/meals", async (req, res) => {
  try {
    const { name, calories, description } = req.body;

    // Validate required fields
    if (!name || calories === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields: name, calories" 
      });
    }

    // Validate calories is a number
    if (typeof calories !== 'number' || calories < 0) {
      return res.status(400).json({ 
        error: "Calories must be a positive number" 
      });
    }

    // Create meal
    const newMeal = await prisma.meal.create({
      data: {
        name,
        calories,
        description: description || null
      }
    });

    res.status(201).json({
      id: newMeal.id,
      name: newMeal.name,
      calories: newMeal.calories,
      description: newMeal.description
    });
  } catch (error) {
    console.error("Error creating meal:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/meals - Get all meals
router.get("/meals", async (req, res) => {
  try {
    const meals = await prisma.meal.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const mealsResponse = meals.map(meal => ({
      id: meal.id,
      name: meal.name,
      calories: meal.calories,
      description: meal.description
    }));

    res.json(mealsResponse);
  } catch (error) {
    console.error("Error fetching meals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/meals/:id - Update meal
router.put("/meals/:id", async (req, res) => {
  try {
    const mealId = parseInt(req.params.id);
    const { name, calories, description } = req.body;

    if (isNaN(mealId)) {
      return res.status(400).json({ error: "Invalid meal ID" });
    }

    // Check if meal exists
    const existingMeal = await prisma.meal.findUnique({
      where: { id: mealId }
    });

    if (!existingMeal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    // Validate calories if provided
    if (calories !== undefined && (typeof calories !== 'number' || calories < 0)) {
      return res.status(400).json({ 
        error: "Calories must be a positive number" 
      });
    }

    // Build update data object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (calories !== undefined) updateData.calories = calories;
    if (description !== undefined) updateData.description = description;

    // Update meal
    const updatedMeal = await prisma.meal.update({
      where: { id: mealId },
      data: updateData
    });

    res.json({
      id: updatedMeal.id,
      name: updatedMeal.name,
      calories: updatedMeal.calories,
      description: updatedMeal.description
    });
  } catch (error) {
    console.error("Error updating meal:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/meals/:id - Delete meal
router.delete("/meals/:id", async (req, res) => {
  try {
    const mealId = parseInt(req.params.id);

    if (isNaN(mealId)) {
      return res.status(400).json({ error: "Invalid meal ID" });
    }

    // Check if meal exists
    const existingMeal = await prisma.meal.findUnique({
      where: { id: mealId }
    });

    if (!existingMeal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    // Delete meal
    await prisma.meal.delete({
      where: { id: mealId }
    });

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error("Error deleting meal:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== SESSIONS ENDPOINTS =====

// POST /admin/sessions - Create new session
router.post("/sessions", async (req, res) => {
  try {
    const { name, date, duration, userId, imageUrl } = req.body;

    // Validate required fields
    if (!name || !date || !duration || !userId) {
      return res.status(400).json({ 
        error: "Missing required fields: name, date, duration, userId" 
      });
    }

    // Validate userId exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Convert date from millis to Date object
    const sessionDate = new Date(date);
    if (isNaN(sessionDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    console.log('Creating session with date:', sessionDate.toISOString());

    // Create session
    const newSession = await prisma.workoutSession.create({
      data: {
        name,
        userId,
        startTime: sessionDate,
        duration,
        imageUrl: imageUrl || null,
        completed: false
      },
      select: {
        id: true,
        name: true,
        startTime: true,
        duration: true,
        userId: true,
        imageUrl: true
      }
    });

    console.log('Created session:', {
      id: newSession.id,
      startTime: newSession.startTime,
      startTimeISO: newSession.startTime ? newSession.startTime.toISOString() : 'NULL'
    });

    const response = {
      id: newSession.id,
      name: newSession.name,
      date: newSession.startTime ? newSession.startTime.toISOString() : new Date().toISOString(),
      duration: newSession.duration,
      userId: newSession.userId,
      imageUrl: newSession.imageUrl
    };

    console.log('Sending response:', response);
    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/sessions - Get all sessions
router.get("/sessions", async (req, res) => {
  try {
    console.log('Fetching all sessions...');
    
    const sessions = await prisma.workoutSession.findMany({
      select: {
        id: true,
        name: true,
        startTime: true,
        duration: true,
        userId: true,
        imageUrl: true
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    console.log(`Found ${sessions.length} sessions from database`);
    
    const sessionsResponse = sessions.map(session => {
      const response = {
        id: session.id,
        name: session.name,
        date: session.startTime ? session.startTime.toISOString() : new Date().toISOString(),
        duration: session.duration,
        userId: session.userId,
        imageUrl: session.imageUrl
      };
      
      console.log(`Session ${session.id}: startTime=${session.startTime?.toISOString() || 'NULL'}, mapped date=${response.date}`);
      return response;
    });

    console.log('Sending sessions response with date fields');
    res.json(sessionsResponse);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/sessions/:id - Get single session
router.get("/sessions/:id", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }

    console.log(`Fetching session ${sessionId}...`);
    
    const session = await prisma.workoutSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        name: true,
        startTime: true,
        duration: true,
        userId: true,
        imageUrl: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    console.log(`Found session ${sessionId}: startTime=${session.startTime?.toISOString() || 'NULL'}`);

    const response = {
      id: session.id,
      name: session.name,
      date: session.startTime ? session.startTime.toISOString() : new Date().toISOString(),
      duration: session.duration,
      userId: session.userId,
      imageUrl: session.imageUrl
    };

    console.log(`Sending single session response: date=${response.date}`);
    res.json(response);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/sessions/:id - Update session
router.put("/sessions/:id", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { name, date, duration, userId, imageUrl } = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }

    // Check if session exists
    const existingSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Validate userId if provided
    if (userId !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
    }

    // Build update data object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (userId !== undefined) updateData.userId = userId;
    if (duration !== undefined) updateData.duration = duration;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    
    if (date !== undefined) {
      const sessionDate = new Date(date);
      if (isNaN(sessionDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      console.log('Updating session with date:', sessionDate.toISOString());
      updateData.startTime = sessionDate;
    }

    // Update session
    const updatedSession = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: updateData,
      select: {
        id: true,
        name: true,
        startTime: true,
        duration: true,
        userId: true,
        imageUrl: true
      }
    });

    console.log('Updated session:', {
      id: updatedSession.id,
      startTime: updatedSession.startTime,
      startTimeISO: updatedSession.startTime ? updatedSession.startTime.toISOString() : 'NULL'
    });

    const response = {
      id: updatedSession.id,
      name: updatedSession.name,
      date: updatedSession.startTime ? updatedSession.startTime.toISOString() : new Date().toISOString(),
      duration: updatedSession.duration,
      userId: updatedSession.userId,
      imageUrl: updatedSession.imageUrl
    };

    console.log('Sending update response:', response);
    res.json(response);
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/sessions/:id - Delete session
router.delete("/sessions/:id", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }

    // Check if session exists
    const existingSession = await prisma.workoutSession.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Delete session
    await prisma.workoutSession.delete({
      where: { id: sessionId }
    });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== EXERCISES ENDPOINTS =====

// POST /admin/exercises - Create new exercise
router.post("/exercises", async (req, res) => {
  try {
    const { name, type, duration, caloriesBurned } = req.body;

    // Validate required fields
    if (!name || !type || duration === undefined || caloriesBurned === undefined) {
      return res.status(400).json({ 
        error: "Missing required fields: name, type, duration, caloriesBurned" 
      });
    }

    // Validate numeric fields
    if (typeof duration !== 'number' || duration <= 0) {
      return res.status(400).json({ 
        error: "Duration must be a positive number (in minutes)" 
      });
    }

    if (typeof caloriesBurned !== 'number' || caloriesBurned < 0) {
      return res.status(400).json({ 
        error: "Calories burned must be a non-negative number" 
      });
    }

    // We need a createdById field - use the admin user's ID
    const adminUser = req.user; // from auth middleware

    // Create exercise
    const newExercise = await prisma.exercise.create({
      data: {
        name,
        type,
        duration,
        caloriesBurned,
        muscleGroup: type, // Use type as muscle group for simplicity
        createdById: adminUser.id
      }
    });

    res.status(201).json({
      id: newExercise.id,
      name: newExercise.name,
      type: newExercise.type,
      duration: newExercise.duration,
      caloriesBurned: newExercise.caloriesBurned
    });
  } catch (error) {
    console.error("Error creating exercise:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/exercises - Get all exercises
router.get("/exercises", async (req, res) => {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const exercisesResponse = exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      type: exercise.type,
      duration: exercise.duration,
      caloriesBurned: exercise.caloriesBurned
    }));

    res.json(exercisesResponse);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/exercises/:id - Update exercise
router.put("/exercises/:id", async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.id);
    const { name, type, duration, caloriesBurned } = req.body;

    if (isNaN(exerciseId)) {
      return res.status(400).json({ error: "Invalid exercise ID" });
    }

    // Check if exercise exists
    const existingExercise = await prisma.exercise.findUnique({
      where: { id: exerciseId }
    });

    if (!existingExercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    // Validate numeric fields if provided
    if (duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
      return res.status(400).json({ 
        error: "Duration must be a positive number (in minutes)" 
      });
    }

    if (caloriesBurned !== undefined && (typeof caloriesBurned !== 'number' || caloriesBurned < 0)) {
      return res.status(400).json({ 
        error: "Calories burned must be a non-negative number" 
      });
    }

    // Build update data object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) {
      updateData.type = type;
      updateData.muscleGroup = type; // Update muscle group as well
    }
    if (duration !== undefined) updateData.duration = duration;
    if (caloriesBurned !== undefined) updateData.caloriesBurned = caloriesBurned;

    // Update exercise
    const updatedExercise = await prisma.exercise.update({
      where: { id: exerciseId },
      data: updateData
    });

    res.json({
      id: updatedExercise.id,
      name: updatedExercise.name,
      type: updatedExercise.type,
      duration: updatedExercise.duration,
      caloriesBurned: updatedExercise.caloriesBurned
    });
  } catch (error) {
    console.error("Error updating exercise:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/exercises/:id - Delete exercise
router.delete("/exercises/:id", async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.id);

    if (isNaN(exerciseId)) {
      return res.status(400).json({ error: "Invalid exercise ID" });
    }

    // Check if exercise exists
    const existingExercise = await prisma.exercise.findUnique({
      where: { id: exerciseId }
    });

    if (!existingExercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    // Delete exercise
    await prisma.exercise.delete({
      where: { id: exerciseId }
    });

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== TRAINERS ENDPOINTS =====

// GET /admin/trainers - Get all trainers
router.get("/trainers", async (req, res) => {
  try {
    const trainers = await prisma.user.findMany({
      where: { 
        role: 'TRAINER' 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialization: true,
        contactInfo: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const trainersResponse = trainers.map(trainer => ({
      trainerId: trainer.id, // Use id as trainerId for mobile app compatibility
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      specialization: trainer.specialization,
      contactInfo: trainer.contactInfo
    }));

    res.json(trainersResponse);
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/trainers - Create new trainer (creates user with TRAINER role)
router.post("/trainers", async (req, res) => {
  try {
    const { firstName, lastName, email, password, specialization, contactInfo } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        error: "Missing required fields: firstName, lastName, email, password" 
      });
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create trainer user
    const newTrainer = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`, // Keep name field for backward compatibility
        email,
        password: hashedPassword,
        role: 'TRAINER',
        specialization: specialization || null,
        contactInfo: contactInfo || null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        specialization: true,
        contactInfo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      trainerId: newTrainer.id, // Use id as trainerId for mobile app compatibility
      firstName: newTrainer.firstName,
      lastName: newTrainer.lastName,
      email: newTrainer.email,
      specialization: newTrainer.specialization,
      contactInfo: newTrainer.contactInfo
    });
  } catch (error) {
    console.error("Error creating trainer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/trainers/:id - Update trainer
router.put("/trainers/:id", async (req, res) => {
  try {
    const trainerId = parseInt(req.params.id);
    const { firstName, lastName, email, specialization, contactInfo } = req.body;

    if (isNaN(trainerId)) {
      return res.status(400).json({ error: "Invalid trainer ID" });
    }

    // Check if trainer exists (user with TRAINER role)
    const existingTrainer = await prisma.user.findFirst({
      where: { 
        id: trainerId,
        role: 'TRAINER'
      }
    });

    if (!existingTrainer) {
      return res.status(404).json({ error: "Trainer not found" });
    }

    // Check if email is already taken by another user
    if (email && email !== existingTrainer.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });
      if (emailTaken) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Build update data object (only include fields that were provided)
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;



    // Update trainer
    const updatedTrainer = await prisma.user.update({
      where: { id: trainerId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        specialization: true,
        contactInfo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      trainerId: updatedTrainer.id, // Use id as trainerId for mobile app compatibility
      firstName: updatedTrainer.firstName,
      lastName: updatedTrainer.lastName,
      email: updatedTrainer.email,
      specialization: updatedTrainer.specialization,
      contactInfo: updatedTrainer.contactInfo
    });
  } catch (error) {
    console.error("Error updating trainer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/trainers/:id - Delete trainer
router.delete("/trainers/:id", async (req, res) => {
  try {
    const trainerId = parseInt(req.params.id);

    if (isNaN(trainerId)) {
      return res.status(400).json({ error: "Invalid trainer ID" });
    }

    // Check if trainer exists (user with TRAINER role)
    const existingTrainer = await prisma.user.findFirst({
      where: { 
        id: trainerId,
        role: 'TRAINER'
      }
    });

    if (!existingTrainer) {
      return res.status(404).json({ error: "Trainer not found" });
    }

    // Prevent admin from deleting themselves if they happen to be a trainer too
    if (trainerId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Delete trainer (this will be a user deletion)
    await prisma.user.delete({
      where: { id: trainerId }
    });

    res.json({ message: 'Trainer deleted successfully' });
  } catch (error) {
    console.error("Error deleting trainer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// WORKOUT ADMIN ROUTES

// Create a workout
router.post('/workouts', async (req, res) => {
  try {
    console.log('=== CREATE WORKOUT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { name, description, imageUrl } = req.body;
    if (!name) {
      console.log('ERROR: Name is missing');
      return res.status(400).json({ error: 'Name is required' });
    }
    
    console.log('Creating workout with data:', {
      title: name,
      description,
      imageUrl,
      createdById: req.user.id
    });
    
    const workout = await prisma.workout.create({
      data: {
        title: name,
        description,
        imageUrl,
        createdById: req.user.id
      }
    });
    
    console.log('Workout created successfully:', workout);
    
    res.status(201).json({
      id: workout.id,
      name: workout.title,
      description: workout.description,
      imageUrl: workout.imageUrl || null
    });
  } catch (err) {
    console.error('=== ERROR CREATING WORKOUT ===');
    console.error('Error message:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a workout
router.put('/workouts/:workoutId', async (req, res) => {
  try {
    const workoutId = parseInt(req.params.workoutId);
    const { name, description, imageUrl } = req.body;
    const workout = await prisma.workout.update({
      where: { id: workoutId },
      data: {
        ...(name && { title: name }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    });
    res.json({
      id: workout.id,
      name: workout.title,
      description: workout.description,
      imageUrl: workout.imageUrl || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a workout
router.delete('/workouts/:workoutId', async (req, res) => {
  try {
    const workoutId = parseInt(req.params.workoutId);
    
    console.log(`[ADMIN] Deleting workout ID: ${workoutId}`);
    
    // First, get all splits for this workout
    const splits = await prisma.workoutSplit.findMany({
      where: { workoutId },
      select: { id: true }
    });
    
    console.log(`[ADMIN] Found ${splits.length} splits to delete`);
    
    // Delete all exercises for each split
    for (const split of splits) {
      await prisma.exercise.deleteMany({
        where: { splitId: split.id }
      });
      console.log(`[ADMIN] Deleted exercises for split ID: ${split.id}`);
    }
    
    // Delete all splits for this workout
    await prisma.workoutSplit.deleteMany({
      where: { workoutId }
    });
    console.log(`[ADMIN] Deleted all workout splits`);
    
    // Finally, delete the workout
    await prisma.workout.delete({ where: { id: workoutId } });
    console.log(`[ADMIN] Workout deleted successfully`);
    
    res.json({ message: 'Workout and all related data deleted successfully' });
  } catch (err) {
    console.error(`[ADMIN] Error deleting workout:`, err);
    res.status(500).json({ error: err.message });
  }
});

// MEAL ADMIN ROUTES

// Create a meal
router.post('/meals', async (req, res) => {
  try {
    const { name, type, calories, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const meal = await prisma.meal.create({
      data: {
        name,
        type,
        calories: calories || 0,
        description
      }
    });
    res.status(201).json({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: meal.calories,
      description: meal.description
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a meal
router.put('/meals/:id', async (req, res) => {
  try {
    const mealId = parseInt(req.params.id);
    const { name, type, calories, description } = req.body;
    const meal = await prisma.meal.update({
      where: { id: mealId },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(calories !== undefined && { calories }),
        ...(description !== undefined && { description })
      }
    });
    res.json({
      id: meal.id,
      name: meal.name,
      type: meal.type,
      calories: meal.calories,
      description: meal.description
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// WORKOUT SPLIT ADMIN ROUTES

// Create a workout split
router.post('/workouts/:workoutId/splits', async (req, res) => {
  try {
    const workoutId = parseInt(req.params.workoutId);
    const { name, description, imageUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const split = await prisma.workoutSplit.create({
      data: {
        workoutId,
        name,
        description,
        imageUrl
      }
    });
    res.status(201).json({
      id: split.id,
      name: split.name,
      description: split.description,
      imageUrl: split.imageUrl || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a workout split
router.put('/splits/:splitId', async (req, res) => {
  try {
    const splitId = parseInt(req.params.splitId);
    const { name, description, imageUrl } = req.body;
    const split = await prisma.workoutSplit.update({
      where: { id: splitId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    });
    res.json({
      id: split.id,
      name: split.name,
      description: split.description,
      imageUrl: split.imageUrl || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a workout split
router.delete('/splits/:splitId', async (req, res) => {
  try {
    const splitId = parseInt(req.params.splitId);
    
    console.log(`[ADMIN] Deleting split ID: ${splitId}`);
    
    // First, delete all exercises for this split
    await prisma.exercise.deleteMany({
      where: { splitId }
    });
    console.log(`[ADMIN] Deleted exercises for split ID: ${splitId}`);
    
    // Then delete the split
    await prisma.workoutSplit.delete({ where: { id: splitId } });
    console.log(`[ADMIN] Split deleted successfully`);
    
    res.json({ message: 'Workout split and all exercises deleted successfully' });
  } catch (err) {
    console.error(`[ADMIN] Error deleting split:`, err);
    res.status(500).json({ error: err.message });
  }
});

// EXERCISE ADMIN ROUTES

// Create an exercise
router.post('/splits/:splitId/exercises', async (req, res) => {
  try {
    const splitId = parseInt(req.params.splitId);
    const { name, description, videoId } = req.body;
    if (!name || !videoId) {
      return res.status(400).json({ error: 'Name and videoId are required' });
    }
    const exercise = await prisma.exercise.create({
      data: {
        splitId,
        name,
        description,
        videoId,
        createdById: req.user.id
      }
    });
    res.status(201).json({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      videoId: exercise.videoId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an exercise
router.put('/exercises/:exerciseId', async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.exerciseId);
    const { name, description, videoId } = req.body;
    const exercise = await prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(videoId && { videoId })
      }
    });
    res.json({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      videoId: exercise.videoId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an exercise
router.delete('/exercises/:exerciseId', async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.exerciseId);
    await prisma.exercise.delete({ where: { id: exerciseId } });
    res.json({ message: 'Exercise deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// USER ADMIN ROUTES

// Create a user (Admin only - matches Android app expectation)
router.post('/users', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      username,
      height,
      weight,
      bodyFat,
      goalBodyFat,
      goalWeight,
      imageUrl 
    } = req.body;

    console.log(`[ADMIN] Creating user with email: ${email}, role: ${role}`);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || 'USER',
        username,
        heightCm: height,
        weightKg: weight,
        bodyFatPct: bodyFat,
        goalBodyFatPct: goalBodyFat,
        goalWeightKg: goalWeight,
        profileImage: imageUrl
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        heightCm: true,
        weightKg: true,
        bodyFatPct: true,
        goalBodyFatPct: true,
        goalWeightKg: true,
        profileImage: true,
        createdAt: true
      }
    });

    console.log(`[ADMIN] User created successfully with ID: ${user.id}`);

    // Return response matching Android UserResponse format
    res.status(201).json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      height: user.heightCm,
      weight: user.weightKg,
      bodyFat: user.bodyFatPct,
      goalBodyFat: user.goalBodyFatPct,
      goalWeight: user.goalWeightKg,
      createdAt: user.createdAt.toISOString(),
      imageUrl: user.profileImage
    });

  } catch (err) {
    console.error(`[ADMIN] Error creating user:`, err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
