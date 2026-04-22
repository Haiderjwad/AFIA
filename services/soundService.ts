
/**
 * UI Sound Service for Al-Afia POS
 * Provides professional, crisp, synthesized sound effects for high-end user interactions.
 * Uses Web Audio API for zero-latency, high-performance execution.
 */
import { AppSettings } from '../types';

class SoundService {
    private audioCtx: AudioContext | null = null;
    private enabled: boolean = true;
    private masterGain: GainNode | null = null;

    constructor() { }

    private initContext() {
        if (!this.audioCtx) {
            try {
                this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                this.masterGain = this.audioCtx.createGain();
                this.masterGain.connect(this.audioCtx.destination);
                this.masterGain.gain.value = 0.4;
            } catch (e) {
                console.error("AudioContext initialization failed", e);
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    setEnabled(val: boolean) {
        this.enabled = val;
    }

    setSettings(settings: AppSettings) {
        this.enabled = settings.enableSounds;
    }

    /**
     * Professional UI Tick/Beep
     * A sharp, clean, high-fidelity sound for fast interactions.
     */
    playClick() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.audioCtx || !this.masterGain) return;

        const time = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Dual Tone for "Premium" feel
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, time);
        osc.frequency.exponentialRampToValueAtTime(600, time + 0.08);

        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2400, time);
        osc2.frequency.exponentialRampToValueAtTime(1200, time + 0.05);

        gain2.gain.setValueAtTime(0.05, time);
        gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.1);
        osc2.start(time);
        osc2.stop(time + 0.1);
    }

    /**
     * Success Chime
     * Upward melodic sequence (C5 -> E5 -> G5)
     */
    playSuccess() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.audioCtx || !this.masterGain) return;

        const time = this.audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time + i * 0.08);

            gain.gain.setValueAtTime(0, time + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.1, time + i * 0.08 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.08 + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(time + i * 0.08);
            osc.stop(time + i * 0.08 + 0.4);
        });
    }

    /**
     * Error Warning
     * Dissident low-frequency pulses
     */
    playError() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.audioCtx || !this.masterGain) return;

        const time = this.audioCtx.currentTime;
        [180, 140].forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time + i * 0.15);

            gain.gain.setValueAtTime(0.08, time + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.15 + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(time + i * 0.15);
            osc.stop(time + i * 0.15 + 0.4);
        });
    }
}

export const soundService = new SoundService();
