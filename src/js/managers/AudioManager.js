// Audio system for managing sound effects and music
import { CONFIG } from '../config.js';

export class AudioManager {
    constructor(engine) {
        this.engine = engine;
        this.sounds = new Map();
        this.music = new Map();
        this.currentMusic = null;
        this.currentMusicLoop = null;
        
        // Volume settings
        this.masterVolume = 1.0;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        
        // Audio context
        this.context = null;
        
        // Gain nodes
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        
        // Audio mappings
        this.soundEffects = CONFIG.AUDIO.SFX;
        this.musicTracks = CONFIG.AUDIO.MUSIC;
        
        // Base paths
        this.musicPath = CONFIG.ASSETS.AUDIO.MUSIC_PATH;
        this.sfxPath = CONFIG.ASSETS.AUDIO.SFX_PATH;
        
        // Loading state
        this.isInitialized = false;
        this.loadingPromise = null;
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Create audio context
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes
            this.masterGain = this.context.createGain();
            this.musicGain = this.context.createGain();
            this.sfxGain = this.context.createGain();
            
            // Connect gain nodes
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.context.destination);
            
            // Update initial volumes
            this.updateVolumes();
            
            // Start loading common sounds
            await this.preloadSounds();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
            throw error;
        }
    }
    
    async preloadSounds() {
        if (!this.context) throw new Error('Audio context not initialized');
        
        try {
            // Track loading progress
            let loadedCount = 0;
            const commonSfx = ['hit', 'select', 'menu-move', 'menu-select'];
            const commonMusic = ['menu', 'battle'];
            const totalCount = commonSfx.length + commonMusic.length;
            
            // Create loading promises
            const loadingPromises = [];
            
            // Load common sound effects
            for (const id of commonSfx) {
                const filename = this.soundEffects[id];
                if (filename) {
                    const promise = this.loadSound(id, this.sfxPath + filename).then(() => {
                        loadedCount++;
                        if (this.engine && this.engine.updateLoadingProgress) {
                            this.engine.updateLoadingProgress('audio', loadedCount / totalCount * 100);
                        }
                    });
                    loadingPromises.push(promise);
                }
            }
            
            // Load common music tracks
            for (const id of commonMusic) {
                const filename = this.musicTracks[id];
                if (filename) {
                    const promise = this.loadMusic(id, this.musicPath + filename).then(() => {
                        loadedCount++;
                        if (this.engine && this.engine.updateLoadingProgress) {
                            this.engine.updateLoadingProgress('audio', loadedCount / totalCount * 100);
                        }
                    });
                    loadingPromises.push(promise);
                }
            }
            
            // Wait for all loads to complete
            await Promise.all(loadingPromises);
            
        } catch (error) {
            console.error('Failed to preload audio:', error);
            throw error;
        }
    }
    
    async loadSound(id, path) {
        try {
            if (!this.sounds.has(id)) {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                this.sounds.set(id, audioBuffer);
            }
        } catch (error) {
            console.error(`Failed to load sound: ${id}`, error);
        }
    }
    
    async loadMusic(id, path) {
        try {
            if (!this.music.has(id)) {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                this.music.set(id, audioBuffer);
            }
        } catch (error) {
            console.error(`Failed to load music: ${id}`, error);
        }
    }
    
    async playSound(id, options = {}) {
        if (!this.context || !this.isInitialized) {
            console.warn('Audio system not initialized');
            return;
        }
        
        try {
            let buffer = this.sounds.get(id);
            
            // If not loaded, try to load it
            if (!buffer) {
                const filename = this.soundEffects[id];
                if (filename) {
                    await this.loadSound(id, this.sfxPath + filename);
                    buffer = this.sounds.get(id);
                }
            }
            
            if (!buffer) {
                console.warn(`Sound not found: ${id}`);
                return;
            }
            
            // Create source
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            
            // Create gain node for this sound
            const gainNode = this.context.createGain();
            gainNode.gain.value = options.volume !== undefined ? options.volume : 1;
            
            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(this.sfxGain);
            
            // Start playback
            source.start(0);
            
            return source;
            
        } catch (error) {
            console.error(`Failed to play sound: ${id}`, error);
        }
        
        if (!buffer) {
            console.warn(`Sound not found: ${id}`);
            return;
        }
        
        // Create source node
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.sfxGain);
        source.start(0);
    }
    
    async playMusic(id, options = { loop: true, fadeIn: 0, fadeOut: 0, volume: 1 }) {
        if (!this.context || !this.isInitialized) {
            console.warn('Audio system not initialized');
            return;
        }
        
        try {
            let buffer = this.music.get(id);
            
            // If not loaded, try to load it
            if (!buffer) {
                const filename = this.musicTracks[id];
                if (filename) {
                    await this.loadMusic(id, this.musicPath + filename);
                    buffer = this.music.get(id);
                }
            }
            
            if (!buffer) {
                console.warn(`Music not found: ${id}`);
                return;
            }
            
            // Handle fade out of current music
            if (this.currentMusic && options.fadeOut > 0) {
                const currentGain = this.currentMusic.gainNode.gain;
                currentGain.linearRampToValueAtTime(0, this.context.currentTime + options.fadeOut);
                setTimeout(() => {
                    if (this.currentMusic) {
                        this.currentMusic.source.stop();
                        this.currentMusic = null;
                    }
                }, options.fadeOut * 1000);
            } else if (this.currentMusic) {
                this.currentMusic.source.stop();
                this.currentMusic = null;
            }
            
            // Create new music nodes
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.loop = options.loop;
            
            const gainNode = this.context.createGain();
            const initialVolume = options.fadeIn > 0 ? 0 : (options.volume || 1);
            gainNode.gain.setValueAtTime(initialVolume, this.context.currentTime);
            
            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(this.musicGain);
            
            // Handle fade in
            if (options.fadeIn > 0) {
                gainNode.gain.linearRampToValueAtTime(
                    options.volume || 1,
                    this.context.currentTime + options.fadeIn
                );
            }
            
            // Start playback
            source.start(0);
            
            // Store current music
            this.currentMusic = {
                source: source,
                gainNode: gainNode,
                id: id,
                options: options
            };
            
            // Handle non-looping music ending
            if (!options.loop) {
                source.onended = () => {
                    this.currentMusic = null;
                };
            }
            
            return this.currentMusic;
            
        } catch (error) {
            console.error(`Failed to play music: ${id}`, error);
        }
    }
    
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
            this.currentMusicId = null;
        }
    }
    
    updateVolumes(options = { smooth: true }) {
        if (!this.context || !this.isInitialized) return;
        
        const currentTime = this.context.currentTime;
        const duration = options.smooth ? 0.1 : 0;
        
        // Update master volume
        const masterVolume = this.masterVolume;
        if (options.smooth) {
            this.masterGain.gain.linearRampToValueAtTime(masterVolume, currentTime + duration);
        } else {
            this.masterGain.gain.setValueAtTime(masterVolume, currentTime);
        }
        
        // Update music volume
        const musicVolume = this.musicVolume;
        if (options.smooth) {
            this.musicGain.gain.linearRampToValueAtTime(musicVolume, currentTime + duration);
        } else {
            this.musicGain.gain.setValueAtTime(musicVolume, currentTime);
        }
        
        // Update SFX volume
        const sfxVolume = this.sfxVolume;
        if (options.smooth) {
            this.sfxGain.gain.linearRampToValueAtTime(sfxVolume, currentTime + duration);
        } else {
            this.sfxGain.gain.setValueAtTime(sfxVolume, currentTime);
        }
        
        // Save to local storage
        try {
            localStorage.setItem('audio_settings', JSON.stringify({
                master: this.masterVolume,
                music: this.musicVolume,
                sfx: this.sfxVolume,
                muted: this.isMuted
            }));
        } catch (e) {
            console.warn('Failed to save audio settings:', e);
        }
    }
    
    fadeOutMusic(duration = 1.0) {
        if (!this.currentMusic || !this.currentMusic.gainNode) return;
        
        const currentTime = this.context.currentTime;
        this.currentMusic.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
        
        setTimeout(() => {
            if (this.currentMusic && this.currentMusic.source) {
                this.currentMusic.source.stop();
                this.currentMusic = null;
            }
        }, duration * 1000);
    }
    
    fadeInMusic(duration = 1.0) {
        if (!this.currentMusic || !this.currentMusic.gainNode) return;
        
        const currentTime = this.context.currentTime;
        const targetVolume = this.currentMusic.options.volume || 1;
        
        this.currentMusic.gainNode.gain.setValueAtTime(0, currentTime);
        this.currentMusic.gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration);
    }
    
    setMasterVolume(value) {
        if (typeof value !== 'number' || isNaN(value)) return;
        this.masterVolume = Math.max(0, Math.min(1, value));
        this.updateVolumes();
    }
    
    setMusicVolume(value) {
        if (typeof value !== 'number' || isNaN(value)) return;
        this.musicVolume = Math.max(0, Math.min(1, value));
        this.updateVolumes();
    }
    
    setSFXVolume(value) {
        if (typeof value !== 'number' || isNaN(value)) return;
        this.sfxVolume = Math.max(0, Math.min(1, value));
        this.updateVolumes();
    }
    
    stopMusic(options = { fadeOut: 0 }) {
        if (!this.currentMusic) return;
        
        if (options.fadeOut > 0) {
            this.fadeOutMusic(options.fadeOut);
        } else {
            this.currentMusic.source.stop();
            this.currentMusic = null;
        }
    }
    
    mute() {
        this.previousVolume = this.masterVolume;
        this.isMuted = true;
        this.setMasterVolume(0);
    }
    
    unmute() {
        if (this.previousVolume !== undefined) {
            this.isMuted = false;
            this.setMasterVolume(this.previousVolume);
            this.previousVolume = undefined;
        }
    }
    
    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
    }
    
    getMasterVolume() {
        return this.masterVolume;
    }
    
    getMusicVolume() {
        return this.musicVolume;
    }
    
    getSFXVolume() {
        return this.sfxVolume;
    }
    
    isMuted() {
        return this.isMuted;
    }
    
    getCurrentMusic() {
        return this.currentMusic ? this.currentMusic.id : null;
    }
}