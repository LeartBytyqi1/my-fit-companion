const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        heightCm: true,
        weightKg: true,
        bodyFatPct: true,
        goalWeightKg: true,
        goalBodyFatPct: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const { name, heightCm, weightKg, bodyFatPct, goalWeightKg, goalBodyFatPct } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(heightCm && { heightCm: parseInt(heightCm) }),
        ...(weightKg && { weightKg: parseFloat(weightKg) }),
        ...(bodyFatPct && { bodyFatPct: parseFloat(bodyFatPct) }),
        ...(goalWeightKg && { goalWeightKg: parseFloat(goalWeightKg) }),
        ...(goalBodyFatPct && { goalBodyFatPct: parseFloat(goalBodyFatPct) })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        heightCm: true,
        weightKg: true,
        bodyFatPct: true,
        goalWeightKg: true,
        goalBodyFatPct: true,
        updatedAt: true
      }
    });
    
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
