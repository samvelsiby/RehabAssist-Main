/**
 * useGeminiCoach
 * Uses Gemini 2.0 Flash to generate intelligent, contextual physiotherapy
 * coaching advice at key session events (set complete, form tip, session done).
 *
 * Requires VITE_GEMINI_API_KEY in .env.local
 *
 * Architecture:
 *   Gemini generates coaching TEXT  →  browser speechSynthesis speaks it
 *   (not using Gemini Live streaming Audio - kept simple & reliable)
 */
import { useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// System-level instructions baked into every request
const SYSTEM_INSTRUCTION = `You are a friendly, experienced physiotherapy exercise coach.
Your responses will be spoken aloud to a patient doing rehabilitation exercises.
Rules:
- Maximum 2 sentences, ideally 1.
- Spoken language only — no bullet points, markdown, emojis, or special characters.
- Be specific, positive, and clinically appropriate.
- If accuracy is high (>= 85%), focus on encouragement.
- If accuracy is lower, give ONE clear form cue.
- Never say "great job" twice in a row — vary your language.`;

export interface GeminiCoachOptions {
    // called when Gemini has generated text — pass this to your TTS speak function
    onCoach: (text: string) => void;
    // Gemini coaching enabled? (e.g. user toggled voice off)
    enabled?: boolean;
}

export function useGeminiCoach({ onCoach, enabled = true }: GeminiCoachOptions) {
    const isGenerating = useRef(false);
    const lastFormIssue = useRef('');

    const genAI = useRef<GoogleGenerativeAI | null>(
        API_KEY ? new GoogleGenerativeAI(API_KEY) : null
    );

    const isEnabled = enabled && !!API_KEY;

    // ── Core Gemini call ──────────────────────────────────────────────────────
    const generate = useCallback(async (prompt: string) => {
        if (!genAI.current || !isEnabled || isGenerating.current) return;
        isGenerating.current = true;
        try {
            const model = genAI.current.getGenerativeModel({
                model: 'gemini-2.0-flash',
                systemInstruction: SYSTEM_INSTRUCTION,
            });
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim().replace(/[*_`#]/g, '');
            if (text) onCoach(text);
        } catch (err) {
            console.warn('[GeminiCoach] API error:', err);
            // Graceful fallback — don't crash if API key is invalid or network fails
        } finally {
            isGenerating.current = false;
        }
    }, [isEnabled, onCoach]);

    // ── Public coaching triggers ──────────────────────────────────────────────

    /**
     * Called when a set is completed.
     * Gemini gives encouragement + 1 form tip based on accuracy.
     */
    const coachSetComplete = useCallback((params: {
        setNumber: number;
        totalSets: number;
        correctReps: number;
        incorrectReps: number;
        exerciseName: string;
        formIssues: string[];  // feedback messages from the analyzer this set
    }) => {
        const { setNumber, totalSets, correctReps, incorrectReps, exerciseName, formIssues } = params;
        const totalReps = correctReps + incorrectReps;
        const accuracy = totalReps > 0 ? Math.round((correctReps / totalReps) * 100) : 100;
        const issueNote = formIssues.length > 0 ? `Common issue this set: "${formIssues[0]}".` : '';
        const restInfo = setNumber < totalSets ? `They have ${totalSets - setNumber} sets remaining.` : '';

        generate(
            `Exercise: ${exerciseName}. Set ${setNumber} of ${totalSets} completed. ` +
            `${correctReps} correct reps, ${incorrectReps} incorrect, ${accuracy}% accuracy. ` +
            `${issueNote} ${restInfo} Give 1-2 sentence coaching response.`
        );
    }, [generate]);

    /**
     * Called when a persistent form issue is detected (throttled — only when the
     * issue changes so Gemini isn't hammered on every frame).
     */
    const coachFormIssue = useCallback((issue: string, exerciseName: string) => {
        if (!issue || issue === lastFormIssue.current) return;
        if (issue === 'Good form!' || issue === 'Waiting for pose…') return;
        lastFormIssue.current = issue;

        generate(
            `Exercise: ${exerciseName}. The patient has a form issue: "${issue}". ` +
            `Give 1 brief, clear coaching cue to fix it.`
        );
    }, [generate]);

    /**
     * Called when all sets are done — final motivational summary.
     */
    const coachSessionComplete = useCallback((params: {
        totalSets: number;
        totalCorrect: number;
        totalReps: number;
        exerciseName: string;
    }) => {
        const { totalSets, totalCorrect, totalReps, exerciseName } = params;
        const accuracy = totalReps > 0 ? Math.round((totalCorrect / totalReps) * 100) : 100;

        generate(
            `Exercise: ${exerciseName}. Session complete! ${totalSets} sets done. ` +
            `${totalCorrect} of ${totalReps} total reps were correct (${accuracy}% accuracy). ` +
            `Give a motivating 1-2 sentence closing summary.`
        );
    }, [generate]);

    return {
        coachSetComplete,
        coachFormIssue,
        coachSessionComplete,
        isEnabled,
        isApiKeyMissing: !API_KEY,
    };
}
