/**
 * useVoiceAssistant
 * Robust browser TTS hook that works around Chrome's many speechSynthesis quirks:
 *
 *  1. getVoices() is async — loaded via voiceschanged event
 *  2. Chrome silently kills utterances after ~15s — watchdog timer resets the queue
 *  3. isSpeaking can get stuck — error handler + watchdog always unblock it
 *  4. Chrome requires a prior user gesture — safe to call after any click
 */
import { useCallback, useRef, useEffect } from 'react';

export function useVoiceAssistant(enabled: boolean = true) {
    // ── Voice loading ──────────────────────────────────────────────────────────
    const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
    const isSpeakingRef = useRef(false);
    const queueRef = useRef<Array<{ text: string; priority: boolean }>>([]);
    const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Tracking for rep/feedback dedup
    const lastFeedbackRef = useRef<string>('');
    const lastCorrectRef = useRef<number>(-1);

    // Load voices as soon as they are available
    useEffect(() => {
        if (!('speechSynthesis' in window)) return;

        const loadVoices = () => {
            const v = speechSynthesis.getVoices();
            if (v.length > 0) voicesRef.current = v;
        };

        loadVoices();
        speechSynthesis.addEventListener('voiceschanged', loadVoices);
        return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }, []);

    // ── Queue flush ────────────────────────────────────────────────────────────
    const flushQueue = useCallback(() => {
        if (!('speechSynthesis' in window)) return;
        if (isSpeakingRef.current || queueRef.current.length === 0) return;

        const next = queueRef.current.shift()!;
        const utter = new SpeechSynthesisUtterance(next.text);
        utter.rate = 1.0;
        utter.pitch = 1.0;
        utter.volume = 1.0;

        // Best available English voice
        const voices = voicesRef.current.length > 0 ? voicesRef.current : speechSynthesis.getVoices();
        const preferred =
            voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Google UK') || v.name.includes('Natural') || v.name.includes('Neural'))) ??
            voices.find(v => v.lang === 'en-US') ??
            voices.find(v => v.lang.startsWith('en'));
        if (preferred) utter.voice = preferred;

        const clear = () => {
            isSpeakingRef.current = false;
            if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
        };

        utter.onstart = () => {
            isSpeakingRef.current = true;
            // Watchdog: Chrome sometimes never fires onend — reset after 12s
            watchdogRef.current = setTimeout(() => {
                console.warn('[VoiceAssistant] watchdog fired — resetting queue');
                isSpeakingRef.current = false;
                watchdogRef.current = null;
                flushQueue();
            }, 12_000);
        };

        utter.onend = () => {
            clear();
            setTimeout(flushQueue, 80);
        };

        utter.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                console.warn('[VoiceAssistant] utterance error:', e.error);
            }
            clear();
            setTimeout(flushQueue, 80);
        };

        // Chrome bug: cancel any pending speech first or it may queue internally
        speechSynthesis.cancel();
        // Small delay after cancel so Chrome is ready
        setTimeout(() => speechSynthesis.speak(utter), 50);
    }, []);

    // ── Enqueue ────────────────────────────────────────────────────────────────
    const enqueue = useCallback((text: string, priority = false) => {
        if (!enabled || !('speechSynthesis' in window) || !text.trim()) return;

        if (priority) {
            speechSynthesis.cancel();
            if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
            isSpeakingRef.current = false;
            queueRef.current = [{ text, priority }];
        } else {
            const last = queueRef.current[queueRef.current.length - 1];
            if (last?.text === text) return; // no duplicate back-to-back
            queueRef.current.push({ text, priority });
            // Cap queue to avoid a massive backlog
            if (queueRef.current.length > 4) queueRef.current.splice(0, queueRef.current.length - 4);
        }
        flushQueue();
    }, [enabled, flushQueue]);

    // ── Public API ─────────────────────────────────────────────────────────────

    /** Priority one-shot (clears queue and speaks immediately) */
    const announce = useCallback((text: string) => {
        enqueue(text, true);
    }, [enqueue]);

    /** Speaks real-time feedback — only when message changes, suppresses noise */
    const announceFeedback = useCallback((messages: string[]) => {
        if (!enabled || !messages.length) return;
        const msg = messages[0];
        if (msg === lastFeedbackRef.current) return;
        if (msg === 'Good form!' || msg === 'Waiting for pose…' || msg === 'No pose detected') return;
        lastFeedbackRef.current = msg;
        enqueue(msg);
    }, [enabled, enqueue]);

    /** Speaks rep count at milestones (1st rep, every 5, set complete) */
    const announceRep = useCallback((correct: number, targetReps: number) => {
        if (!enabled || correct === lastCorrectRef.current) return;
        lastCorrectRef.current = correct;
        if (correct === 0) return;

        if (correct === targetReps) {
            enqueue(`${correct} reps! Set done!`, true);
        } else if (correct % 5 === 0) {
            enqueue(`${correct} reps!`);
        } else if (correct === 1) {
            enqueue('Good rep!');
        }
    }, [enabled, enqueue]);

    const cancel = useCallback(() => {
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        queueRef.current = [];
        isSpeakingRef.current = false;
        if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
    }, []);

    // Reset tracking when disabled/enabled switches
    useEffect(() => {
        if (!enabled) cancel();
    }, [enabled, cancel]);

    useEffect(() => () => cancel(), [cancel]);

    return { announce, announceFeedback, announceRep, cancel };
}
