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
      }
    });
    const response = splits.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      imageUrl: s.imageUrl || null
    }));
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;