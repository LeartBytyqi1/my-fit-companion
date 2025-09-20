# Admin API Endpoints Documentation

This document outlines the new admin endpoints implemented for the fitness companion app, matching the mobile app's request/response format.

## Authentication

All admin endpoints require authentication with an admin user account. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints Overview

### 🍽️ Meals Management

#### POST `/admin/meals` - Create Meal
Creates a new meal entry.

**Request Body (MealRequest):**
```json
{
  "name": "Protein Smoothie",
  "calories": 320,
  "description": "High protein smoothie with berries"
}
```

**Response (MealsResponse):**
```json
{
  "id": 1,
  "name": "Protein Smoothie",
  "calories": 320,
  "description": "High protein smoothie with berries"
}
```

#### GET `/admin/meals` - Get All Meals
Retrieves all meals.

**Response:** Array of MealsResponse objects

#### PUT `/admin/meals/{id}` - Update Meal
Updates an existing meal.

**Request Body:** MealRequest (partial updates supported)
**Response:** MealsResponse

#### DELETE `/admin/meals/{id}` - Delete Meal
Deletes a meal. Returns 204 No Content on success.

---

### 🏃 Sessions Management

#### POST `/admin/sessions` - Create Session
Creates a new workout session.

**Request Body (SessionRequest):**
```json
{
  "name": "Morning Cardio",
  "date": 1695168000000,
  "duration": 45,
  "userId": 1,
  "imageUrl": "https://example.com/session.jpg"
}
```

**Response (SessionResponse):**
```json
{
  "id": 1,
  "name": "Morning Cardio",
  "date": "2025-09-20T08:00:00.000Z",
  "duration": 45,
  "userId": 1,
  "imageUrl": "https://example.com/session.jpg"
}
```

#### PUT `/admin/sessions/{id}` - Update Session
Updates an existing session.

**Request Body:** SessionRequest (partial updates supported)
**Response:** SessionResponse

#### DELETE `/admin/sessions/{id}` - Delete Session
Deletes a session. Returns 204 No Content on success.

---

### 🏋️ Exercises Management

#### POST `/admin/exercises` - Create Exercise
Creates a new exercise.

**Request Body (ExerciseRequest):**
```json
{
  "name": "Push-ups",
  "type": "Strength",
  "duration": 10,
  "caloriesBurned": 50
}
```

**Response (ExerciseResponse):**
```json
{
  "id": 1,
  "name": "Push-ups",
  "type": "Strength",
  "duration": 10,
  "caloriesBurned": 50
}
```

#### GET `/admin/exercises` - Get All Exercises
Retrieves all exercises.

**Response:** Array of ExerciseResponse objects

#### PUT `/admin/exercises/{id}` - Update Exercise
Updates an existing exercise.

**Request Body:** ExerciseRequest (partial updates supported)
**Response:** ExerciseResponse

#### DELETE `/admin/exercises/{id}` - Delete Exercise
Deletes an exercise. Returns 204 No Content on success.

---

### 👨‍🏫 Trainers Management

Trainers are implemented as Users with the `TRAINER` role, providing better integration with the existing user system.

#### POST `/admin/trainers` - Create Trainer
Creates a new trainer (User with TRAINER role).

**Request Body (TrainerRequest):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "trainer@example.com",
  "password": "password123",
  "specialization": "Strength Training",
  "contactInfo": "john@gym.com"
}
```

**Response (TrainerResponse):**
```json
{
  "trainerId": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "trainer@example.com",
  "specialization": "Strength Training",
  "contactInfo": "john@gym.com"
}
```

#### PUT `/admin/trainers/{id}` - Update Trainer
Updates an existing trainer.

**Request Body (UpdateTrainerRequest):**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "trainer@example.com",
  "specialization": "Cardio Training",
  "contactInfo": "jane@gym.com"
}
```

**Response:** TrainerResponse

#### DELETE `/admin/trainers/{id}` - Delete Trainer
Deletes a trainer. Returns 204 No Content on success.

---

## Database Changes

### New Models
- **Meal**: Stores meal information with name, calories, and description
- **TRAINER Role**: Added to the existing User Role enum

### Modified Models
- **User**: Added `specialization` and `contactInfo` fields for trainers
- **Exercise**: Added `type` and `caloriesBurned` fields, modified `duration` to be in minutes
- **WorkoutSession**: Added `name` and `imageUrl` fields, made `workoutId` optional

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200 OK` - Successful GET/PUT operations
- `201 Created` - Successful POST operations
- `204 No Content` - Successful DELETE operations
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server errors

Error responses include a descriptive message:
```json
{
  "error": "Missing required fields: name, calories"
}
```

## Testing

A test script is available at `/test-admin-endpoints.js` that can be used to verify all endpoints are working correctly. Update the admin credentials in the script before running:

```bash
node test-admin-endpoints.js
```

## Mobile App Integration

These endpoints are designed to work seamlessly with your Android app's API interface definitions:
- Request/response formats match exactly with your Kotlin data classes
- Field names and types are consistent
- Error handling follows RESTful conventions
- Authentication is handled through JWT tokens

The endpoints are ready for production use and follow the same patterns as your existing admin user management endpoints.