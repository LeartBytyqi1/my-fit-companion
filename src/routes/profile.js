const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

// Change user password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old password and new password are required" });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    // Get current user data
    const user = await prisma.user.findUnique({ 
      where: { id: userId } 
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({ 
      message: "Password updated successfully" 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change user email
router.put('/change-email', auth, async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!newEmail) {
      return res.status(400).json({ error: "New email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    // Check if new email is already in use by another user
    const existingUser = await prisma.user.findUnique({ 
      where: { email: newEmail } 
    });
    
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ error: "Email is already in use by another account" });
    }

    // Update email in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
      select: {
        id: true,
        name: true,
        email: true,
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

    // Generate new token with updated email
    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
