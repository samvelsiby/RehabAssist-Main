import { SquatAnalyzer } from './squat-analyzer';
import type { BaseExerciseAnalyzer } from './base-exercise-analyzer';

export type ExerciseType = 'squat' | 'lunge' | 'pushup' | 'plank';

export class ExerciseFactory {
  static createAnalyzer(exerciseType: ExerciseType | string): BaseExerciseAnalyzer {
    const type = exerciseType.toLowerCase();
    
    // Any exercise containing "squat" uses SquatAnalyzer
    if (type.includes('squat')) {
      return new SquatAnalyzer();
    }
    
    switch (type) {
      case 'squat':
        return new SquatAnalyzer();
      case 'lunge':
        // TODO: Implement LungeAnalyzer
        throw new Error('Lunge analyzer not yet implemented');
      case 'pushup':
        // TODO: Implement PushupAnalyzer
        throw new Error('Pushup analyzer not yet implemented');
      case 'plank':
        // TODO: Implement PlankAnalyzer
        throw new Error('Plank analyzer not yet implemented');
      default:
        throw new Error(`Unsupported exercise type: ${exerciseType}`);
    }
  }

  static getSupportedExercises(): ExerciseType[] {
    return ['squat'];
  }

  static isSupported(exerciseType: string): boolean {
    const type = exerciseType.toLowerCase();
    
    // Support any exercise containing "squat"
    if (type.includes('squat')) return true;
    
    return this.getSupportedExercises().includes(type as ExerciseType);
  }
}