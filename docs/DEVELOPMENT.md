# Development Guide

This guide provides information for developers working on RehabAssist.

## Development Setup

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 8.0 or higher
- **Git** for version control
- **Modern browser** with camera support

### Local Development

1. **Clone and install**:
```bash
git clone <repository-url>
cd RehabAssist-Main
npm install
```

2. **Environment configuration**:
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

3. **Start development server**:
```bash
npm run dev
```

4. **Open in browser**: http://localhost:5173

## Project Structure

### Core Directories

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Base UI components (buttons, inputs, etc.)
│   └── DashboardLayout.tsx
├── contexts/         # React context providers
├── hooks/            # Custom React hooks
├── pages/            # Main application pages
├── services/         # Business logic and external services
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
└── config/           # Configuration files
```

### Key Files

- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/pages/ExerciseSession.tsx` - Core exercise analysis page
- `src/services/mediapipe/` - MediaPipe integration
- `src/services/exercises/` - Exercise analysis engines

## Development Workflow

### Code Style

The project uses:
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** formatting (via ESLint)
- **Tailwind CSS** for styling

### Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production  
npm run preview            # Preview production build

# Quality Assurance
npm run lint              # Run linter
npm run test              # Run tests
npm run test:watch        # Run tests in watch mode

# Type Checking
npx tsc --noEmit         # Check types without emitting files
```

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit regularly
3. Ensure tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Ensure build succeeds: `npm run build`
6. Push and create pull request

## Adding New Exercises

### 1. Define Exercise Type

Add to `src/hooks/useExercises.ts`:

```typescript
type ExerciseMode = 'squat' | 'heel_raise' | 'hamstring_curl' | 'your_new_exercise';
```

### 2. Create Exercise Analyzer

Create `src/services/exercises/your-new-exercise-analyzer.ts`:

```typescript
import { BaseExerciseAnalyzer } from './base-exercise-analyzer';

export class YourNewExerciseAnalyzer extends BaseExerciseAnalyzer {
  analyze(landmarks: Landmark[]): AnalyzerResult {
    // Implement your exercise logic
  }
}
```

### 3. Register in Factory

Update `src/services/exercises/exercise-factory.ts`:

```typescript
import { YourNewExerciseAnalyzer } from './your-new-exercise-analyzer';

// Add to createAnalyzer function
case 'your_new_exercise':
  return new YourNewExerciseAnalyzer(side);
```

### 4. Add Exercise Rules

In `src/hooks/useExercises.ts`, add rules for your exercise:

```typescript
const EXERCISE_RULES: Record<ExerciseMode, ExerciseRules> = {
  // ... existing exercises
  your_new_exercise: {
    targetSets: 3,
    minRepsPerSet: 10,
    maxRepsPerSet: 20,
    restBetweenSets: 45,
    formThreshold: 70,
  },
};
```

### 5. Update UI

Add your exercise to the selection UI in `src/pages/ExerciseSession.tsx`.

## MediaPipe Integration

### Pose Detection Setup

```typescript
// Initialize pose detector
const detector = await PoseLandmarker.createFromOptions(filesetResolver, {
  baseOptions: {
    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    delegate: 'GPU'
  },
  runningMode: 'VIDEO',
  numPoses: 1,
  minPoseDetectionConfidence: 0.5,
  minPosePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  outputSegmentationMasks: false
});
```

### Landmark Processing

```typescript
// Extract pose landmarks
const detection = detector.detectForVideo(video, timestamp);
const landmarks = detection.landmarks[0]; // First detected pose

// Calculate joint angles  
const angle = calculateAngle(landmarks[hip], landmarks[knee], landmarks[ankle]);
```

## Testing

### Unit Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode for development
```

### Test Structure

```
src/
├── test/
│   ├── setup.ts         # Test configuration
│   └── example.test.ts  # Example tests
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Debugging

### Browser DevTools

- **React DevTools** - Component debugging
- **Network Tab** - API request monitoring  
- **Console** - Application logs and errors
- **Performance Tab** - Performance profiling

### Common Debug Points

```typescript
// Pose detection debugging
console.log('Landmarks detected:', landmarks?.length || 0);
console.log('Pose confidence:', detection.confidence);

// Exercise analysis debugging  
console.log('Current state:', analyzer.currentState);
console.log('Rep count:', result.correct);
console.log('Form feedback:', result.feedback);
```

### Performance Monitoring

```typescript
// MediaPipe performance
const start = performance.now();
const result = detector.detectForVideo(video, timestamp);
console.log('Detection time:', performance.now() - start, 'ms');
```

## Common Issues

### Camera Issues
- Ensure HTTPS in production
- Check camera permissions
- Verify getUserMedia support

### MediaPipe Issues
- Check network connectivity for model loading
- Verify browser WebGL support
- Monitor memory usage

### Build Issues
- Clear node_modules and reinstall if needed
- Check TypeScript compilation
- Verify all imports are correct

## Code Conventions

### File Naming
- Components: PascalCase (e.g., `ExerciseSession.tsx`)
- Hooks: camelCase starting with 'use' (e.g., `useExerciseSession.ts`)
- Utilities: camelCase (e.g., `exercise-geometry.ts`)
- Types: PascalCase (e.g., `ExerciseMode`)

### Import Organization
```typescript
// 1. External libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal components and hooks
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// 3. Types and utilities
import type { ExerciseMode } from '@/hooks/useExercises';
import { calculateAngle } from '@/utils/exercise-geometry';
```

### TypeScript Guidelines
- Use strict typing (avoid `any`)
- Define interfaces for all data structures  
- Use type guards for runtime type checking
- Prefer `unknown` over `any` for error handling