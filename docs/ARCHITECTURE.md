# Architecture Overview

This document outlines the technical architecture and design patterns used in RehabAssist.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser/UI    │◄──►│   React App      │◄──►│   Supabase      │
│                 │    │                  │    │   Database      │
│ • Camera Feed   │    │ • State Mgmt     │    │                 │
│ • MediaPipe     │    │ • Exercise Logic │    │ • Users         │
│ • Voice Output  │    │ • Authentication │    │ • Sessions      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App
├── AuthContext (Authentication state)
├── DashboardLayout (Navigation + layout)
├── Pages/
│   ├── Landing (Marketing page)
│   ├── Login/Register (Authentication)
│   ├── ClientDashboard (Patient view)
│   ├── PhysioDashboard (Therapist view)
│   ├── ExerciseSession (Main analysis)
│   └── Progress (Analytics)
└── UI Components (Reusable components)
```

### State Management

The application uses a combination of:

- **React Context**: Authentication state (`AuthContext`)
- **React Query**: Server state and caching
- **Local State**: Component-specific state with `useState`
- **Refs**: MediaPipe instances and real-time data

### Exercise Analysis Flow

```
Camera → MediaPipe → Exercise Analyzer → UI Updates
   ↓         ↓            ↓               ↓
Video    Landmarks   Rep Counting     Feedback
Stream   Detection   Form Scoring     Display
```

## Exercise Analysis Engine

### Base Architecture

All exercise analyzers extend from `BaseExerciseAnalyzer`:

```typescript
abstract class BaseExerciseAnalyzer {
  abstract analyze(landmarks: Landmark[]): AnalyzerResult;
  abstract reset(): void;
  protected calculateAngle(p1: Point, p2: Point, p3: Point): number;
  protected getDistance(p1: Point, p2: Point): number;
}
```

### State Machine Pattern

Exercise analysis uses state machines for rep counting:

```typescript
// Example: Squat states
type SquatState = 'standing' | 'descending' | 'bottom' | 'ascending';

// Transitions based on joint angles and positions
standing → descending → bottom → ascending → standing
```

### Exercise Specific Analyzers

1. **SquatAnalyzer**
   - Tracks hip and knee angles
   - Validates depth and form
   - Counts full range-of-motion reps

2. **HeelRaiseAnalyzer**  
   - Monitors ankle position
   - Tracks heel lift height
   - Validates balance and control

3. **HamstringCurlAnalyzer**
   - Focuses on knee flexion
   - Tracks leg position
   - Validates controlled movement

## Data Flow

### Authentication Flow

```
User Input → Supabase Auth → AuthContext → Route Protection
```

### Exercise Session Flow

```
1. Exercise Assignment Selection
2. Camera Initialization  
3. MediaPipe Pose Detection Setup
4. Real-time Analysis Loop:
   - Pose landmarks extraction
   - Exercise-specific analysis
   - Form scoring and feedback
   - Rep counting
5. Session Data Logging
6. Progress Dashboard Update
```

### Data Persistence

```
Session Data → React Query → Supabase → PostgreSQL
     ↓              ↓            ↓           ↓
  Real-time     Optimistic   REST API   Persistent
   Updates      Updates                  Storage
```

## Security Architecture

### Authentication
- Email/password authentication via Supabase Auth
- JWT tokens for session management
- Role-based access control

### Data Security
- Row Level Security (RLS) policies in Supabase
- Client-side route protection
- Environment variables for sensitive data

### Privacy
- Camera data processed locally (not transmitted)
- Only exercise metrics stored in database
- No video recording or image storage

## Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Dynamic imports for large components
- **Memoization**: React.memo for expensive components  
- **Virtualization**: For large data lists
- **Debouncing**: For real-time analysis updates

### MediaPipe Optimizations
- **Model Caching**: Pose models cached after first load
- **Frame Skipping**: Analysis runs at optimal FPS
- **Worker Threads**: Pose detection in background thread
- **Memory Management**: Proper cleanup of video streams

### Database Optimizations
- **Query Optimization**: Efficient queries with proper indexes
- **Caching**: React Query for client-side caching
- **Batch Operations**: Bulk inserts for session logs
- **Connection Pooling**: Supabase handles connection management

## Error Handling Strategy

### Error Boundaries
- React Error Boundaries catch component errors
- Graceful fallback UI for broken components
- Error reporting for debugging

### Network Errors
- Automatic retry with exponential backoff
- Offline state detection
- User feedback for network issues

### MediaPipe Errors
- Fallback to previous frame data
- Graceful degradation when pose detection fails
- User guidance for optimal camera positioning

## Scalability Considerations

### Frontend Scalability
- Component-based architecture for maintainability
- Consistent design system
- Type-safe development with TypeScript

### Backend Scalability
- Serverless architecture with Supabase
- Automatic scaling based on usage
- CDN for static asset delivery

### Data Scalability
- Efficient database schema design
- Proper indexing for query performance
- Data archival strategies for long-term storage