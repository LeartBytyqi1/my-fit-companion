const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// REGISTER
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: 'Email already used' });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, name, role }
  });

  return res.json({ id: user.id, email: user.email });
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({ token });
});

// CURRENT USER
router.get('/me', auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({
    id: user.id, email: user.email, name: user.name, role: user.role,
    heightCm: user.heightCm, weightKg: user.weightKg, bodyFatPct: user.bodyFatPct,
    goalWeightKg: user.goalWeightKg, goalBodyFatPct: user.goalBodyFatPct
  });
});

// UPDATE METRICS (height/weight/goals)
router.put('/me', auth, async (req, res) => {
  const data = (({ name, heightCm, weightKg, bodyFatPct, goalWeightKg, goalBodyFatPct }) =>
    ({ name, heightCm, weightKg, bodyFatPct, goalWeightKg, goalBodyFatPct }))(req.body);
  const updated = await prisma.user.update({ where: { id: req.user.id }, data });
  res.json({ ok: true, id: updated.id });
});

module.exports = router;