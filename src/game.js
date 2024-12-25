import {
    Target,
    Particle,
    updateScore,
    updateCombo,
    resetCombo,
    createHitEffect,
    createCriticalHitEffect,
    createLevelUpEffect,
    saveGameState,
    loadGameState
} from './game/mechanics.js';

import {
    initAudio,
    playHitSound,
    playLevelUpSound,
    playMenuSound,
    playBackgroundMusic,
    stopBackgroundMusic
} from './game/audio.js';

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Game state
const gameState = {
    score: 0,
    combo: 1,
    power: 1,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    skills: {
        precision: 1,
        speed: 1,
        critical: 1
    },
    settings: {
        sound: true,
        music: true,
        haptic: true
    }
};

// Game objects
let targets = [];
let particles = [];
let lastFrameTime = 0;
let animationFrameId = null;

// Set canvas size
function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

// Initialize canvas
window.addEventListener('load', () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});

// Game loop
function gameLoop(currentTime) {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    if (!lastFrameTime) {
        lastFrameTime = currentTime;
    }
    
    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw targets
    targets = targets.filter(target => {
        target.update();
        if (target.active) {
            target.draw(ctx);
            return true;
        }
        return false;
    });
    
    // Update and draw particles
    particles = particles.filter(particle => {
        particle.update();
        if (particle.alpha > 0) {
            particle.draw(ctx);
            return true;
        }
        return false;
    });
    
    // Spawn new target if needed
    if (targets.length < 3) {
        targets.push(new Target(canvas, gameState));
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Handle canvas click
function handleCanvasClick(event) {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    let hit = false;
    let isCritical = false;
    
    targets.forEach(target => {
        const dx = x - target.x;
        const dy = y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= target.radius) {
            hit = true;
            isCritical = Math.random() < (gameState.skills.critical * 0.1);
            
            // Create effects
            createHitEffect(x, y, isCritical);
            playHitSound();
            
            if (gameState.settings.haptic) {
                tg.HapticFeedback.impactOccurred('light');
            }
            
            // Update score
            updateScore(gameState.power * gameState.combo * (isCritical ? 2 : 1));
            updateCombo();
            
            // Remove target
            target.active = false;
        }
    });
    
    if (!hit) {
        resetCombo();
    }
}

// Initialize UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('combo').textContent = `x${gameState.combo.toFixed(1)}`;
    document.getElementById('power').textContent = gameState.power;
}

// Shop functionality
function toggleShopModal() {
    const modal = document.getElementById('shop-modal');
    if (modal) {
        modal.classList.toggle('hidden');
        playMenuSound();
    }
}

// Event listeners
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const shopBtn = document.getElementById('shop-btn');
    const closeBtn = document.querySelector('.close-button');
    
    if (canvas) {
        canvas.addEventListener('click', handleCanvasClick);
    }
    
    if (shopBtn) {
        shopBtn.addEventListener('click', toggleShopModal);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleShopModal);
    }
});

// Start the game
function initGame() {
    initAudio();
    loadGameState();
    updateUI();
    
    if (gameState.settings.music) {
        playBackgroundMusic();
    }
    
    gameLoop(0);
}

// Initialize the game when DOM is loaded
window.addEventListener('load', initGame);
