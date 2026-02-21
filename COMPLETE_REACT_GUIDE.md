# RehabAssist - Complete React Implementation Guide

## Project Overview

RehabAssist is a TypeScript-based fitness training application that uses MediaPipe Pose detection to analyze exercise form for three exercises: squats, hamstring curls, and heel raises. The app provides real-time feedback, counts correct/incorrect repetitions, and displays exercise demonstrations.

## Current Architecture

### Core Components

**1. Exercise Analyzers** (`src/core/`)
- `SquatAnalyzer` - Analyzes squat form using hip-knee angles and state transitions
- `HamstringCurlAnalyzer` - Tracks hamstring curl phases and alignment
- `HeelRaiseAnalyzer` - Monitors heel raise movements and toe drive

**2. Geometry Utilities** (`src/utils/geometry.ts`)
- `angleBetweenPoints()` - Calculates angles between three points
- `angleWithVertical()` - Measures angles relative to vertical axis
- `pixelPoint()` - Converts MediaPipe normalized coordinates to pixel coordinates

**3. UI Components**
- `DemoAnimator` - Canvas-based exercise demonstration animations
- Main app logic in `main.ts` handling camera, MediaPipe integration, and UI updates

**4. Data Models** (`src/types/common.ts`)
```typescript
interface AnalyzerResult {
  state: string | null;
  angles: Angles;
  metricsText: string;
  feedback: string[];
  correct: number;
  incorrect: number;
}

interface ExerciseAnalyzer {
  processNoPose(): AnalyzerResult;
  process(landmarks: PoseLandmark[], frameWidth: number, frameHeight: number, side: Side): AnalyzerResult;
}
```

### Key Features

**Real-time Analysis**
- MediaPipe Pose landmark detection
- Exercise-specific form analysis
- Live feedback generation
- Repetition counting (correct/incorrect)

**Exercise Support**
- **Squats**: 3-state system (s1, s2, s3) with angle thresholds
- **Hamstring Curls**: Phase-based tracking (extended, mid, curl)
- **Heel Raises**: Body rise and toe drive detection

**Configuration System**
- Customizable thresholds for each exercise
- Adjustable detection sensitivity
- Exercise-specific feedback rules

## Configuration Values and Thresholds

### Squat Thresholds
```typescript
export const STATE_THRESH = {
  s1Max: 40.0,        // Maximum angle for standing state
  s2Min: 30.0,        // Minimum angle for mid-squat
  s2Max: 78.0,        // Maximum angle for mid-squat
  s3Min: 79.0,        // Minimum angle for deep squat
  s3Max: 125.0        // Maximum angle for deep squat
} as const;

export const FEEDBACK_THRESH = {
  torsoForwardMin: 15.0,      // Minimum forward lean angle
  torsoBackwardMax: 55.0,     // Maximum backward lean angle
  lowerHipMin: 55.0,          // Minimum hip angle for "lower hips" feedback
  lowerHipMax: 90.0,          // Maximum hip angle for "lower hips" feedback
  kneeOverToeMax: 42.0,       // Maximum knee-ankle angle before "knee over toes"
  tooDeepMin: 130.0           // Minimum angle considered "too deep"
} as const;

export const OFFSET_THRESH = 45.0;      // Maximum offset angle for side-on detection
export const INACTIVE_THRESH_SEC = 15;  // Seconds before resetting counters
```

### Hamstring Curl Thresholds
```typescript
const ALIGN_HEEL_MAX_LEG_RATIO = 0.45;  // Max heel-knee distance ratio for alignment
const ALIGN_TOE_MAX_LEG_RATIO = 0.7;    // Max toe-knee distance ratio for alignment
const MIN_REP_ANGLE_DELTA = 12;         // Minimum angle change for valid rep
const MIN_CURL_FRAMES = 2;              // Minimum frames at curl peak

// Curl phase angle thresholds
function getCurlPhase(kneeAngle: number): CurlPhase {
  if (kneeAngle < 138) return "curl";      // Fully curled position
  if (kneeAngle > 160) return "extended";  // Extended position
  return "mid";                            // Mid-range position
}
```

### Heel Raise Thresholds
```typescript
// Dynamic thresholds based on frame height
const riseThreshold = frameHeight * 0.009;      // 0.9% of frame height
const lowerThreshold = frameHeight * 0.004;     // 0.4% of frame height  
const toeFlexThreshold = frameHeight * 0.003;   // 0.3% of frame height
const heelLiftThreshold = frameHeight * 0.006;  // 0.6% of frame height
```

## MediaPipe Landmark Indices

```typescript
const LANDMARK = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_TOE: 31,
  RIGHT_TOE: 32
} as const;
```

## React Implementation Strategy

### 1. Project Structure
```
src/
├── components/
│   ├── ExerciseAnalyzer/
│   │   ├── ExerciseAnalyzer.tsx
│   │   ├── VideoCanvas.tsx
│   │   ├── ControlPanel.tsx
│   │   ├── StatsDisplay.tsx
│   │   ├── MetricsDisplay.tsx
│   │   ├── FeedbackDisplay.tsx
│   │   └── DemoAnimation.tsx
│   └── common/
├── hooks/
│   ├── useMediaPipe.ts
│   ├── useCamera.ts
│   ├── useExerciseAnalyzer.ts
│   └── useCanvasAnimation.ts
├── analyzers/
│   ├── SquatAnalyzer.ts
│   ├── HamstringCurlAnalyzer.ts
│   ├── HeelRaiseAnalyzer.ts
│   └── BaseAnalyzer.ts
├── utils/
│   ├── geometry.ts
│   ├── mediapipe.ts
│   └── constants.ts
├── types/
│   └── index.ts
└── styles/
```

### 2. Types and Interfaces

```typescript
// types/index.ts
export type Side = "left" | "right";
export type SquatState = "s1" | "s2" | "s3";
export type ExerciseType = "squat" | "hamstring_curl" | "heel_raise";

export interface Point {
  x: number;
  y: number;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface Angles {
  torso: number;
  hipKnee: number;
  kneeAnkle: number;
}

export interface AnalyzerResult {
  state: string | null;
  angles: Angles;
  metricsText: string;
  feedback: string[];
  correct: number;
  incorrect: number;
}

export interface ExerciseAnalyzer {
  processNoPose(): AnalyzerResult;
  process(
    landmarks: PoseLandmark[],
    frameWidth: number,
    frameHeight: number,
    side: Side
  ): AnalyzerResult;
}
```

### 3. Geometry Utilities

```typescript
// utils/geometry.ts
import type { Point, PoseLandmark } from '../types';

export function angleBetweenPoints(p1: Point, p2: Point, pref: Point): number {
  const v1x = p1.x - pref.x;
  const v1y = p1.y - pref.y;
  const v2x = p2.x - pref.x;
  const v2y = p2.y - pref.y;

  const n1 = Math.hypot(v1x, v1y);
  const n2 = Math.hypot(v2x, v2y);
  const denom = n1 * n2;
  
  if (denom < 1e-6) {
    return 0.0;
  }

  let cosine = (v1x * v2x + v1y * v2y) / denom;
  cosine = Math.min(1.0, Math.max(-1.0, cosine));
  return (Math.acos(cosine) * 180) / Math.PI;
}

export function angleWithVertical(top: Point, pivot: Point, frameHeight: number): number {
  const verticalPoint: Point = {
    x: pivot.x,
    y: pivot.y > frameHeight / 2 ? 0 : frameHeight
  };
  return angleBetweenPoints(top, verticalPoint, pivot);
}

export function pixelPoint(
  landmarks: PoseLandmark[],
  index: number,
  width: number,
  height: number
): Point {
  return {
    x: landmarks[index].x * width,
    y: landmarks[index].y * height
  };
}
```

### 4. Squat Analyzer Implementation

```typescript
// analyzers/SquatAnalyzer.ts
import { angleBetweenPoints, angleWithVertical, pixelPoint } from '../utils/geometry';
import type { AnalyzerResult, ExerciseAnalyzer, PoseLandmark, Side, SquatState } from '../types';

// Threshold values
const STATE_THRESH = {
  s1Max: 40.0,
  s2Min: 30.0,
  s2Max: 78.0,
  s3Min: 79.0,
  s3Max: 125.0
} as const;

const FEEDBACK_THRESH = {
  torsoForwardMin: 15.0,
  torsoBackwardMax: 55.0,
  lowerHipMin: 55.0,
  lowerHipMax: 90.0,
  kneeOverToeMax: 42.0,
  tooDeepMin: 130.0
} as const;

const OFFSET_THRESH = 45.0;
const INACTIVE_THRESH_SEC = 15;

const LANDMARK = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28
} as const;

function nowSec(): number {
  return performance.now() / 1000;
}

function isValidRepSequence(seq: SquatState[]): boolean {
  const validShallow = seq.length === 1 && seq[0] === "s2";
  const validShort = seq.length === 2 && seq[0] === "s2" && seq[1] === "s3";
  const validLong = seq.length === 3 && seq[0] === "s2" && seq[1] === "s3" && seq[2] === "s2";
  return validShallow || validShort || validLong;
}

export class SquatAnalyzer implements ExerciseAnalyzer {
  private correct = 0;
  private incorrect = 0;
  private prevState: SquatState | null = null;
  private stateSequence: SquatState[] = [];
  private severeFlag = false;
  private inactiveSince: number | null = null;

  private getState(hipKneeAngle: number): SquatState | null {
    if (hipKneeAngle <= STATE_THRESH.s1Max) return "s1";
    if (hipKneeAngle >= STATE_THRESH.s2Min && hipKneeAngle <= STATE_THRESH.s2Max) return "s2";
    if (hipKneeAngle >= STATE_THRESH.s3Min && hipKneeAngle <= STATE_THRESH.s3Max) return "s3";
    return null;
  }

  private updateSequence(currentState: SquatState | null): void {
    if (!currentState || !["s2", "s3"].includes(currentState) || currentState === this.prevState) {
      return;
    }

    if (currentState === "s2") {
      if (this.stateSequence.length === 0 || this.stateSequence[this.stateSequence.length - 1] !== "s2") {
        this.stateSequence.push("s2");
      }
      return;
    }

    if (currentState === "s3") {
      if (this.stateSequence.includes("s2") && this.stateSequence.length === 1) {
        this.stateSequence.push("s3");
      }
    }
  }

  private maybeResetForInactivity(): void {
    const now = nowSec();
    if (this.inactiveSince === null) {
      this.inactiveSince = now;
      return;
    }

    if (now - this.inactiveSince >= INACTIVE_THRESH_SEC) {
      this.correct = 0;
      this.incorrect = 0;
      this.prevState = null;
      this.stateSequence = [];
      this.severeFlag = false;
      this.inactiveSince = now;
    }
  }

  processNoPose(): AnalyzerResult {
    this.maybeResetForInactivity();
    return {
      state: null,
      angles: { torso: 0, hipKnee: 0, kneeAnkle: 0 },
      metricsText: "Torso: 0.0 | Hip-Knee: 0.0 | Knee-Ankle: 0.0",
      feedback: ["No pose detected"],
      correct: this.correct,
      incorrect: this.incorrect
    };
  }

  process(
    landmarks: PoseLandmark[],
    frameWidth: number,
    frameHeight: number,
    side: Side = "left"
  ): AnalyzerResult {
    this.inactiveSince = null;

    const sideIsRight = side === "right";
    const shoulderIdx = sideIsRight ? LANDMARK.RIGHT_SHOULDER : LANDMARK.LEFT_SHOULDER;
    const hipIdx = sideIsRight ? LANDMARK.RIGHT_HIP : LANDMARK.LEFT_HIP;
    const kneeIdx = sideIsRight ? LANDMARK.RIGHT_KNEE : LANDMARK.LEFT_KNEE;
    const ankleIdx = sideIsRight ? LANDMARK.RIGHT_ANKLE : LANDMARK.LEFT_ANKLE;

    const nose = pixelPoint(landmarks, LANDMARK.NOSE, frameWidth, frameHeight);
    const leftShoulder = pixelPoint(landmarks, LANDMARK.LEFT_SHOULDER, frameWidth, frameHeight);
    const rightShoulder = pixelPoint(landmarks, LANDMARK.RIGHT_SHOULDER, frameWidth, frameHeight);

    // Check if user is facing side-on to camera
    const offsetAngle = angleBetweenPoints(leftShoulder, rightShoulder, nose);
    if (offsetAngle > OFFSET_THRESH) {
      this.maybeResetForInactivity();
      return {
        state: null,
        angles: { torso: 0, hipKnee: 0, kneeAnkle: 0 },
        metricsText: "Torso: 0.0 | Hip-Knee: 0.0 | Knee-Ankle: 0.0",
        feedback: ["Turn side-on to camera"],
        correct: this.correct,
        incorrect: this.incorrect
      };
    }

    const shoulder = pixelPoint(landmarks, shoulderIdx, frameWidth, frameHeight);
    const hip = pixelPoint(landmarks, hipIdx, frameWidth, frameHeight);
    const knee = pixelPoint(landmarks, kneeIdx, frameWidth, frameHeight);
    const ankle = pixelPoint(landmarks, ankleIdx, frameWidth, frameHeight);

    const torsoAngle = angleWithVertical(shoulder, hip, frameHeight);
    const hipKneeAngle = angleWithVertical(hip, knee, frameHeight);
    const kneeAnkleAngle = angleWithVertical(knee, ankle, frameHeight);

    const currentState = this.getState(hipKneeAngle);
    this.updateSequence(currentState);

    const feedback: string[] = [];

    // Hip positioning feedback
    if (this.prevState === "s1" && currentState === "s2") {
      if (hipKneeAngle >= FEEDBACK_THRESH.lowerHipMin && hipKneeAngle <= FEEDBACK_THRESH.lowerHipMax) {
        feedback.push("Lower your hips");
      }
    }

    // Torso angle feedback
    if (torsoAngle < FEEDBACK_THRESH.torsoForwardMin) {
      feedback.push("Bend forward slightly");
    } else if (torsoAngle > FEEDBACK_THRESH.torsoBackwardMax) {
      feedback.push("Bend backwards less");
    }

    // Knee position feedback
    if (kneeAnkleAngle > FEEDBACK_THRESH.kneeOverToeMax) {
      feedback.push("Knee over toes");
      this.severeFlag = true;
    }

    // Depth feedback
    if (hipKneeAngle > FEEDBACK_THRESH.tooDeepMin) {
      feedback.push("Too deep");
      this.severeFlag = true;
    }

    // Rep counting logic
    if (currentState === "s1" && this.prevState && ["s2", "s3"].includes(this.prevState)) {
      if (isValidRepSequence(this.stateSequence) && !this.severeFlag) {
        this.correct += 1;
      } else {
        this.incorrect += 1;
      }
      this.stateSequence = [];
      this.severeFlag = false;
    }

    this.prevState = currentState;

    return {
      state: currentState,
      angles: { torso: torsoAngle, hipKnee: hipKneeAngle, kneeAnkle: kneeAnkleAngle },
      metricsText: `Torso: ${torsoAngle.toFixed(1)} | Hip-Knee: ${hipKneeAngle.toFixed(1)} | Knee-Ankle: ${kneeAnkleAngle.toFixed(1)}`,
      feedback,
      correct: this.correct,
      incorrect: this.incorrect
    };
  }
}
```

### 5. Hamstring Curl Analyzer Implementation

```typescript
// analyzers/HamstringCurlAnalyzer.ts
import { angleBetweenPoints, pixelPoint } from '../utils/geometry';
import type { AnalyzerResult, ExerciseAnalyzer, PoseLandmark, Side } from '../types';

// Threshold values
const ALIGN_HEEL_MAX_LEG_RATIO = 0.45;
const ALIGN_TOE_MAX_LEG_RATIO = 0.7;
const MIN_REP_ANGLE_DELTA = 12;
const MIN_CURL_FRAMES = 2;

const LANDMARK = {
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_TOE: 31,
  RIGHT_TOE: 32
} as const;

type CurlPhase = "extended" | "mid" | "curl";

function getCurlPhase(kneeAngle: number): CurlPhase {
  if (kneeAngle < 138) return "curl";
  if (kneeAngle > 160) return "extended";
  return "mid";
}

export class HamstringCurlAnalyzer implements ExerciseAnalyzer {
  private correct = 0;
  private incorrect = 0;
  private prevPhase: CurlPhase = "extended";
  private repActive = false;
  private repStartKneeAngle = 180;
  private repMinKneeAngle = 180;
  private repCurlFrames = 0;
  private repSawPeak = false;
  private repSawAlignedAtPeak = false;

  processNoPose(): AnalyzerResult {
    return {
      state: null,
      angles: { torso: 0, hipKnee: 0, kneeAnkle: 0 },
      metricsText: "Knee flex: 0.0 | Heel-Knee X: 0.0 | Toe-Knee X: 0.0",
      feedback: ["No pose detected"],
      correct: this.correct,
      incorrect: this.incorrect
    };
  }

  process(
    landmarks: PoseLandmark[],
    frameWidth: number,
    frameHeight: number,
    side: Side
  ): AnalyzerResult {
    // Get all landmark points
    const leftHip = pixelPoint(landmarks, LANDMARK.LEFT_HIP, frameWidth, frameHeight);
    const rightHip = pixelPoint(landmarks, LANDMARK.RIGHT_HIP, frameWidth, frameHeight);
    const leftKnee = pixelPoint(landmarks, LANDMARK.LEFT_KNEE, frameWidth, frameHeight);
    const rightKnee = pixelPoint(landmarks, LANDMARK.RIGHT_KNEE, frameWidth, frameHeight);
    const leftAnkle = pixelPoint(landmarks, LANDMARK.LEFT_ANKLE, frameWidth, frameHeight);
    const rightAnkle = pixelPoint(landmarks, LANDMARK.RIGHT_ANKLE, frameWidth, frameHeight);
    const leftToe = pixelPoint(landmarks, LANDMARK.LEFT_TOE, frameWidth, frameHeight);
    const rightToe = pixelPoint(landmarks, LANDMARK.RIGHT_TOE, frameWidth, frameHeight);

    // Calculate knee angles
    const leftKneeAngle = angleBetweenPoints(leftHip, leftAnkle, leftKnee);
    const rightKneeAngle = angleBetweenPoints(rightHip, rightAnkle, rightKnee);

    const leftFlex = 180 - leftKneeAngle;
    const rightFlex = 180 - rightKneeAngle;

    // Determine which leg is being curled
    let useRight = rightFlex > leftFlex;
    if (Math.abs(rightFlex - leftFlex) < 8) {
      useRight = side === "right";
    }

    const activeKnee = useRight ? rightKnee : leftKnee;
    const activeAnkle = useRight ? rightAnkle : leftAnkle;
    const activeToe = useRight ? rightToe : leftToe;
    const activeKneeAngle = useRight ? rightKneeAngle : leftKneeAngle;
    const activeFlex = 180 - activeKneeAngle;

    // Calculate alignment metrics
    const shankLen = Math.max(1, Math.hypot(activeAnkle.x - activeKnee.x, activeAnkle.y - activeKnee.y));
    const heelKneeXNorm = Math.abs(activeAnkle.x - activeKnee.x) / frameWidth;
    const toeKneeXNorm = Math.abs(activeToe.x - activeKnee.x) / frameWidth;
    const heelKneeXLegRatio = Math.abs(activeAnkle.x - activeKnee.x) / shankLen;
    const toeKneeXLegRatio = Math.abs(activeToe.x - activeKnee.x) / shankLen;
    
    const alignmentGood = 
      heelKneeXLegRatio <= ALIGN_HEEL_MAX_LEG_RATIO && 
      toeKneeXLegRatio <= ALIGN_TOE_MAX_LEG_RATIO;

    const phase = getCurlPhase(activeKneeAngle);

    // Rep detection logic
    if (!this.repActive && this.prevPhase === "extended" && phase !== "extended") {
      this.repActive = true;
      this.repStartKneeAngle = activeKneeAngle;
      this.repMinKneeAngle = activeKneeAngle;
      this.repCurlFrames = 0;
      this.repSawPeak = false;
      this.repSawAlignedAtPeak = false;
    }

    if (this.repActive) {
      this.repMinKneeAngle = Math.min(this.repMinKneeAngle, activeKneeAngle);
    }

    if (this.repActive && phase === "curl") {
      this.repSawPeak = true;
      this.repCurlFrames += 1;
      if (alignmentGood) {
        this.repSawAlignedAtPeak = true;
      }
    }

    // Rep completion logic
    if (phase === "extended" && this.repActive && this.prevPhase !== "extended") {
      const repAngleDelta = this.repStartKneeAngle - this.repMinKneeAngle;
      const goodRep = 
        this.repSawPeak && 
        this.repSawAlignedAtPeak && 
        this.repCurlFrames >= MIN_CURL_FRAMES && 
        repAngleDelta >= MIN_REP_ANGLE_DELTA;
      const likelyAttempt = this.repSawPeak || repAngleDelta >= MIN_REP_ANGLE_DELTA * 0.7;

      if (goodRep) {
        this.correct += 1;
      } else if (likelyAttempt) {
        this.incorrect += 1;
      }

      // Reset rep tracking
      this.repActive = false;
      this.repStartKneeAngle = 180;
      this.repMinKneeAngle = 180;
      this.repCurlFrames = 0;
      this.repSawPeak = false;
      this.repSawAlignedAtPeak = false;
    }

    // Generate feedback
    const feedback: string[] = [];
    if (phase === "curl") {
      if (alignmentGood) {
        feedback.push("Good alignment at curl peak");
      } else {
        feedback.push("Bring heel and toe in line with knee");
      }
    } else if (phase === "extended") {
      feedback.push("Curl your heel toward your glute");
    } else {
      feedback.push("Finish the curl, then return to full extension");
    }

    if (this.repActive && phase !== "extended") {
      const repAngleDelta = this.repStartKneeAngle - this.repMinKneeAngle;
      if (repAngleDelta < MIN_REP_ANGLE_DELTA) {
        feedback.push("Curl higher before returning down");
      }
    }

    this.prevPhase = phase;

    return {
      state: phase,
      angles: {
        torso: activeFlex,
        hipKnee: heelKneeXNorm * 100,
        kneeAnkle: toeKneeXNorm * 100
      },
      metricsText: `Knee flex: ${activeFlex.toFixed(1)} | Heel-Knee X: ${(heelKneeXNorm * 100).toFixed(1)}% | Toe-Knee X: ${(toeKneeXNorm * 100).toFixed(1)}%`,
      feedback,
      correct: this.correct,
      incorrect: this.incorrect
    };
  }
}
```

### 6. Heel Raise Analyzer Implementation

```typescript
// analyzers/HeelRaiseAnalyzer.ts
import { pixelPoint } from '../utils/geometry';
import type { AnalyzerResult, ExerciseAnalyzer, PoseLandmark, Side } from '../types';

const LANDMARK = {
  NOSE: 0,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_TOE: 31,
  RIGHT_TOE: 32
} as const;

type RaisePhase = "lowered" | "rising";

export class HeelRaiseAnalyzer implements ExerciseAnalyzer {
  private correct = 0;
  private incorrect = 0;
  private prevPhase: RaisePhase = "lowered";
  private repActive = false;
  private repSawToeDrive = false;
  private repPeakLift = 0;
  private repRisingFrames = 0;
  private baselineNoseY: number | null = null;
  private baselineToeDelta: number | null = null;

  processNoPose(): AnalyzerResult {
    return {
      state: null,
      angles: { torso: 0, hipKnee: 0, kneeAnkle: 0 },
      metricsText: "Head rise: 0.0px | Toe flex: 0.0px | Heel lift: 0.0px",
      feedback: ["No pose detected"],
      correct: this.correct,
      incorrect: this.incorrect
    };
  }

  process(
    landmarks: PoseLandmark[],
    frameWidth: number,
    frameHeight: number,
    _side: Side
  ): AnalyzerResult {
    // Get landmark points
    const nose = pixelPoint(landmarks, LANDMARK.NOSE, frameWidth, frameHeight);
    const leftAnkle = pixelPoint(landmarks, LANDMARK.LEFT_ANKLE, frameWidth, frameHeight);
    const rightAnkle = pixelPoint(landmarks, LANDMARK.RIGHT_ANKLE, frameWidth, frameHeight);
    const leftHeel = pixelPoint(landmarks, LANDMARK.LEFT_HEEL, frameWidth, frameHeight);
    const rightHeel = pixelPoint(landmarks, LANDMARK.RIGHT_HEEL, frameWidth, frameHeight);
    const leftToe = pixelPoint(landmarks, LANDMARK.LEFT_TOE, frameWidth, frameHeight);
    const rightToe = pixelPoint(landmarks, LANDMARK.RIGHT_TOE, frameWidth, frameHeight);

    // Calculate averages
    const meanAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
    const meanToeY = (leftToe.y + rightToe.y) / 2;
    const meanHeelY = (leftHeel.y + rightHeel.y) / 2;

    const toeDelta = meanToeY - meanAnkleY;
    const heelLift = meanToeY - meanHeelY;

    // Initialize baselines
    if (this.baselineNoseY === null || this.baselineToeDelta === null) {
      this.baselineNoseY = nose.y;
      this.baselineToeDelta = toeDelta;
    }

    const headRise = (this.baselineNoseY ?? nose.y) - nose.y;
    const toeFlexDelta = toeDelta - (this.baselineToeDelta ?? toeDelta);

    // Dynamic thresholds based on frame size
    const riseThreshold = frameHeight * 0.009;      // 0.9% of frame height
    const lowerThreshold = frameHeight * 0.004;     // 0.4% of frame height
    const toeFlexThreshold = frameHeight * 0.003;   // 0.3% of frame height
    const heelLiftThreshold = frameHeight * 0.006;  // 0.6% of frame height

    const isRising = headRise > riseThreshold || heelLift > heelLiftThreshold;
    const isLowered = headRise < lowerThreshold && heelLift < heelLiftThreshold * 0.6;
    const toeDrive = toeFlexDelta > toeFlexThreshold || heelLift > heelLiftThreshold;

    const phase: RaisePhase = isRising ? "rising" : "lowered";

    // Rep start detection
    if (phase === "rising" && this.prevPhase === "lowered") {
      this.repActive = true;
      this.repSawToeDrive = false;
      this.repPeakLift = 0;
      this.repRisingFrames = 0;
    }

    // Track rep progress
    if (this.repActive && phase === "rising") {
      this.repRisingFrames += 1;
      this.repPeakLift = Math.max(this.repPeakLift, headRise);
      if (toeDrive) {
        this.repSawToeDrive = true;
      }
    }

    // Rep completion detection
    if (phase === "lowered" && this.repActive && this.prevPhase === "rising") {
      const reachedHeight = this.repPeakLift >= riseThreshold;
      const sustained = this.repRisingFrames >= 2;
      const likelyAttempt = reachedHeight || this.repRisingFrames >= 2;
      
      if (reachedHeight && sustained && this.repSawToeDrive) {
        this.correct += 1;
      } else if (likelyAttempt) {
        this.incorrect += 1;
      }

      this.repActive = false;
      this.repSawToeDrive = false;
      this.repPeakLift = 0;
      this.repRisingFrames = 0;
    }

    // Update baselines only while lowered
    if (isLowered) {
      this.baselineNoseY = (this.baselineNoseY ?? nose.y) * 0.92 + nose.y * 0.08;
      this.baselineToeDelta = (this.baselineToeDelta ?? toeDelta) * 0.9 + toeDelta * 0.1;
    }

    // Generate feedback
    const feedback: string[] = [];
    if (phase === "rising") {
      if (!toeDrive) {
        feedback.push("Drive through your toes as you rise");
      } else {
        feedback.push("Good toe drive");
      }
      if (headRise < riseThreshold * 1.15) {
        feedback.push("Rise a little taller");
      }
    } else {
      feedback.push("Lift up onto your toes");
    }

    this.prevPhase = phase;

    return {
      state: phase,
      angles: {
        torso: headRise,
        hipKnee: toeFlexDelta,
        kneeAnkle: heelLift
      },
      metricsText: `Head rise: ${headRise.toFixed(1)}px | Toe flex: ${toeFlexDelta.toFixed(1)}px | Heel lift: ${heelLift.toFixed(1)}px`,
      feedback,
      correct: this.correct,
      incorrect: this.incorrect
    };
  }
}
```

## React Component Architecture

### 7. Main Container Component

```typescript
// components/ExerciseAnalyzer/ExerciseAnalyzer.tsx
import React, { useState, useCallback } from 'react';
import { VideoCanvas } from './VideoCanvas';
import { ControlPanel } from './ControlPanel';
import { StatsDisplay } from './StatsDisplay';
import { MetricsDisplay } from './MetricsDisplay';
import { FeedbackDisplay } from './FeedbackDisplay';
import { DemoAnimation } from './DemoAnimation';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import { useCamera } from '../../hooks/useCamera';
import { useExerciseAnalyzer } from '../../hooks/useExerciseAnalyzer';
import type { ExerciseType, Side, AnalyzerResult } from '../../types';

interface ExerciseAnalyzerProps {
  onResults?: (result: AnalyzerResult) => void;
}

export const ExerciseAnalyzer: React.FC<ExerciseAnalyzerProps> = ({ onResults }) => {
  const [exerciseType, setExerciseType] = useState<ExerciseType>('squat');
  const [side, setSide] = useState<Side>('left');
  const [analysisResult, setAnalysisResult] = useState<AnalyzerResult | null>(null);
  
  const { pose, isInitialized } = useMediaPipe();
  const { videoRef, canvasRef, isStreaming, startCamera, stopCamera } = useCamera();
  const { processFrame } = useExerciseAnalyzer(exerciseType);

  const handlePoseResults = useCallback((results: any) => {
    if (!canvasRef.current) return;
    
    const result = processFrame(
      results.poseLandmarks,
      canvasRef.current.width,
      canvasRef.current.height,
      side
    );
    
    setAnalysisResult(result);
    onResults?.(result);
  }, [processFrame, side, onResults]);

  return (
    <div className="exercise-analyzer">
      <div className="header">
        <h1>Exercise Analyzer</h1>
        <p>MediaPipe Pose feedback for squats, hamstring curls, and heel raises</p>
      </div>
      
      <div className="layout">
        <VideoCanvas 
          videoRef={videoRef}
          canvasRef={canvasRef}
          analysisResult={analysisResult}
          exerciseType={exerciseType}
        />
        
        <div className="panel">
          <ControlPanel
            exerciseType={exerciseType}
            side={side}
            isStreaming={isStreaming}
            onExerciseChange={setExerciseType}
            onSideChange={setSide}
            onStartCamera={startCamera}
            onStopCamera={stopCamera}
          />
          
          <StatsDisplay result={analysisResult} />
          <MetricsDisplay result={analysisResult} />
          <DemoAnimation exerciseType={exerciseType} />
          <FeedbackDisplay result={analysisResult} />
        </div>
      </div>
    </div>
  );
};
```

### 8. Custom Hooks

**useMediaPipe Hook**
```typescript
// hooks/useMediaPipe.ts
import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

export const useMediaPipe = () => {
  const [pose, setPose] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const onResultsRef = useRef<((results: any) => void) | null>(null);

  useEffect(() => {
    const initializeMediaPipe = async () => {
      if (!window.Pose) {
        console.error('MediaPipe Pose not loaded');
        return;
      }

      const poseInstance = new window.Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      poseInstance.onResults((results: any) => {
        onResultsRef.current?.(results);
      });

      setPose(poseInstance);
      setIsInitialized(true);
    };

    initializeMediaPipe();
  }, []);

  const setOnResults = (callback: (results: any) => void) => {
    onResultsRef.current = callback;
  };

  return { pose, isInitialized, setOnResults };
};
```

**useCamera Hook**
```typescript
// hooks/useCamera.ts
import { useState, useRef, useCallback } from 'react';

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [camera, setCamera] = useState<any>(null);

  const startCamera = useCallback(async (pose: any) => {
    if (!videoRef.current || !window.Camera) return;

    try {
      const cameraInstance = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await pose.send({ image: videoRef.current });
          }
        },
        width: 960,
        height: 540
      });

      await cameraInstance.start();
      setCamera(cameraInstance);
      setIsStreaming(true);
    } catch (error) {
      console.error('Camera failed to start:', error);
      setIsStreaming(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (camera) {
      camera.stop();
      setCamera(null);
      setIsStreaming(false);
    }
  }, [camera]);

  return { videoRef, canvasRef, isStreaming, startCamera, stopCamera };
};
```

**useExerciseAnalyzer Hook**
```typescript
// hooks/useExerciseAnalyzer.ts
import { useState, useCallback, useMemo } from 'react';
import { SquatAnalyzer } from '../analyzers/SquatAnalyzer';
import { HamstringCurlAnalyzer } from '../analyzers/HamstringCurlAnalyzer';
import { HeelRaiseAnalyzer } from '../analyzers/HeelRaiseAnalyzer';
import type { ExerciseType, AnalyzerResult, PoseLandmark, Side } from '../types';

export const useExerciseAnalyzer = (exerciseType: ExerciseType) => {
  const analyzer = useMemo(() => {
    switch (exerciseType) {
      case 'squat': return new SquatAnalyzer();
      case 'hamstring_curl': return new HamstringCurlAnalyzer();
      case 'heel_raise': return new HeelRaiseAnalyzer();
      default: return new SquatAnalyzer();
    }
  }, [exerciseType]);

  const [result, setResult] = useState<AnalyzerResult | null>(null);

  const processFrame = useCallback((
    landmarks: PoseLandmark[] | null,
    frameWidth: number,
    frameHeight: number,
    side: Side
  ) => {
    const analysisResult = landmarks && landmarks.length > 0
      ? analyzer.process(landmarks, frameWidth, frameHeight, side)
      : analyzer.processNoPose();
    
    setResult(analysisResult);
    return analysisResult;
  }, [analyzer]);

  const resetAnalyzer = useCallback(() => {
    setResult(null);
  }, []);

  return { analyzer, result, processFrame, resetAnalyzer };
};
```

### 9. VideoCanvas Component

```typescript
// components/ExerciseAnalyzer/VideoCanvas.tsx
import React, { useEffect, useRef } from 'react';
import type { AnalyzerResult, ExerciseType } from '../../types';

interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  analysisResult: AnalyzerResult | null;
  exerciseType: ExerciseType;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({ 
  videoRef, 
  canvasRef, 
  analysisResult, 
  exerciseType 
}) => {
  const drawCanvasText = (ctx: CanvasRenderingContext2D, result: AnalyzerResult) => {
    ctx.fillStyle = "#f5f5f5";
    ctx.font = "18px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText(`Exercise: ${exerciseType}`, 16, 30);
    ctx.fillText(`State: ${result.state ?? "-"}`, 16, 56);
    ctx.fillStyle = "#7dff7d";
    ctx.fillText(`Correct: ${result.correct}`, 16, 84);
    ctx.fillStyle = "#ff8f8f";
    ctx.fillText(`Incorrect: ${result.incorrect}`, 16, 112);

    const messages = result.feedback.length ? result.feedback : ["Form looks stable"];
    ctx.fillStyle = "#ffd36b";
    messages.slice(0, 3).forEach((message, index) => {
      ctx.fillText(message, 16, 146 + index * 24);
    });
  };

  useEffect(() => {
    if (!canvasRef.current || !analysisResult) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    drawCanvasText(ctx, analysisResult);
  }, [analysisResult, canvasRef, exerciseType]);

  return (
    <div className="video-card">
      <div className="video-wrap">
        <video ref={videoRef} style={{ display: 'none' }} playsInline />
        <canvas ref={canvasRef} className="output-canvas" />
      </div>
    </div>
  );
};
```

### 10. Key Dependencies

**Required NPM Packages**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@mediapipe/camera_utils": "^0.3.1640029074",
    "@mediapipe/drawing_utils": "^0.3.1620248257", 
    "@mediapipe/pose": "^0.5.1675469404"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^4.0.0"
  }
}
```

### 11. MediaPipe Configuration

```typescript
// MediaPipe Pose initialization with exact values from original code
const poseConfig = {
  locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
  modelComplexity: 1,                    // Model complexity (0, 1, or 2)
  smoothLandmarks: true,                 // Enable landmark smoothing
  minDetectionConfidence: 0.5,           // Minimum confidence for pose detection
  minTrackingConfidence: 0.5             // Minimum confidence for pose tracking
};

// Camera configuration
const cameraConfig = {
  width: 960,                            // Camera resolution width
  height: 540                            // Camera resolution height
};
```

### 12. State Management

**Context Provider for Global State**
```typescript
// context/ExerciseContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ExerciseType, Side, AnalyzerResult } from '../types';

interface ExerciseContextType {
  exerciseType: ExerciseType;
  side: Side;
  analysisResult: AnalyzerResult | null;
  isAnalyzing: boolean;
  setExerciseType: (type: ExerciseType) => void;
  setSide: (side: Side) => void;
  setAnalysisResult: (result: AnalyzerResult | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

export const ExerciseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [exerciseType, setExerciseType] = useState<ExerciseType>('squat');
  const [side, setSide] = useState<Side>('left');
  const [analysisResult, setAnalysisResult] = useState<AnalyzerResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const value: ExerciseContextType = {
    exerciseType,
    side,
    analysisResult,
    isAnalyzing,
    setExerciseType,
    setSide,
    setAnalysisResult,
    setIsAnalyzing
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
};

export const useExerciseContext = (): ExerciseContextType => {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExerciseContext must be used within ExerciseProvider');
  }
  return context;
};
```

## Migration Steps

### Phase 1: Core Setup
1. Create React app with TypeScript and Vite
2. Install MediaPipe dependencies
3. Set up basic component structure
4. Migrate type definitions

### Phase 2: Business Logic
1. Port analyzer classes to React-compatible format
2. Create custom hooks for MediaPipe integration
3. Implement state management
4. Migrate geometry utilities

### Phase 3: UI Components
1. Convert HTML structure to React components
2. Migrate CSS to CSS modules or styled-components
3. Implement canvas-based video overlay
4. Create demo animation component

### Phase 4: Integration
1. Connect MediaPipe pose detection
2. Integrate camera functionality
3. Wire up real-time analysis
4. Add error handling and loading states

## React-Specific Considerations

### Performance Optimizations
- Use `useCallback` for MediaPipe callbacks to prevent re-renders
- Implement `useMemo` for expensive calculations
- Consider `React.memo` for components that render frequently
- Use refs for canvas manipulation to avoid re-renders

### Canvas Integration
```typescript
const VideoCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { drawPose, drawMetrics } = useCanvasDrawing(canvasRef);
  
  useEffect(() => {
    // Canvas drawing logic
  }, [analysisResult]);
  
  return <canvas ref={canvasRef} />;
};
```

### MediaPipe Integration
- Handle MediaPipe lifecycle in useEffect
- Manage camera permissions and error states
- Implement proper cleanup on component unmount

## Key Implementation Notes

1. **Angle Calculations**: All angles are in degrees, calculated using dot product and converted from radians
2. **Coordinate System**: MediaPipe returns normalized coordinates (0-1), converted to pixels for calculations
3. **Rep Validation**: Each exercise has specific sequences and thresholds for valid repetitions
4. **Feedback Logic**: Real-time feedback based on form analysis with exercise-specific rules
5. **Side Detection**: Automatic detection of which side is being analyzed, with manual override
6. **Baseline Tracking**: Dynamic baseline adjustment for heel raises to account for camera position
7. **Inactivity Reset**: 15-second timeout resets counters for squats to handle camera interruptions

## Additional React Features to Consider

### Enhanced UI Components
- Exercise selection with thumbnails
- Settings panel for threshold adjustments
- Progress tracking and session history
- Exercise instructions and tutorials

### State Persistence
- Local storage for user preferences
- Session data persistence
- Exercise history tracking

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Reduced motion preferences

## Testing Strategy

### Unit Tests
- Test analyzer logic with mock pose data
- Test geometry utility functions
- Test custom hooks in isolation

### Integration Tests
- Test component interactions
- Test MediaPipe integration
- Test camera functionality

### E2E Tests
- Full exercise analysis workflow
- Camera permission handling
- Error state management

## Deployment Considerations

### Build Configuration
- Ensure MediaPipe assets are properly bundled
- Configure Vite for optimal MediaPipe loading
- Handle camera permissions in different environments

### Performance
- Implement code splitting for analyzer modules
- Optimize MediaPipe model loading
- Consider Web Workers for intensive calculations

This comprehensive guide provides everything needed to implement the RehabAssist exercise analyzer in a React application while maintaining the core functionality and improving the user experience through React's component-based architecture.