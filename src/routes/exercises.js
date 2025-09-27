const router = require('express').Router();
const prisma = require('../config/prisma');

// GET /exercises/:splitId - get exercises for a split (public)
router.get('/exercises/:splitId', async (req, res) => {
  try {
    const splitId = parseInt(req.params.splitId);
    const exercises = await prisma.exercise.findMany({
      where: { splitId },
      select: {
        id: true,
        name: true,
        description: true,
        videoId: true
      }
    });
    const response = exercises.map(e => ({
      id: e.id,
      name: e.name,
      description: e.description,
      videoId: e.videoId
    }));
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent exercises for user (for home screen)
router.get('/exercises/recent', require('../middleware/auth'), async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5; // Default 5 recent exercises
    
    const recentViews = await prisma.recentExercise.findMany({
      where: { userId },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            description: true,
            videoId: true
          }
        }
      },
      orderBy: { viewedAt: 'desc' },
      take: limit
    });
    
    const response = recentViews.map(view => ({
      id: view.exercise.id,
      name: view.exercise.name,
      description: view.exercise.description,
      videoId: view.exercise.videoId,
      lastViewedAt: view.viewedAt
    }));
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track recent exercise (when user clicks on exercise)
router.post('/exercises/:exerciseId/recent', require('../middleware/auth'), async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.exerciseId);
    const userId = req.user.id;
    
    // Upsert: create or update the view timestamp
    await prisma.recentExercise.upsert({
      where: {
        userId_exerciseId: {
          userId,
          exerciseId
        }
      },
      update: {
        viewedAt: new Date()
      },
      create: {
        userId,
        exerciseId,
        viewedAt: new Date()
      }
    });
    
    res.json({ message: 'Recent exercise saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get exercise by ID
router.get('/:id', async (req, res) => {
  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
