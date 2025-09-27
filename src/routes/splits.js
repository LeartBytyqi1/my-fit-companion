const router = require('express').Router();
const prisma = require('../config/prisma');

// GET /splits/:workoutId - get splits for a workout (public)
router.get('/splits/:workoutId', async (req, res) => {
  try {
    const workoutId = parseInt(req.params.workoutId);
    const splits = await prisma.workoutSplit.findMany({
      where: { workoutId },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true
      },
      orderBy: {
        id: 'asc' // Or any order you prefer
      }
    });
    const response = splits.map(split => ({
      id: split.id,        // Maps to splitId in Android
      name: split.name,
      description: split.description,
      imageUrl: split.imageUrl
    }));
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;