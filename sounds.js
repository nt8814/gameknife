class SoundManager {
    constructor() {
        // Инициализируем аудио контекст
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Создаем основной регулятор громкости
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        
        // Создаем отдельные регуляторы для эффектов и музыки
        this.effectsGain = this.audioContext.createGain();
        this.musicGain = this.audioContext.createGain();
        
        this.effectsGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        
        // Устанавливаем начальную громкость
        this.masterGain.gain.value = 1.0;
        this.effectsGain.gain.value = 0.7;
        this.musicGain.gain.value = 0.5;
        
        // Кэш для звуков
        this.sounds = new Map();
        this.music = new Map();
        
        // Текущая музыка
        this.currentMusic = null;
        
        // Загружаем звуки
        this.loadSounds();
    }

    async loadSounds() {
        try {
            // Загружаем звуковые эффекты
            const soundEffects = {
                'fire-throw': 'sounds/fire-throw.mp3',
                'ice-throw': 'sounds/ice-throw.mp3',
                'poison-throw': 'sounds/poison-throw.mp3',
                'lightning-throw': 'sounds/lightning-throw.mp3',
                'ninja-throw': 'sounds/ninja-throw.mp3',
                'dash': 'sounds/dash.mp3',
                'teleport': 'sounds/teleport.mp3',
                'time-slow': 'sounds/time-slow.mp3',
                'knife-rain': 'sounds/knife-rain.mp3',
                'burn': 'sounds/burn.mp3',
                'freeze': 'sounds/freeze.mp3',
                'poison': 'sounds/poison.mp3',
                'chain-lightning': 'sounds/chain-lightning.mp3',
                'hit': 'sounds/hit.mp3',
                'kill': 'sounds/kill.mp3',
                'powerup': 'sounds/powerup.mp3',
                'achievement': 'sounds/achievement.mp3',
                'level-up': 'sounds/level-up.mp3',
                'game-start': 'sounds/game-start.mp3',
                'game-lose': 'sounds/game-lose.mp3'
            };

            // Загружаем музыку
            const musicTracks = {
                'menu': 'music/menu.mp3',
                'game': 'music/game.mp3',
                'intense': 'music/intense.mp3',
                'victory': 'music/victory.mp3'
            };

            // Функция для загрузки аудио файла
            const loadAudio = async (url) => {
                try {
                    const response = await fetch(url);
                    const arrayBuffer = await response.arrayBuffer();
                    return await this.audioContext.decodeAudioData(arrayBuffer);
                } catch (error) {
                    console.warn(`Failed to load audio: ${url}`, error);
                    return null;
                }
            };

            // Загружаем все звуковые эффекты
            for (const [name, path] of Object.entries(soundEffects)) {
                try {
                    const buffer = await loadAudio(path);
                    if (buffer) {
                        this.sounds.set(name, buffer);
                    }
                } catch (error) {
                    console.warn(`Failed to load sound effect: ${name}`, error);
                }
            }

            // Загружаем всю музыку
            for (const [name, path] of Object.entries(musicTracks)) {
                try {
                    const buffer = await loadAudio(path);
                    if (buffer) {
                        this.music.set(name, buffer);
                    }
                } catch (error) {
                    console.warn(`Failed to load music track: ${name}`, error);
                }
            }

            console.log('Audio loading complete');
        } catch (error) {
            console.error('Error loading sounds:', error);
        }
    }

    playSound(name, options = {}) {
        const buffer = this.sounds.get(name);
        if (!buffer) {
            console.warn(`Sound not found: ${name}`);
            return null;
        }

        try {
            // Создаем источник звука
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;

            // Создаем регулятор громкости для этого звука
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = options.volume || 1;

            // Подключаем к основному регулятору эффектов
            source.connect(gainNode);
            gainNode.connect(this.effectsGain);

            // Настраиваем параметры воспроизведения
            if (options.loop) {
                source.loop = true;
            }
            if (options.playbackRate) {
                source.playbackRate.value = options.playbackRate;
            }

            // Запускаем воспроизведение
            source.start(0);

            // Очищаем ресурсы после окончания воспроизведения
            source.onended = () => {
                source.disconnect();
                gainNode.disconnect();
            };

            return source;
        } catch (error) {
            console.error(`Error playing sound ${name}:`, error);
            return null;
        }
    }

    playMusic(name, fadeInTime = 2) {
        const buffer = this.music.get(name);
        if (!buffer) {
            console.warn(`Music track not found: ${name}`);
            return;
        }

        try {
            // Останавливаем текущую музыку
            if (this.currentMusic) {
                this.stopMusic();
            }

            // Создаем новый источник музыки
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            // Создаем регулятор громкости для плавного перехода
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0;

            // Подключаем к основному регулятору музыки
            source.connect(gainNode);
            gainNode.connect(this.musicGain);

            // Запускаем воспроизведение
            source.start(0);

            // Плавно увеличиваем громкость
            gainNode.gain.linearRampToValueAtTime(
                1,
                this.audioContext.currentTime + fadeInTime
            );

            // Сохраняем текущую музыку
            this.currentMusic = {
                source,
                gainNode
            };
        } catch (error) {
            console.error(`Error playing music ${name}:`, error);
        }
    }

    stopMusic(fadeOutTime = 2) {
        if (!this.currentMusic) return;

        try {
            const { source, gainNode } = this.currentMusic;

            // Плавно уменьшаем громкость
            gainNode.gain.linearRampToValueAtTime(
                0,
                this.audioContext.currentTime + fadeOutTime
            );

            // Останавливаем воспроизведение после затухания
            setTimeout(() => {
                source.stop();
                source.disconnect();
                gainNode.disconnect();
            }, fadeOutTime * 1000);

            this.currentMusic = null;
        } catch (error) {
            console.error('Error stopping music:', error);
        }
    }

    setMasterVolume(value) {
        this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }

    setEffectsVolume(value) {
        this.effectsGain.gain.value = Math.max(0, Math.min(1, value));
    }

    setMusicVolume(value) {
        this.musicGain.gain.value = Math.max(0, Math.min(1, value));
    }
}

// Создаем глобальный экземпляр
window.soundManager = new SoundManager();
