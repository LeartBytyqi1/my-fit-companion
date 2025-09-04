const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Get user's progress entries
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    let where = { userId: req.user.id };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    const progressEntries = await prisma.progressEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      take: parseInt(limit)
    });

    // Parse JSON fields for response
    const parsedEntries = progressEntries.map(entry => ({
      ...entry,
      photos: entry.photos ? JSON.parse(entry.photos) : []
    }));
    
    res.json(parsedEntries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add progress entry
router.post('/', auth, async (req, res) => {
  try {
    const { weight, bodyFat, muscle, photos, notes } = req.body;
    
    const progressEntry = await prisma.progressEntry.create({
      data: {
        userId: req.user.id,
        weight: weight ? parseFloat(weight) : null,
        bodyFat: bodyFat ? parseFloat(bodyFat) : null,
        muscle: muscle ? parseFloat(muscle) : null,
        photos: photos ? JSON.stringify(photos) : null,
        notes
      }
    });

    // Parse JSON field for response
    const responseEntry = {
      ...progressEntry,
      photos: progressEntry.photos ? JSON.parse(progressEntry.photos) : []
    };
    
    res.status(201).json(responseEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get progress statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const entries = await prisma.progressEntry.findMany({
      where: {
        userId: req.user.id,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });
    
    const stats = {
      totalEntries: entries.length,
      weightChange: null,
      bodyFatChange: null,
      muscleChange: null,
      entries
    };

    // Parse JSON fields for entries
    const parsedEntries = entries.map(entry => ({
      ...entry,
      photos: entry.photos ? JSON.parse(entry.photos) : []
    }));

    stats.entries = parsedEntries;
    
    if (entries.length >= 2) {
      const first = entries[0];
      const last = entries[entries.length - 1];
      
      if (first.weight && last.weight) {
        stats.weightChange = last.weight - first.weight;
      }
      if (first.bodyFat && last.bodyFat) {
        stats.bodyFatChange = last.bodyFat - first.bodyFat;
      }
      if (first.muscle && last.muscle) {
        stats.muscleChange = last.muscle - first.muscle;
      }
    }
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
