const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// GET /workouts - user can get all workouts
router.get('/', async (req, res) => {
  try {
    const workouts = await prisma.workout.findMany({
      select: {
        id: true,
        title: true, // Will be mapped to 'name'
        description: true,
        imageUrl: true
      }
    });
    const response = workouts.map(w => ({
      id: w.id,
      name: w.title,
      description: w.description,
      imageUrl: w.imageUrl || null
    }));
    res.json(response);
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
        createdBy: { select: { id: true, firstName: true, lastName: true } },
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



module.exports = router;