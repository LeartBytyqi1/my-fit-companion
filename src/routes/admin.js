const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// GET /admin/users - Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        heightCm: true,
        weightKg: true,
        bodyFatPct: true,
        goalWeightKg: true,
        goalBodyFatPct: true,
        age: true,
        gender: true,
        activityLevel: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password field for security
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the response to match Android expectations
    const userResponse = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      bodyFatPct: user.bodyFatPct,
      goalWeightKg: user.goalWeightKg,
      goalBodyFatPct: user.goalBodyFatPct,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activityLevel,
      profileImage: user.profileImage,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }));

    res.json(userResponse);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/users - Create new user
router.post("/users", async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        error: "Missing required fields: email, password, firstName, lastName, role" 
      });
    }

    // Validate role
    const validRoles = ['USER', 'COACH', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: "Invalid role. Must be one of: USER, COACH, ADMIN" 
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`, // Keep name field for backward compatibility
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        heightCm: true,
        weightKg: true,
        bodyFatPct: true,
        goalWeightKg: true,
        goalBodyFatPct: true,
        age: true,
        gender: true,
        activityLevel: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Transform response
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      heightCm: newUser.heightCm,
      weightKg: newUser.weightKg,
      bodyFatPct: newUser.bodyFatPct,
      goalWeightKg: newUser.goalWeightKg,
      goalBodyFatPct: newUser.goalBodyFatPct,
      age: newUser.age,
      gender: newUser.gender,
      activityLevel: newUser.activityLevel,
      profileImage: newUser.profileImage,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString()
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /admin/users/:id - Update user
router.put("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { firstName, lastName, email, role } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['USER', 'COACH', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: "Invalid role. Must be one of: USER, COACH, ADMIN" 
        });
      }
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });
      if (emailTaken) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Build update data object (only include fields that were provided)
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;

    // Update name field if firstName or lastName changed for backward compatibility
    if (firstName !== undefined || lastName !== undefined) {
      const newFirstName = firstName !== undefined ? firstName : existingUser.firstName;
      const newLastName = lastName !== undefined ? lastName : existingUser.lastName;
      updateData.name = `${newFirstName || ''} ${newLastName || ''}`.trim();
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        heightCm: true,
        weightKg: true,
        bodyFatPct: true,
        goalWeightKg: true,
        goalBodyFatPct: true,
        age: true,
        gender: true,
        activityLevel: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Transform response
    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      heightCm: updatedUser.heightCm,
      weightKg: updatedUser.weightKg,
      bodyFatPct: updatedUser.bodyFatPct,
      goalWeightKg: updatedUser.goalWeightKg,
      goalBodyFatPct: updatedUser.goalBodyFatPct,
      age: updatedUser.age,
      gender: updatedUser.gender,
      activityLevel: updatedUser.activityLevel,
      profileImage: updatedUser.profileImage,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString()
    };

    res.json(userResponse);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/users/:id - Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;