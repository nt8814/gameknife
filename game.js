// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Game Configuration
const config = {
    targetSpawnInterval: 2000,
    targetLifetime: 3000,
    baseScore: 100,
    maxCombo: 5,
    comboMultiplier: 0.2,
    particleCount: 10,
    particleLifetime: 1000
};

// Game State
const state = {
    score: 0,
    combo: 0,
    power: 1,
    targets: [],
    particles: [],
    lastSpawnTime: 0,
    upgrades: {
        power: 0,
        combo: 0,
        auto: 0
    }
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to full window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Target Class
class Target {
    constructor() {
        this.radius = 30;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = Math.random() * (canvas.height - this.radius * 2) + this.radius;
        this.spawnTime = Date.now();
        this.alpha = 1;
        this.active = true;
    }

    update() {
        const age = Date.now() - this.spawnTime;
        if (age >= config.targetLifetime) {
            this.active = false;
            state.combo = 0;
            updateUI();
            return;
        }
        this.alpha = 1 - (age / config.targetLifetime);
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FF4B4B';
        ctx.fill();
        
        // Draw inner circles
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#FF7676';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFB4B4';
        ctx.fill();
        ctx.restore();
    }

    checkHit(x, y) {
        const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        if (distance <= this.radius) {
            const accuracy = 1 - (distance / this.radius);
            return accuracy;
        }
        return -1;
    }
}

// Particle Class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10
        };
        this.alpha = 1;
        this.lifetime = config.particleLifetime;
        this.birthTime = Date.now();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        const age = Date.now() - this.birthTime;
        this.alpha = 1 - (age / this.lifetime);
        return age < this.lifetime;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Game Loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn new target if needed
    const now = Date.now();
    if (now - state.lastSpawnTime > config.targetSpawnInterval && state.targets.length < 1) {
        state.targets.push(new Target());
        state.lastSpawnTime = now;
    }

    // Update and draw targets
    state.targets = state.targets.filter(target => {
        target.update();
        if (target.active) {
            target.draw();
            return true;
        }
        return false;
    });

    // Update and draw particles
    state.particles = state.particles.filter(particle => {
        if (particle.update()) {
            particle.draw();
            return true;
        }
        return false;
    });

    requestAnimationFrame(gameLoop);
}

// Click Handler
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let hit = false;
    state.targets = state.targets.filter(target => {
        const accuracy = target.checkHit(x, y);
        if (accuracy >= 0) {
            hit = true;
            handleHit(target, accuracy);
            return false;
        }
        return true;
    });

    if (!hit) {
        state.combo = 0;
        updateUI();
    }
});

// Handle Hit
function handleHit(target, accuracy) {
    // Calculate score
    const baseScore = Math.round(config.baseScore * accuracy);
    const comboMultiplier = 1 + (state.combo * config.comboMultiplier);
    const finalScore = Math.round(baseScore * comboMultiplier * state.power);
    
    // Update game state
    state.score += finalScore;
    state.combo = Math.min(state.combo + 1, config.maxCombo + state.upgrades.combo);
    
    // Create particles
    for (let i = 0; i < config.particleCount; i++) {
        state.particles.push(new Particle(target.x, target.y, '#FFD700'));
    }
    
    // Show floating score
    showFloatingText(target.x, target.y, `+${finalScore}`);
    
    // Update UI
    updateUI();
}

// Floating Text
function showFloatingText(x, y, text) {
    const element = document.createElement('div');
    element.className = 'floating-text';
    element.textContent = text;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    document.body.appendChild(element);
    
    setTimeout(() => {
        element.remove();
    }, 1000);
}

// UI Updates
function updateUI() {
    document.getElementById('score').textContent = state.score;
    document.getElementById('combo').textContent = `x${(1 + state.combo * config.comboMultiplier).toFixed(1)}`;
    document.getElementById('power').textContent = state.power;
}

// Shop Functions
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.toggle('hidden');
}

document.getElementById('shop-btn').addEventListener('click', () => {
    toggleModal('shop-modal');
});

// Handle shop item clicks
document.querySelectorAll('.shop-item').forEach(item => {
    item.addEventListener('click', () => {
        const type = item.dataset.item;
        const cost = parseInt(item.querySelector('.item-cost').textContent);
        
        if (state.score >= cost) {
            state.score -= cost;
            state.upgrades[type]++;
            
            switch(type) {
                case 'power':
                    state.power++;
                    break;
                case 'combo':
                    config.maxCombo++;
                    break;
                case 'auto':
                    // Implement auto-click functionality
                    break;
            }
            
            updateUI();
        }
    });
});

// Start the game
gameLoop();
