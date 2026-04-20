
import { AppSettings } from '../types';

class SoundService {
    private clickSound: HTMLAudioElement | null = null;
    private settings: AppSettings | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.clickSound = new Audio('https://www.soundjay.com/buttons/button-16.mp3');
            this.clickSound.volume = 0.4;
        }
    }

    setSettings(settings: AppSettings) {
        this.settings = settings;
    }

    playClick() {
        if (!this.settings?.enableSounds || !this.clickSound) return;

        // Reset and play
        this.clickSound.currentTime = 0;
        this.clickSound.play().catch(e => console.log('Sound play blocked:', e));
    }
}

export const soundService = new SoundService();
