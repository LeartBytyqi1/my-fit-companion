const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Get all workouts (public - accessible by all users)
router.get('/', async (req, res) => {
  try {
    const { difficulty, muscleGroups, search } = req.query;
    
    let where = {};
    
    if (difficulty) where.difficulty = difficulty;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const workouts = await prisma.workout.findMany({
      where,
      include: { 
        createdBy: { select: { id: true, name: true } },
        exercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                description: true,
                instructions: true,
                muscleGroup: true,
                equipment: true,
                difficulty: true,
                imageUrl: true,
                videoUrl: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get workout by ID (public - accessible by all users)
router.get('/:id', async (req, res) => {
  try {
    const workoutId = parseInt(req.params.id);
    
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: { 
        createdBy: { select: { id: true, name: true } },
        exercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                description: true,
                instructions: true,
                muscleGroup: true,
                equipment: true,
                difficulty: true,
                imageUrl: true,
                videoUrl: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create workout with exercises (ADMIN ONLY)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      difficulty, 
      duration, 
      calories, 
      muscleGroups, 
      equipment,
      exercises // Array of { exerciseId, sets, reps, weight, duration, restTime, order }
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Create workout with exercises in a transaction
    const workout = await prisma.$transaction(async (prisma) => {
      // Create the workout
      const newWorkout = await prisma.workout.create({
        data: {
          title,
          description,
          difficulty: difficulty || 'BEGINNER',
          duration,
          calories,
          muscleGroups: muscleGroups ? JSON.stringify(muscleGroups) : null,
          equipment: equipment ? JSON.stringify(equipment) : null,
          createdById: req.user.id
        }
      });

      // Add exercises to the workout if provided
      if (exercises && exercises.length > 0) {
        const workoutExercises = exercises.map((ex, index) => ({
          workoutId: newWorkout.id,
          exerciseId: ex.exerciseId,
          sets: ex.sets || 1,
          reps: ex.reps,
          duration: ex.duration,
          weight: ex.weight,
          restTime: ex.restTime || 60,
          order: ex.order !== undefined ? ex.order : index
        }));

        await prisma.workoutExercise.createMany({
          data: workoutExercises
        });
      }

      // Return workout with exercises
      return await prisma.workout.findUnique({
        where: { id: newWorkout.id },
        include: { 
          createdBy: { select: { id: true, name: true } },
          exercises: {
            include: {
              exercise: true
            },
            orderBy: { order: 'asc' }
          }
        }
      });
    });

    res.status(201).json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update workout (ADMIN ONLY)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const workoutId = parseInt(req.params.id);
    const { 
      title, 
      description, 
      difficulty, 
      duration, 
      calories, 
      muscleGroups, 
      equipment,
      exercises 
    } = req.body;

    const workout = await prisma.$transaction(async (prisma) => {
      // Update the workout
      const updatedWorkout = await prisma.workout.update({
        where: { id: workoutId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(difficulty && { difficulty }),
          ...(duration !== undefined && { duration }),
          ...(calories !== undefined && { calories }),
          ...(muscleGroups && { muscleGroups: JSON.stringify(muscleGroups) }),
          ...(equipment && { equipment: JSON.stringify(equipment) })
        }
      });

      // If exercises are provided, replace all existing exercises
      if (exercises) {
        // Delete existing workout exercises
        await prisma.workoutExercise.deleteMany({
          where: { workoutId }
        });

        // Add new exercises
        if (exercises.length > 0) {
          const workoutExercises = exercises.map((ex, index) => ({
            workoutId: workoutId,
            exerciseId: ex.exerciseId,
            sets: ex.sets || 1,
            reps: ex.reps,
            duration: ex.duration,
            weight: ex.weight,
            restTime: ex.restTime || 60,
            order: ex.order !== undefined ? ex.order : index
          }));

          await prisma.workoutExercise.createMany({
            data: workoutExercises
          });
        }
      }

      // Return updated workout with exercises
      return await prisma.workout.findUnique({
        where: { id: workoutId },
        include: { 
          createdBy: { select: { id: true, name: true } },
          exercises: {
            include: {
              exercise: true
            },
            orderBy: { order: 'asc' }
          }
        }
      });
    });

    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete workout (ADMIN ONLY)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const workoutId = parseInt(req.params.id);

    const workout = await prisma.workout.findUnique({
      where: { id: workoutId }
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Delete workout (cascade will handle workout exercises)
    await prisma.workout.delete({
      where: { id: workoutId }
    });

    res.json({ message: 'Workout deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;