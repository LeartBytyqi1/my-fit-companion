const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get user's workout sessions
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0, workoutId } = req.query;
    
    let where = { userId: req.user.id };
    if (workoutId) {
      where.workoutId = parseInt(workoutId);
    }
    
    const sessions = await prisma.workoutSession.findMany({
      where,
      include: {
        workout: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true
          }
        }
      },
      orderBy: { startTime: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start a workout session
router.post('/start', [
  auth,
  body('workoutId').isInt().withMessage('Valid workout ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { workoutId } = req.body;
    
    // Check if workout exists
    const workout = await prisma.workout.findUnique({
      where: { id: parseInt(workoutId) }
    });
    
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    // Check if user has an active session
    const activeSession = await prisma.workoutSession.findFirst({
      where: {
        userId: req.user.id,
        endTime: null
      }
    });
    
    if (activeSession) {
      return res.status(400).json({ error: 'You have an active workout session. Please finish it first.' });
    }
    
    const session = await prisma.workoutSession.create({
      data: {
        userId: req.user.id,
        workoutId: parseInt(workoutId),
        startTime: new Date()
      },
      include: {
        workout: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true
          }
        }
      }
    });
    
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// End a workout session
router.post('/end/:sessionId', [
  auth,
  body('caloriesBurned').optional().isInt({ min: 0 }).withMessage('Calories must be a positive number'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const sessionId = parseInt(req.params.sessionId);
    const { caloriesBurned, notes } = req.body;
    
    // Check if session exists and belongs to user
    const session = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        userId: req.user.id,
        endTime: null
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Active workout session not found' });
    }
    
    const updatedSession = await prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : null,
        notes,
        completed: true
      },
      include: {
        workout: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true
          }
        }
      }
    });
    
    res.json(updatedSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current active session
router.get('/active', auth, async (req, res) => {
  try {
    const activeSession = await prisma.workoutSession.findFirst({
      where: {
        userId: req.user.id,
        endTime: null
      },
      include: {
        workout: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true
          }
        }
      }
    });
    
    res.json(activeSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get workout statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const sessions = await prisma.workoutSession.findMany({
      where: {
        userId: req.user.id,
        completed: true,
        startTime: { gte: startDate }
      }
    });
    
    const stats = {
      totalSessions: sessions.length,
      totalCaloriesBurned: sessions.reduce((sum, session) => sum + (session.caloriesBurned || 0), 0),
      averageSessionTime: 0,
      thisWeekSessions: 0
    };
    
    // Calculate average session time
    const completedSessions = sessions.filter(s => s.endTime);
    if (completedSessions.length > 0) {
      const totalMinutes = completedSessions.reduce((sum, session) => {
        const duration = (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60);
        return sum + duration;
      }, 0);
      stats.averageSessionTime = Math.round(totalMinutes / completedSessions.length);
    }
    
    // This week sessions
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    stats.thisWeekSessions = sessions.filter(s => new Date(s.startTime) >= weekAgo).length;
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
