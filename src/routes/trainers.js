const express = require("express");
const prisma = require("../config/prisma");

const router = express.Router();

// GET /trainers - Get all trainers (public endpoint)
router.get("/", async (req, res) => {
  try {
    const trainers = await prisma.user.findMany({
      where: { 
        role: 'TRAINER' 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialization: true,
        contactInfo: true,
        profileImage: true, // Include profile image for public display
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const trainersResponse = trainers.map(trainer => ({
      trainerId: trainer.id, // Use id as trainerId for mobile app compatibility
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      specialization: trainer.specialization,
      contactInfo: trainer.contactInfo,
      profileImage: trainer.profileImage
    }));

    res.json(trainersResponse);
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /trainers/:id - Get specific trainer by ID (public endpoint)
router.get("/:id", async (req, res) => {
  try {
    const trainerId = parseInt(req.params.id);

    if (isNaN(trainerId)) {
      return res.status(400).json({ error: "Invalid trainer ID" });
    }

    const trainer = await prisma.user.findFirst({
      where: { 
        id: trainerId,
        role: 'TRAINER'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialization: true,
        contactInfo: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found" });
    }

    const trainerResponse = {
      trainerId: trainer.id,
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      email: trainer.email,
      specialization: trainer.specialization,
      contactInfo: trainer.contactInfo,
      profileImage: trainer.profileImage
    };

    res.json(trainerResponse);
  } catch (error) {
    console.error("Error fetching trainer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;