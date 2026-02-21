# RehabAssist

A modern rehabilitation exercise analysis platform that uses MediaPipe pose detection for real-time form feedback and automated rep counting.

## Overview

RehabAssist is a web-based physiotherapy application that provides:
- Real-time exercise form analysis using computer vision
- Automated repetition counting
- Patient-physiotherapist management system
- Progress tracking and session logging
- Voice feedback for exercise guidance

## Features

### 🎯 Exercise Analysis
- **Real-time pose detection** using MediaPipe
- **Form scoring** with immediate feedback
- **Automatic rep counting** for multiple exercise types
- **Live skeleton visualization** overlaid on camera feed

### 🏥 Patient Management
- **Physio-client relationship** management
- **Exercise assignment** system
- **Progress tracking** with detailed analytics
- **Session logging** and history

### 💪 Supported Exercises
- **Mini Squats** - Lower body strength training
- **Heel Raises** - Calf strengthening
- **Hamstring Curls** - Posterior chain development

## Technology Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Pose Detection:** MediaPipe Tasks Vision
- **Database:** Supabase (PostgreSQL)
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router
- **Charts:** Recharts
- **Notifications:** Sonner

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd RehabAssist-Main
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ui/            # shadcn/ui component library
│   └── DashboardLayout.tsx
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── hooks/             # Custom React hooks
│   ├── useExercises.ts
│   ├── useExerciseSession.ts
│   ├── usePoseAnalysis.ts
│   └── ...
├── integrations/      # External service integrations
│   └── supabase/
├── pages/             # Page components
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── ExerciseSession.tsx
│   └── ...
├── services/          # Business logic services
│   ├── exercises/     # Exercise analysis engines
│   └── mediapipe/     # MediaPipe integration
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── config/           # Configuration files
```

## Key Components

### Exercise Session Flow
1. **Camera Initialization** - Access user camera
2. **Pose Detection** - Initialize MediaPipe pose estimation
3. **Exercise Analysis** - Real-time form scoring
4. **Rep Counting** - Automatic repetition detection
5. **Progress Logging** - Session data storage

### User Roles
- **Clients/Patients** - Perform assigned exercises
- **Physiotherapists** - Assign exercises and monitor progress

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Testing
```bash
npm test
```

### Code Quality
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is private and proprietary.