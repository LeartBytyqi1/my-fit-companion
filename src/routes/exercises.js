const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Get all exercises
router.get('/', async (req, res) => {
  try {
    const { muscleGroup, equipment, difficulty, search } = req.query;
    
    let where = {};
    
    if (muscleGroup) where.muscleGroup = muscleGroup;
    if (equipment) where.equipment = equipment;
    if (difficulty) where.difficulty = difficulty;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const exercises = await prisma.exercise.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(exercises);
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
          select: { id: true, name: true }
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

// Create exercise (coach/admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'COACH' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only coaches and admins can create exercises' });
    }
    
    const {
      name,
      description,
      instructions,
      muscleGroup,
      equipment,
      difficulty,
      imageUrl,
      videoUrl
    } = req.body;
    
    const exercise = await prisma.exercise.create({
      data: {
        name,
        description,
        instructions,
        muscleGroup,
        equipment,
        difficulty: difficulty || 'BEGINNER',
        imageUrl,
        videoUrl,
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });
    
    res.status(201).json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update exercise
router.put('/:id', auth, async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.id);
    
    // Check if user owns the exercise or is admin
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId }
    });
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    if (exercise.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this exercise' });
    }
    
    const updatedExercise = await prisma.exercise.update({
      where: { id: exerciseId },
      data: req.body,
      include: {
        createdBy: {
          select: { id: true, name: true }
        }
      }
    });
    
    res.json(updatedExercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete exercise
router.delete('/:id', auth, async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.id);
    
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId }
    });
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    if (exercise.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this exercise' });
    }
    
    await prisma.exercise.delete({
      where: { id: exerciseId }
    });
    
    res.json({ message: 'Exercise deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
