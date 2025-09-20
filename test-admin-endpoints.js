const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';

// Test data
const testMeal = {
  name: "Protein Smoothie",
  calories: 320,
  description: "High protein smoothie with berries"
};

const testSession = {
  name: "Morning Cardio",
  date: Date.now(),
  duration: 45,
  userId: 1, // Will need to be updated with actual user ID
  imageUrl: "https://example.com/session.jpg"
};

const testExercise = {
  name: "Push-ups",
  type: "Strength",
  duration: 10,
  caloriesBurned: 50
};

const testTrainer = {
  firstName: "John",
  lastName: "Doe",
  email: "trainer@example.com",
  password: "password123",
  specialization: "Strength Training",
  contactInfo: "john@gym.com"
};

async function getAdminToken() {
  try {
    console.log('🔐 Getting admin token...');
    // You'll need to replace these with actual admin credentials
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    adminToken = response.data.token;
    console.log('✅ Admin token obtained');
  } catch (error) {
    console.error('❌ Failed to get admin token:', error.response?.data || error.message);
    throw error;
  }
}

async function testMealsEndpoint() {
  const headers = { Authorization: `Bearer ${adminToken}` };
  let mealId;

  try {
    console.log('\n🍽️ Testing Meals Endpoints...');

    // Create meal
    console.log('Creating meal...');
    const createResponse = await axios.post(`${BASE_URL}/admin/meals`, testMeal, { headers });
    mealId = createResponse.data.id;
    console.log('✅ Meal created:', createResponse.data);

    // Get all meals
    console.log('Getting all meals...');
    const getAllResponse = await axios.get(`${BASE_URL}/admin/meals`, { headers });
    console.log(`✅ Retrieved ${getAllResponse.data.length} meals`);

    // Update meal
    console.log('Updating meal...');
    const updateResponse = await axios.put(`${BASE_URL}/admin/meals/${mealId}`, {
      ...testMeal,
      calories: 350
    }, { headers });
    console.log('✅ Meal updated:', updateResponse.data);

    // Delete meal
    console.log('Deleting meal...');
    await axios.delete(`${BASE_URL}/admin/meals/${mealId}`, { headers });
    console.log('✅ Meal deleted');

  } catch (error) {
    console.error('❌ Meals endpoint failed:', error.response?.data || error.message);
  }
}

async function testExercisesEndpoint() {
  const headers = { Authorization: `Bearer ${adminToken}` };
  let exerciseId;

  try {
    console.log('\n🏋️ Testing Exercises Endpoints...');

    // Create exercise
    console.log('Creating exercise...');
    const createResponse = await axios.post(`${BASE_URL}/admin/exercises`, testExercise, { headers });
    exerciseId = createResponse.data.id;
    console.log('✅ Exercise created:', createResponse.data);

    // Get all exercises
    console.log('Getting all exercises...');
    const getAllResponse = await axios.get(`${BASE_URL}/admin/exercises`, { headers });
    console.log(`✅ Retrieved ${getAllResponse.data.length} exercises`);

    // Update exercise
    console.log('Updating exercise...');
    const updateResponse = await axios.put(`${BASE_URL}/admin/exercises/${exerciseId}`, {
      ...testExercise,
      caloriesBurned: 60
    }, { headers });
    console.log('✅ Exercise updated:', updateResponse.data);

    // Delete exercise
    console.log('Deleting exercise...');
    await axios.delete(`${BASE_URL}/admin/exercises/${exerciseId}`, { headers });
    console.log('✅ Exercise deleted');

  } catch (error) {
    console.error('❌ Exercises endpoint failed:', error.response?.data || error.message);
  }
}

async function testTrainersEndpoint() {
  const headers = { Authorization: `Bearer ${adminToken}` };
  let trainerId;

  try {
    console.log('\n👨‍🏫 Testing Trainers Endpoints...');

    // Create trainer
    console.log('Creating trainer...');
    const createResponse = await axios.post(`${BASE_URL}/admin/trainers`, testTrainer, { headers });
    trainerId = createResponse.data.trainerId;
    console.log('✅ Trainer created:', createResponse.data);

    // Update trainer
    console.log('Updating trainer...');
    const updateResponse = await axios.put(`${BASE_URL}/admin/trainers/${trainerId}`, {
      firstName: "Jane",
      lastName: "Smith",
      email: "trainer@example.com",
      specialization: "Cardio Training"
    }, { headers });
    console.log('✅ Trainer updated:', updateResponse.data);

    // Delete trainer
    console.log('Deleting trainer...');
    await axios.delete(`${BASE_URL}/admin/trainers/${trainerId}`, { headers });
    console.log('✅ Trainer deleted');

  } catch (error) {
    console.error('❌ Trainers endpoint failed:', error.response?.data || error.message);
  }
}

async function testSessionsEndpoint() {
  const headers = { Authorization: `Bearer ${adminToken}` };
  let sessionId;

  try {
    console.log('\n🏃 Testing Sessions Endpoints...');

    // First, we need to find or create a user for the session
    console.log('Getting users to use for session...');
    const usersResponse = await axios.get(`${BASE_URL}/admin/users`, { headers });
    if (usersResponse.data.length === 0) {
      console.log('⚠️ No users found, skipping sessions test');
      return;
    }
    const userId = usersResponse.data[0].id;

    // Create session
    console.log('Creating session...');
    const createResponse = await axios.post(`${BASE_URL}/admin/sessions`, {
      ...testSession,
      userId
    }, { headers });
    sessionId = createResponse.data.id;
    console.log('✅ Session created:', createResponse.data);

    // Update session
    console.log('Updating session...');
    const updateResponse = await axios.put(`${BASE_URL}/admin/sessions/${sessionId}`, {
      ...testSession,
      userId,
      duration: 60
    }, { headers });
    console.log('✅ Session updated:', updateResponse.data);

    // Delete session
    console.log('Deleting session...');
    await axios.delete(`${BASE_URL}/admin/sessions/${sessionId}`, { headers });
    console.log('✅ Session deleted');

  } catch (error) {
    console.error('❌ Sessions endpoint failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Admin Endpoints Tests\n');
    
    await getAdminToken();
    await testMealsEndpoint();
    await testExercisesEndpoint();
    await testTrainersEndpoint();
    await testSessionsEndpoint();

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };