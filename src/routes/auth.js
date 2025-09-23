const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const auth = require("../middleware/auth");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, height, weight, bodyFat, goal } = req.body;

    // check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data - handle optional fields
    const userData = {
      name,
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
        name: newUser.name,
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
        name: user.name, 
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString()
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHANGE PASSWORD
router.post("/change-password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // Get user ID from authenticated user

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

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHANGE EMAIL
router.put("/change-email", auth, async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.id; // Get user ID from authenticated user

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
      data: { email: newEmail }
    });

    // Generate new token with updated email
    const token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      message: "Email updated successfully",
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;