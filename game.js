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

// Game state
let gameState = {
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
        vibration: true
    }
};

// Game objects
let targets = [];
let particles = [];
let lastSpawnTime = 0;

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const character = document.getElementById('character-sprite');
const levelProgress = document.getElementById('level-progress');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    const now = Date.now();
    
    // Spawn new target
    if (now - lastSpawnTime > (3000 - gameState.skills.speed * 100) && targets.length < 1) {
        targets.push(new Target(canvas, gameState));
        lastSpawnTime = now;
    }
    
    // Update targets
    targets = targets.filter(target => {
        target.update();
        return target.active;
    });
    
    // Update particles
    particles = particles.filter(particle => particle.update());
    
    // Update XP and character
    updateXP();
    updateCharacterAnimation();
}

// Draw game elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw targets
    targets.forEach(target => target.draw(ctx));
    
    // Draw particles
    particles.forEach(particle => particle.draw(ctx));
}

// Handle clicks
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleClick(x, y);
});

// Handle click on target
function handleClick(x, y) {
    let hit = false;
    
    targets = targets.filter(target => {
        const accuracy = target.checkHit(x, y);
        if (accuracy >= 0) {
            hit = true;
            const isCritical = Math.random() < (gameState.skills.critical * 0.05);
            const score = Math.round(accuracy * 100 * gameState.power);
            
            updateScore(score, isCritical);
            updateCombo();
            createHitEffect(x, y, isCritical);
            playHitSound();
            
            if (gameState.settings.vibration) {
                tg.HapticFeedback.impactOccurred('light');
            }
            
            return false;
        }
        return true;
    });
    
    if (!hit) {
        resetCombo();
    }
}

// Update player XP and level
function updateXP() {
    const xpProgress = (gameState.xp / gameState.xpToNextLevel) * 100;
    levelProgress.style.width = `${xpProgress}%`;
    
    if (gameState.xp >= gameState.xpToNextLevel) {
        levelUp();
    }
}

// Level up
function levelUp() {
    gameState.level++;
    gameState.xp -= gameState.xpToNextLevel;
    gameState.xpToNextLevel *= 1.5;
    
    createLevelUpEffect();
    if (gameState.settings.sound) {
        playLevelUpSound();
    }
    if (gameState.settings.vibration) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    document.querySelectorAll('.level-text').forEach(el => {
        el.textContent = `Level ${gameState.level}`;
    });
    
    saveGameState();
}

// Character animation
function updateCharacterAnimation() {
    character.style.transform = `translateY(${Math.sin(Date.now() / 1000) * 5}px)`;
}

// Modal handling
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    const isVisible = !modal.classList.contains('hidden');
    
    document.querySelectorAll('.modal').forEach(m => {
        m.classList.add('hidden');
    });
    
    if (!isVisible) {
        modal.classList.remove('hidden');
        if (gameState.settings.sound) {
            playMenuSound();
        }
    }
}

// Settings handlers
document.getElementById('sound-toggle').addEventListener('change', (e) => {
    gameState.settings.sound = e.target.checked;
    saveGameState();
});

document.getElementById('music-toggle').addEventListener('change', (e) => {
    gameState.settings.music = e.target.checked;
    if (e.target.checked) {
        playBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
    saveGameState();
});

document.getElementById('vibration-toggle').addEventListener('change', (e) => {
    gameState.settings.vibration = e.target.checked;
    saveGameState();
});

// Skills handling
function getSkillUpgradeCost(skillType) {
    const level = gameState.skills[skillType];
    return Math.round(100 * Math.pow(2, level - 1));
}

function upgradeSkill(skillType) {
    const cost = getSkillUpgradeCost(skillType);
    if (gameState.score >= cost) {
        gameState.score -= cost;
        gameState.skills[skillType]++;
        
        document.querySelector(`[data-skill="${skillType}"] .skill-level`)
            .textContent = `Level ${gameState.skills[skillType]}`;
        
        saveGameState();
        updateUI();
    }
}

// Shop handling
function getItemCost(itemType) {
    switch(itemType) {
        case 'power': return 100;
        case 'combo': return 200;
        case 'auto': return 500;
        default: return 0;
    }
}

function purchaseItem(itemType) {
    const cost = getItemCost(itemType);
    if (gameState.score >= cost) {
        gameState.score -= cost;
        
        switch(itemType) {
            case 'power':
                gameState.power++;
                break;
            case 'combo':
                gameState.combo += 0.5;
                break;
            case 'auto':
                startAutoClicker();
                break;
        }
        
        saveGameState();
        updateUI();
    }
}

// Auto clicker
function startAutoClicker() {
    setInterval(() => {
        if (targets.length > 0) {
            const target = targets[0];
            handleClick(target.x, target.y);
        }
    }, 1000);
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('combo').textContent = `x${gameState.combo.toFixed(1)}`;
    document.getElementById('power').textContent = gameState.power;
    
    document.querySelectorAll('.level-text').forEach(el => {
        el.textContent = `Level ${gameState.level}`;
    });
    
    Object.entries(gameState.skills).forEach(([skill, level]) => {
        const el = document.querySelector(`[data-skill="${skill}"] .skill-level`);
        if (el) el.textContent = `Level ${level}`;
    });
}

// Start the game
function initGame() {
    initAudio();
    loadGameState();
    updateUI();
    
    if (gameState.settings.music) {
        playBackgroundMusic();
    }
    
    gameLoop();
}

// Initialize the game
initGame();
