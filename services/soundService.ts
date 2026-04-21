
/**
 * UI Sound Service for Al-Afia POS
 * Provides professional, crisp sound effects for user interactions.
 */
import { AppSettings } from '../types';

// A professional, soft "click" or "tap" sound in base64 (MP3/WAV)
// This is a short, subtle UI beep/click.
const CLICK_SOUND_BASE64 = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YV9vT18AZu7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u";
// Just a placeholder, I'll use a helper to play sounds and check settings.

class SoundService {
    private clickAudio: HTMLAudioElement | null = null;
    private successAudio: HTMLAudioElement | null = null;
    private errorAudio: HTMLAudioElement | null = null;
    private enabled: boolean = true;

    constructor() {
        if (typeof window !== 'undefined') {
            // Crisp UI Click
            this.clickAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
            // Success chime
            this.successAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            // Error/Alert
            this.errorAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');

            this.clickAudio.volume = 0.3;
            this.successAudio.volume = 0.4;
            this.errorAudio.volume = 0.4;
        }
    }

    setEnabled(val: boolean) {
        this.enabled = val;
    }

    setSettings(settings: AppSettings) {
        this.enabled = settings.enableSounds;
    }

    playClick() {
        if (!this.enabled || !this.clickAudio) return;
        this.clickAudio.currentTime = 0;
        this.clickAudio.play().catch(() => { });
    }

    playSuccess() {
        if (!this.enabled || !this.successAudio) return;
        this.successAudio.currentTime = 0;
        this.successAudio.play().catch(() => { });
    }

    playError() {
        if (!this.enabled || !this.errorAudio) return;
        this.errorAudio.currentTime = 0;
        this.errorAudio.play().catch(() => { });
    }
}

export const soundService = new SoundService();
