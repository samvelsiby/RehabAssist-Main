import { useCallback, useRef, useEffect } from 'react';

export function useVoiceAssistant(enabled: boolean = true) {
    const lastFeedbackRef = useRef<string>('');
    const lastCorrectRef = useRef<number>(-1);
    const isSpeakingRef = useRef(false);
    const queueRef = useRef<Array<{ text: string; priority: boolean }>>([]);

    const flushQueue = useCallback(() => {
        if (!('speechSynthesis' in window)) return;
        if (isSpeakingRef.current || queueRef.current.length === 0) return;

        const next = queueRef.current.shift()!;
        const utter = new SpeechSynthesisUtterance(next.text);
        utter.rate = 1.05;
        utter.pitch = 1.0;
        utter.volume = 1.0;

        // Pick a clear voice if available
        const voices = speechSynthesis.getVoices();
        const preferred = voices.find(v =>
            v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural'))
        ) ?? voices.find(v => v.lang.startsWith('en'));
        if (preferred) utter.voice = preferred;

        utter.onstart = () => { isSpeakingRef.current = true; };
        utter.onend = () => { isSpeakingRef.current = false; setTimeout(flushQueue, 120); };
        utter.onerror = () => { isSpeakingRef.current = false; };

        speechSynthesis.speak(utter);
    }, []);

    const enqueue = useCallback((text: string, priority = false) => {
        if (!enabled || !('speechSynthesis' in window)) return;
        if (priority) {
            speechSynthesis.cancel();
            isSpeakingRef.current = false;
            queueRef.current = [{ text, priority }];
        } else {
            // Avoid exact duplicates back-to-back
            const last = queueRef.current[queueRef.current.length - 1];
            if (last?.text === text) return;
            queueRef.current.push({ text, priority });
        }
        flushQueue();
    }, [enabled, flushQueue]);

    // Announce live feedback (debounced – only speaks when message changes)
    const announceFeedback = useCallback((messages: string[]) => {
        if (!enabled || messages.length === 0) return;
        const key = messages[0]; // announce the first/most important feedback
        if (key === lastFeedbackRef.current) return;
        if (key === 'Good form!' || key === 'Waiting for pose…') return; // suppress noise
        lastFeedbackRef.current = key;
        enqueue(key);
    }, [enabled, enqueue]);

    // Announce rep count milestones
    const announceRep = useCallback((correct: number, targetReps: number) => {
        if (!enabled || correct === lastCorrectRef.current) return;
        lastCorrectRef.current = correct;
        if (correct === 0) return;
        if (correct === targetReps) {
            enqueue(`Great work! ${correct} reps. Set complete!`, true);
        } else if (correct % 5 === 0) {
            enqueue(`${correct} reps!`);
        } else if (correct === 1) {
            enqueue('Good rep! Keep going.');
        }
    }, [enabled, enqueue]);

    // One-shot priority announcement
    const announce = useCallback((text: string) => {
        enqueue(text, true);
    }, [enqueue]);

    const cancel = useCallback(() => {
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        queueRef.current = [];
        isSpeakingRef.current = false;
    }, []);

    // Clean up on unmount
    useEffect(() => () => cancel(), [cancel]);

    return { announce, announceFeedback, announceRep, cancel };
}
