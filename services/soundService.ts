
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
     * Professional UI Tick
     * High-fidelity 'glass touch' sound. Sharp, clean, and extremely responsive.
     */
    playClick() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.audioCtx || !this.masterGain) return;

        const time = this.audioCtx.currentTime;

        // High-frequency Transient (Pointy click)
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3200, time);
        osc.frequency.exponentialRampToValueAtTime(1600, time + 0.02);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        // Mid-frequency Body (Soft impact)
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(800, time);
        osc2.frequency.exponentialRampToValueAtTime(400, time + 0.04);
        gain2.gain.setValueAtTime(0.05, time);
        gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.03);
        osc2.start(time);
        osc2.stop(time + 0.05);
    }

    /**
     * Success Luxe Chime
     * Harmonic pentatonic sequence for rewarding confirmations.
     */
    playSuccess() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.audioCtx || !this.masterGain) return;

        const time = this.audioCtx.currentTime;
        // G Major Pentatonic: G5, B5, D6, G6
        const notes = [783.99, 987.77, 1174.66, 1567.98];

        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time + i * 0.04);

            gain.gain.setValueAtTime(0, time + i * 0.04);
            gain.gain.linearRampToValueAtTime(0.08, time + i * 0.04 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.04 + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(time + i * 0.04);
            osc.stop(time + i * 0.04 + 0.5);
        });
    }

    /**
     * Professional Notification
     * Soft double-pulse for incoming messages or kitchen alerts.
     */
    playNotification() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.audioCtx || !this.masterGain) return;

        const time = this.audioCtx.currentTime;
        [1200, 1200].forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time + i * 0.12);

            gain.gain.setValueAtTime(0, time + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.1, time + i * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.12 + 0.2);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(time + i * 0.12);
            osc.stop(time + i * 0.12 + 0.3);
        });
    }

    /**
     * Minimal Error Thud
     * A subdued but clear dissonant warning.
     */
    playError() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.audioCtx || !this.masterGain) return;

        const time = this.audioCtx.currentTime;
        const freqs = [150, 220]; // Low frequency thud

        freqs.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.start(time);
            osc.stop(time + 0.4);
        });
    }
}

export const soundService = new SoundService();
