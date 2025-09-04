const router = require('express').Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all foods (with search)
router.get('/', async (req, res) => {
  try {
    const { search, category, limit = 50, offset = 0 } = req.query;
    
    let where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    const foods = await prisma.food.findMany({
      where,
      orderBy: { name: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get food by ID
router.get('/:id', async (req, res) => {
  try {
    const food = await prisma.food.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!food) {
      return res.status(404).json({ error: 'Food not found' });
    }
    
    res.json(food);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add food to database (coach/admin only)
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Food name is required'),
  body('caloriesPer100g').isInt({ min: 0 }).withMessage('Calories must be a positive number'),
  body('proteinPer100g').isFloat({ min: 0 }).withMessage('Protein must be a positive number'),
  body('carbsPer100g').isFloat({ min: 0 }).withMessage('Carbs must be a positive number'),
  body('fatPer100g').isFloat({ min: 0 }).withMessage('Fat must be a positive number')
], async (req, res) => {
  try {
    if (req.user.role !== 'COACH' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only coaches and admins can add foods' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      name,
      brand,
      barcode,
      caloriesPer100g,
      proteinPer100g,
      carbsPer100g,
      fatPer100g,
      fiberPer100g,
      sugarPer100g,
      sodiumPer100g,
      category
    } = req.body;
    
    const food = await prisma.food.create({
      data: {
        name,
        brand,
        barcode,
        caloriesPer100g: parseInt(caloriesPer100g),
        proteinPer100g: parseFloat(proteinPer100g),
        carbsPer100g: parseFloat(carbsPer100g),
        fatPer100g: parseFloat(fatPer100g),
        fiberPer100g: fiberPer100g ? parseFloat(fiberPer100g) : null,
        sugarPer100g: sugarPer100g ? parseFloat(sugarPer100g) : null,
        sodiumPer100g: sodiumPer100g ? parseFloat(sodiumPer100g) : null,
        category
      }
    });
    
    res.status(201).json(food);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log nutrition entry
router.post('/log', [
  auth,
  body('foodId').isInt().withMessage('Valid food ID required'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('mealType').isIn(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).withMessage('Valid meal type required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { foodId, quantity, mealType, date } = req.body;
    
    // Check if food exists
    const food = await prisma.food.findUnique({
      where: { id: parseInt(foodId) }
    });
    
    if (!food) {
      return res.status(404).json({ error: 'Food not found' });
    }
    
    const nutritionEntry = await prisma.nutritionEntry.create({
      data: {
        userId: req.user.id,
        foodId: parseInt(foodId),
        quantity: parseFloat(quantity),
        mealType,
        date: date ? new Date(date) : new Date()
      },
      include: {
        food: {
          select: {
            name: true,
            brand: true,
            caloriesPer100g: true,
            proteinPer100g: true,
            carbsPer100g: true,
            fatPer100g: true
          }
        }
      }
    });
    
    res.status(201).json(nutritionEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's nutrition entries
router.get('/entries', auth, async (req, res) => {
  try {
    const { date, mealType, limit = 50, offset = 0 } = req.query;
    
    let where = { userId: req.user.id };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      where.date = {
        gte: startDate,
        lt: endDate
      };
    }
    
    if (mealType) {
      where.mealType = mealType;
    }
    
    const entries = await prisma.nutritionEntry.findMany({
      where,
      include: {
        food: {
          select: {
            name: true,
            brand: true,
            caloriesPer100g: true,
            proteinPer100g: true,
            carbsPer100g: true,
            fatPer100g: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get daily nutrition summary
router.get('/summary/:date', auth, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const entries = await prisma.nutritionEntry.findMany({
      where: {
        userId: req.user.id,
        date: {
          gte: date,
          lt: nextDay
        }
      },
      include: {
        food: true
      }
    });
    
    const summary = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      mealBreakdown: {
        BREAKFAST: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        LUNCH: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        DINNER: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        SNACK: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      }
    };
    
    entries.forEach(entry => {
      const multiplier = entry.quantity / 100; // Convert to per gram consumed
      
      const calories = entry.food.caloriesPer100g * multiplier;
      const protein = entry.food.proteinPer100g * multiplier;
      const carbs = entry.food.carbsPer100g * multiplier;
      const fat = entry.food.fatPer100g * multiplier;
      
      summary.totalCalories += calories;
      summary.totalProtein += protein;
      summary.totalCarbs += carbs;
      summary.totalFat += fat;
      
      summary.mealBreakdown[entry.mealType].calories += calories;
      summary.mealBreakdown[entry.mealType].protein += protein;
      summary.mealBreakdown[entry.mealType].carbs += carbs;
      summary.mealBreakdown[entry.mealType].fat += fat;
    });
    
    // Round numbers
    summary.totalCalories = Math.round(summary.totalCalories);
    summary.totalProtein = Math.round(summary.totalProtein * 10) / 10;
    summary.totalCarbs = Math.round(summary.totalCarbs * 10) / 10;
    summary.totalFat = Math.round(summary.totalFat * 10) / 10;
    
    Object.keys(summary.mealBreakdown).forEach(meal => {
      summary.mealBreakdown[meal].calories = Math.round(summary.mealBreakdown[meal].calories);
      summary.mealBreakdown[meal].protein = Math.round(summary.mealBreakdown[meal].protein * 10) / 10;
      summary.mealBreakdown[meal].carbs = Math.round(summary.mealBreakdown[meal].carbs * 10) / 10;
      summary.mealBreakdown[meal].fat = Math.round(summary.mealBreakdown[meal].fat * 10) / 10;
    });
    
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
