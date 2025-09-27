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
      title: w.title,        // Direct mapping, no transformation
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
        splits: {
          include: {
            exercises: {
              select: {
                id: true,
                name: true,
                description: true,
                videoId: true
              }
            }
          }
        }
      }
    });
    
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    // Transform response to use title directly
    const response = {
      id: workout.id,
      title: workout.title,     // Direct mapping
      description: workout.description,
      imageUrl: workout.imageUrl,
      createdBy: workout.createdBy,
      splits: workout.splits
    };
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;