const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// create workout (coach only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'COACH' && req.user.role !== 'ADMIN')
    return res.status(403).json({ message: 'Coach only' });

  const workout = await prisma.workout.create({
    data: {
      title: req.body.title,
      description: req.body.description,
      createdById: req.user.id
    }
  });
  res.json(workout);
});

// list workouts
router.get('/', async (_req, res) => {
  const items = await prisma.workout.findMany({
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(items);
});

module.exports = router;