const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // Create sample users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const coach = await prisma.user.create({
      data: {
        email: 'coach@fitcompanion.com',
        password: hashedPassword,
        name: 'Sarah Coach',
        role: 'COACH',
        heightCm: 165,
        weightKg: 60.0,
        age: 30,
        gender: 'FEMALE',
        activityLevel: 'ACTIVE'
      }
    });

    const user = await prisma.user.create({
      data: {
        email: 'user@fitcompanion.com',
        password: hashedPassword,
        name: 'John User',
        role: 'USER',
        heightCm: 180,
        weightKg: 75.0,
        goalWeightKg: 70.0,
        age: 25,
        gender: 'MALE',
        activityLevel: 'MODERATE'
      }
    });

    console.log('✅ Users created');

    // Create sample exercises
    const exercises = await Promise.all([
      prisma.exercise.create({
        data: {
          name: 'Push-ups',
          description: 'Classic bodyweight exercise for chest, shoulders, and triceps',
          instructions: '1. Start in plank position\n2. Lower body to ground\n3. Push back up\n4. Repeat',
          muscleGroup: 'Chest',
          equipment: 'None',
          difficulty: 'BEGINNER',
          createdById: coach.id
        }
      }),
      prisma.exercise.create({
        data: {
          name: 'Squats',
          description: 'Fundamental lower body exercise',
          instructions: '1. Stand with feet shoulder-width apart\n2. Lower as if sitting in a chair\n3. Return to standing\n4. Repeat',
          muscleGroup: 'Legs',
          equipment: 'None',
          difficulty: 'BEGINNER',
          createdById: coach.id
        }
      }),
      prisma.exercise.create({
        data: {
          name: 'Deadlift',
          description: 'Compound exercise targeting multiple muscle groups',
          instructions: '1. Stand with feet hip-width apart\n2. Grip barbell with both hands\n3. Lift by extending hips and knees\n4. Lower with control',
          muscleGroup: 'Full Body',
          equipment: 'Barbell',
          difficulty: 'INTERMEDIATE',
          createdById: coach.id
        }
      })
    ]);

    console.log('✅ Exercises created');

    // Create sample workout
    const workout = await prisma.workout.create({
      data: {
        title: 'Beginner Full Body Workout',
        description: 'A comprehensive workout for beginners targeting all major muscle groups',
        difficulty: 'BEGINNER',
        duration: 45,
        calories: 300,
        muscleGroups: JSON.stringify(['Chest', 'Legs', 'Back']),
        equipment: JSON.stringify(['None', 'Dumbbells']),
        createdById: coach.id
      }
    });

    // Add exercises to workout
    await Promise.all([
      prisma.workoutExercise.create({
        data: {
          workoutId: workout.id,
          exerciseId: exercises[0].id, // Push-ups
          sets: 3,
          reps: 12,
          restTime: 60,
          order: 1
        }
      }),
      prisma.workoutExercise.create({
        data: {
          workoutId: workout.id,
          exerciseId: exercises[1].id, // Squats
          sets: 3,
          reps: 15,
          restTime: 60,
          order: 2
        }
      })
    ]);

    console.log('✅ Workout created');

    // Create sample foods
    const foods = await Promise.all([
      prisma.food.create({
        data: {
          name: 'Chicken Breast',
          category: 'Protein',
          caloriesPer100g: 165,
          proteinPer100g: 31.0,
          carbsPer100g: 0.0,
          fatPer100g: 3.6,
          fiberPer100g: 0.0
        }
      }),
      prisma.food.create({
        data: {
          name: 'Brown Rice',
          category: 'Grains',
          caloriesPer100g: 123,
          proteinPer100g: 2.6,
          carbsPer100g: 23.0,
          fatPer100g: 0.9,
          fiberPer100g: 1.8
        }
      }),
      prisma.food.create({
        data: {
          name: 'Broccoli',
          category: 'Vegetables',
          caloriesPer100g: 34,
          proteinPer100g: 2.8,
          carbsPer100g: 7.0,
          fatPer100g: 0.4,
          fiberPer100g: 2.6
        }
      })
    ]);

    console.log('✅ Foods created');

    // Create sample diet plan
    const diet = await prisma.diet.create({
      data: {
        title: 'Balanced Nutrition Plan',
        description: 'A well-balanced diet plan for general fitness',
        type: 'MAINTENANCE',
        targetCalories: 2000,
        targetProtein: 150.0,
        targetCarbs: 200.0,
        targetFat: 65.0,
        createdById: coach.id
      }
    });

    console.log('✅ Diet plan created');

    // Create sample goals for user
    await Promise.all([
      prisma.goal.create({
        data: {
          userId: user.id,
          type: 'WEIGHT_LOSS',
          title: 'Lose 5kg',
          description: 'Achieve target weight of 70kg',
          targetValue: 70.0,
          currentValue: 75.0,
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        }
      }),
      prisma.goal.create({
        data: {
          userId: user.id,
          type: 'STRENGTH',
          title: 'Do 50 push-ups',
          description: 'Build up to 50 consecutive push-ups',
          targetValue: 50.0,
          currentValue: 15.0
        }
      })
    ]);

    console.log('✅ Goals created');

    // Create sample progress entry
    await prisma.progressEntry.create({
      data: {
        userId: user.id,
        weight: 75.0,
        bodyFat: 18.5,
        photos: JSON.stringify([]),
        notes: 'Starting my fitness journey!'
      }
    });

    console.log('✅ Progress entry created');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📧 Sample accounts:');
    console.log('Coach: coach@fitcompanion.com / password123');
    console.log('User: user@fitcompanion.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
