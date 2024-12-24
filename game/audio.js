// Audio context
let audioContext;
let backgroundMusic;
let isMusicPlaying = false;

// Initialize audio
function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

// Sound effects
function playHitSound() {
    if (!gameState.settings.sound) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playLevelUpSound() {
    if (!gameState.settings.sound) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
}

function playMenuSound() {
    if (!gameState.settings.sound) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Background music
function playBackgroundMusic() {
    if (!gameState.settings.music || isMusicPlaying) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    backgroundMusic = { oscillator, gainNode };
    isMusicPlaying = true;
}

function stopBackgroundMusic() {
    if (!isMusicPlaying || !backgroundMusic) return;
    
    backgroundMusic.gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    backgroundMusic.oscillator.stop(audioContext.currentTime + 0.1);
    isMusicPlaying = false;
}

// Export functions
export {
    initAudio,
    playHitSound,
    playLevelUpSound,
    playMenuSound,
    playBackgroundMusic,
    stopBackgroundMusic
};
