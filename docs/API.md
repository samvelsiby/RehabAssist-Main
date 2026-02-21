# API Documentation

This document describes the data models and API patterns used in RehabAssist.

## Core Data Models

### Exercise Types

The application supports the following exercise types:

```typescript
type ExerciseMode = 'squat' | 'heel_raise' | 'hamstring_curl';
```

### Exercise Rules

Each exercise has configurable parameters:

```typescript
interface ExerciseRules {
  targetSets: number;
  minRepsPerSet: number;
  maxRepsPerSet: number;
  restBetweenSets: number; // seconds
  formThreshold: number;   // percentage
}
```

### Analysis Results

Real-time analysis provides:

```typescript
interface AnalyzerResult {
  correct: number;        // Total correct reps
  incorrect: number;      // Total incorrect reps  
  formScore: number;      // Current form score (0-100)
  feedback: string[];     // Form feedback messages
  state: string;          // Current exercise state
}
```

## Database Schema

### Users Table
- `id` - Primary key
- `email` - User email
- `role` - 'client' | 'physio'
- `first_name` - User's first name
- `last_name` - User's last name

### Exercises Table
- `id` - Exercise identifier (matches ExerciseMode)
- `name` - Display name
- `description` - Exercise description
- `target_muscle_groups` - Array of muscle groups

### Assigned Exercises Table
- `id` - Assignment ID
- `client_id` - Reference to user
- `physio_id` - Assigning physiotherapist
- `exercise_id` - Reference to exercise
- `sets` - Target number of sets
- `reps_per_set` - Target reps per set

### Session Logs Table
- `id` - Log entry ID
- `client_id` - User who performed exercise
- `assigned_exercise_id` - Reference to assignment
- `correct_reps` - Correct repetitions
- `incorrect_reps` - Incorrect repetitions
- `form_score` - Average form score
- `session_date` - Date of session

## Pose Detection API

### MediaPipe Integration

The application uses MediaPipe Pose Landmarker for:

- Real-time pose detection
- Landmark extraction
- Joint angle calculations
- Movement analysis

### Key Landmarks Used

- **Hip**: Left/Right hip landmarks
- **Knee**: Left/Right knee landmarks  
- **Ankle**: Left/Right ankle landmarks
- **Heel**: Left/Right heel landmarks

### Exercise Analysis

Each exercise analyzer implements:

```typescript
interface ExerciseAnalyzer {
  analyze(landmarks: Landmark[]): AnalyzerResult;
  reset(): void;
  getSide(): 'left' | 'right';
}
```

## Authentication Flow

1. **Registration**: Create account with email/password
2. **Login**: Authenticate using Supabase Auth
3. **Role-based access**: Different dashboards for clients/physios
4. **Session management**: Persistent authentication state

## Error Handling

### Common Error Types

- `CAMERA_ACCESS_DENIED` - User denied camera permission
- `MEDIAPIPE_INIT_FAILED` - MediaPipe initialization error
- `POSE_DETECTION_FAILED` - Pose detection error
- `SUPABASE_ERROR` - Database operation error

### Error Recovery

The application implements:
- Automatic retry for network errors
- Graceful degradation when camera unavailable
- User-friendly error messages
- Fallback states for missing data

## Performance Considerations

- MediaPipe models loaded asynchronously
- Pose detection runs at 30 FPS when possible
- Database operations use React Query caching
- Real-time updates optimized to prevent excessive re-renders