const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get user's goals
router.get('/', auth, async (req, res) => {
  try {
    const { completed, type } = req.query;
    
    let where = { userId: req.user.id };
    
    if (completed !== undefined) {
      where.completed = completed === 'true';
    }
    
    if (type) {
      where.type = type;
    }
    
    const goals = await prisma.goal.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new goal
router.post('/', [
  auth,
  body('type').isIn(['WEIGHT_LOSS', 'WEIGHT_GAIN', 'MUSCLE_GAIN', 'STRENGTH', 'ENDURANCE', 'BODY_FAT', 'CUSTOM']).withMessage('Valid goal type required'),
  body('title').notEmpty().withMessage('Goal title is required'),
  body('targetValue').optional().isFloat({ min: 0 }).withMessage('Target value must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { type, title, description, targetValue, deadline } = req.body;
    
    const goal = await prisma.goal.create({
      data: {
        userId: req.user.id,
        type,
        title,
        description,
        targetValue: targetValue ? parseFloat(targetValue) : null,
        deadline: deadline ? new Date(deadline) : null
      }
    });
    
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update goal progress
router.put('/:id/progress', [
  auth,
  body('currentValue').isFloat({ min: 0 }).withMessage('Current value must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const goalId = parseInt(req.params.id);
    const { currentValue } = req.body;
    
    // Check if goal belongs to user
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: req.user.id
      }
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    // Check if goal should be marked as completed
    const completed = goal.targetValue && parseFloat(currentValue) >= goal.targetValue;
    
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        currentValue: parseFloat(currentValue),
        completed,
        updatedAt: new Date()
      }
    });
    
    res.json(updatedGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark goal as completed
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const goalId = parseInt(req.params.id);
    
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: req.user.id
      }
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        completed: true,
        updatedAt: new Date()
      }
    });
    
    res.json(updatedGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update goal
router.put('/:id', [
  auth,
  body('title').optional().notEmpty().withMessage('Goal title cannot be empty'),
  body('targetValue').optional().isFloat({ min: 0 }).withMessage('Target value must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const goalId = parseInt(req.params.id);
    
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: req.user.id
      }
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    const { title, description, targetValue, deadline } = req.body;
    
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(targetValue !== undefined && { targetValue: parseFloat(targetValue) }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        updatedAt: new Date()
      }
    });
    
    res.json(updatedGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const goalId = parseInt(req.params.id);
    
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: req.user.id
      }
    });
    
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    await prisma.goal.delete({
      where: { id: goalId }
    });
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get goal statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id }
    });
    
    const stats = {
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.completed).length,
      activeGoals: goals.filter(g => !g.completed).length,
      overdueGoals: goals.filter(g => !g.completed && g.deadline && new Date(g.deadline) < new Date()).length,
      goalsByType: {}
    };
    
    // Count goals by type
    goals.forEach(goal => {
      if (!stats.goalsByType[goal.type]) {
        stats.goalsByType[goal.type] = { total: 0, completed: 0 };
      }
      stats.goalsByType[goal.type].total++;
      if (goal.completed) {
        stats.goalsByType[goal.type].completed++;
      }
    });
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
