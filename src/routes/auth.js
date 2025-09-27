const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, height, weight, bodyFat, goal } = req.body;

    // check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data - handle optional fields
    const userData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      ...(height && { heightCm: Math.round(height) }), // Convert to int for heightCm
      ...(weight && { weightKg: weight }),
      ...(bodyFat && { bodyFatPct: bodyFat }),
      ...(goal && { goalWeightKg: goal }) // Assuming goal refers to goal weight
    };

    const newUser = await prisma.user.create({
      data: userData
    });

    // generate token immediately after registration
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ 
      token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        heightCm: newUser.heightCm,
        weightKg: newUser.weightKg,
        bodyFatPct: newUser.bodyFatPct,
        goalWeightKg: newUser.goalWeightKg,
        createdAt: newUser.createdAt.toISOString()
      },
      message: "User registered successfully" 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    // generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString()
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;