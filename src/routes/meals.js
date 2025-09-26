const router = require('express').Router();
const prisma = require('../config/prisma');

// GET /meals - get all meals (public)
router.get('/', async (req, res) => {
  try {
    const meals = await prisma.meal.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        calories: true,
        description: true
      }
    });
    res.json(meals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;