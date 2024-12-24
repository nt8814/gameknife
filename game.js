// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Game Configuration
const config = {
    targetSpawnInterval: 2000,
    targetLifetime: 3000,
    maxTargets: 3,
    baseScore: 100,
    comboDecayTime: 2000,
    particleCount: 10,
    soundEnabled: true,
    hapticEnabled: true,
    particlesEnabled: true
};

// Game State
const state = {
    score: 0,
    combo: 1,
    power: 1,
    lastClickTime: 0,
    targets: [],
    particles: [],
    comboTimeout: null,
    upgrades: {
        power: 1,
        combo: 1,
        auto: 0
    }
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Target Class
class Target {
    constructor() {
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.y = Math.random() * (canvas.height - 100) + 50;
        this.radius = 40;
        this.createdAt = Date.now();
        this.scale = 1;
        this.opacity = 1;
        this.rings = [
            { radius: 40, color: '#FF4136', score: 100 },
            { radius: 30, color: '#FF851B', score: 200 },
            { radius: 20, color: '#FFDC00', score: 300 },
            { radius: 10, color: '#2ECC40', score: 500 }
        ];
    }

    update() {
        const age = Date.now() - this.createdAt;
        const lifePercent = age / config.targetLifetime;
        
        // Pulsing animation
        this.scale = 1 + Math.sin(age * 0.005) * 0.1;
        
        // Fade out near end of life
        if (lifePercent > 0.7) {
            this.opacity = 1 - ((lifePercent - 0.7) / 0.3);
        }

        return age < config.targetLifetime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        // Draw rings from outside in
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const ring = this.rings[i];
            ctx.beginPath();
            ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
            ctx.fillStyle = ring.color;
            ctx.fill();
        }

        ctx.restore();
    }

    hitTest(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Return score based on hit location
        for (let i = 0; i < this.rings.length; i++) {
            if (distance <= this.rings[i].radius * this.scale) {
                return this.rings[i].score;
            }
        }
        return 0;
    }
}

// Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = (Math.random() - 0.5) * 10;
        this.life = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 0.02;
        this.size *= 0.95;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Spawn Target Function
function spawnTarget() {
    if (state.targets.length < config.maxTargets) {
        state.targets.push(new Target());
    }
}

// Start spawning targets
setInterval(spawnTarget, config.targetSpawnInterval);

// Game Loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw targets
    state.targets = state.targets.filter(target => {
        const alive = target.update();
        if (alive) target.draw(ctx);
        return alive;
    });

    // Update and draw particles
    if (config.particlesEnabled) {
        state.particles = state.particles.filter(particle => {
            const alive = particle.update();
            if (alive) particle.draw(ctx);
            return alive;
        });
    }

    requestAnimationFrame(gameLoop);
}

// Click Handling
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let hit = false;
    
    // Check for target hits
    state.targets = state.targets.filter(target => {
        const score = target.hitTest(x, y);
        if (score > 0) {
            hit = true;
            addScore(score);
            createHitEffect(x, y);
            return false;
        }
        return true;
    });

    // Reset combo on miss
    if (!hit) {
        resetCombo();
        if (config.hapticEnabled) {
            tg.HapticFeedback.notificationOccurred('error');
        }
    }
});

// Score and Combo System
function addScore(baseScore) {
    const finalScore = Math.round(baseScore * state.combo * state.power);
    state.score += finalScore;
    updateScoreDisplay();
    
    // Increment combo
    state.combo = Math.min(state.combo + 0.1, state.upgrades.combo * 2);
    updateComboDisplay();
    
    // Reset combo decay timer
    clearTimeout(state.comboTimeout);
    state.comboTimeout = setTimeout(resetCombo, config.comboDecayTime);
    
    if (config.hapticEnabled) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

function resetCombo() {
    state.combo = 1;
    updateComboDisplay();
}

// Visual Effects
function createHitEffect(x, y) {
    // Floating score text
    const scoreText = document.createElement('div');
    scoreText.className = 'floating-text';
    scoreText.style.left = x + 'px';
    scoreText.style.top = y + 'px';
    scoreText.textContent = '+' + Math.round(state.score);
    document.body.appendChild(scoreText);
    
    setTimeout(() => scoreText.remove(), 1000);

    // Particles
    if (config.particlesEnabled) {
        for (let i = 0; i < config.particleCount; i++) {
            state.particles.push(new Particle(x, y, '#FF4136'));
        }
    }
}

// UI Updates
function updateScoreDisplay() {
    document.getElementById('score').textContent = state.score.toLocaleString();
}

function updateComboDisplay() {
    document.getElementById('combo').textContent = 'x' + state.combo.toFixed(1);
}

function updatePowerDisplay() {
    document.getElementById('power').textContent = state.power.toFixed(1);
}

// Shop System
const shopItems = {
    power: {
        name: 'Power Up',
        cost: 100,
        effect: () => {
            state.upgrades.power++;
            state.power = state.upgrades.power;
            updatePowerDisplay();
        }
    },
    combo: {
        name: 'Combo Boost',
        cost: 200,
        effect: () => {
            state.upgrades.combo++;
        }
    },
    auto: {
        name: 'Auto Clicker',
        cost: 500,
        effect: () => {
            state.upgrades.auto++;
            startAutoClicker();
        }
    }
};

function buyUpgrade(type) {
    const item = shopItems[type];
    if (state.score >= item.cost) {
        state.score -= item.cost;
        item.effect();
        updateScoreDisplay();
        if (config.hapticEnabled) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    } else {
        if (config.hapticEnabled) {
            tg.HapticFeedback.notificationOccurred('error');
        }
    }
}

// Auto Clicker
function startAutoClicker() {
    if (state.upgrades.auto > 0) {
        setInterval(() => {
            const target = state.targets[0];
            if (target) {
                const score = target.hitTest(target.x, target.y);
                if (score > 0) {
                    addScore(score);
                    createHitEffect(target.x, target.y);
                    state.targets.shift();
                }
            }
        }, 1000 / state.upgrades.auto);
    }
}

// Modal Controls
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('hidden');
    }
}

// Event Listeners
document.getElementById('shop-btn')?.addEventListener('click', () => toggleModal('shop-modal'));
document.getElementById('close-shop')?.addEventListener('click', () => toggleModal('shop-modal'));

document.getElementById('settings-btn')?.addEventListener('click', () => toggleModal('settings-modal'));
document.getElementById('close-settings')?.addEventListener('click', () => toggleModal('settings-modal'));

// Start Game
gameLoop();
