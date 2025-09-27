const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'COACH' && req.user.role !== 'ADMIN')
    return res.status(403).json({ message: 'Coach only' });

  const diet = await prisma.diet.create({
    data: {
      title: req.body.title,
      description: req.body.description,
      createdById: req.user.id
    }
  });
  res.json(diet);
});

router.get('/', async (_req, res) => {
  const items = await prisma.diet.findMany({
    include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(items);
});

module.exports = router;