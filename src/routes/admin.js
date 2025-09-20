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
        name: true,
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
        activityLevel: true,
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
      name: user.name,
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
      activityLevel: user.activityLevel,
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

// POST /admin/users - Create new user
router.post("/users", async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        error: "Missing required fields: email, password, firstName, lastName, role" 
      });
    }

    // Validate role
    const validRoles = ['USER', 'TRAINER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: "Invalid role. Must be one of: USER, TRAINER, ADMIN" 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`, // Keep name field for backward compatibility
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
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
        activityLevel: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Transform response
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      heightCm: newUser.heightCm,
      weightKg: newUser.weightKg,
      bodyFatPct: newUser.bodyFatPct,
      goalWeightKg: newUser.goalWeightKg,
      goalBodyFatPct: newUser.goalBodyFatPct,
      age: newUser.age,
      gender: newUser.gender,
      activityLevel: newUser.activityLevel,
      profileImage: newUser.profileImage,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString()
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
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

    // Update name field if firstName or lastName changed for backward compatibility
    if (firstName !== undefined || lastName !== undefined) {
      const newFirstName = firstName !== undefined ? firstName : existingUser.firstName;
      const newLastName = lastName !== undefined ? lastName : existingUser.lastName;
      updateData.name = `${newFirstName || ''} ${newLastName || ''}`.trim();
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
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
        activityLevel: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Transform response
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
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
      activityLevel: updatedUser.activityLevel,
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

    res.status(204).send(); // No content response for successful deletion
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

    res.status(204).send(); // No content response for successful deletion
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

    // Create session
    const newSession = await prisma.workoutSession.create({
      data: {
        name,
        userId,
        startTime: sessionDate,
        duration,
        imageUrl: imageUrl || null,
        completed: false
      }
    });

    res.status(201).json({
      id: newSession.id,
      name: newSession.name,
      date: newSession.startTime.toISOString(),
      duration: newSession.duration,
      userId: newSession.userId,
      imageUrl: newSession.imageUrl
    });
  } catch (error) {
    console.error("Error creating session:", error);
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
      updateData.startTime = sessionDate;
    }

    // Update session
    const updatedSession = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: updateData
    });

    res.json({
      id: updatedSession.id,
      name: updatedSession.name,
      date: updatedSession.startTime.toISOString(),
      duration: updatedSession.duration,
      userId: updatedSession.userId,
      imageUrl: updatedSession.imageUrl
    });
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

    res.status(204).send(); // No content response for successful deletion
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

    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error("Error deleting exercise:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== TRAINERS ENDPOINTS =====

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

    // Update name field if firstName or lastName changed for backward compatibility
    if (firstName !== undefined || lastName !== undefined) {
      const newFirstName = firstName !== undefined ? firstName : existingTrainer.firstName;
      const newLastName = lastName !== undefined ? lastName : existingTrainer.lastName;
      updateData.name = `${newFirstName || ''} ${newLastName || ''}`.trim();
    }

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

    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error("Error deleting trainer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;