// Target mechanics
class Target {
    constructor(canvas, gameState) {
        this.canvas = canvas;
        this.gameState = gameState;
        this.radius = 30;
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = Math.random() * (canvas.height - this.radius * 2) + this.radius;
        this.spawnTime = Date.now();
        this.lifetime = 3000 - (gameState.skills.speed * 100);
        this.alpha = 1;
        this.active = true;
    }

    update() {
        const age = Date.now() - this.spawnTime;
        if (age >= this.lifetime) {
            this.active = false;
            return;
        }
        this.alpha = 1 - (age / this.lifetime);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Outer circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FF4B4B';
        ctx.fill();
        
        // Middle circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = '#FF7676';
        ctx.fill();
        
        // Inner circle
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
            return accuracy * (1 + this.gameState.skills.precision * 0.1);
        }
        return -1;
    }
}

// Particle effects
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
        this.lifetime = 1000;
        this.birthTime = Date.now();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        const age = Date.now() - this.birthTime;
        this.alpha = 1 - (age / this.lifetime);
        return age < this.lifetime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Score and combo system
function updateScore(score, isCritical = false) {
    if (isCritical) {
        score *= 2;
        createCriticalHitEffect();
    }
    
    gameState.score += score;
    gameState.xp += score / 10;
    
    document.getElementById('score').textContent = gameState.score;
}

function updateCombo() {
    gameState.combo = Math.min(gameState.combo + 0.1, 5);
    document.getElementById('combo').textContent = `x${gameState.combo.toFixed(1)}`;
}

function resetCombo() {
    gameState.combo = 1;
    document.getElementById('combo').textContent = 'x1.0';
}

// Visual effects
function createHitEffect(x, y, isCritical) {
    const color = isCritical ? '#FFD700' : '#FFFFFF';
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function createCriticalHitEffect() {
    const element = document.createElement('div');
    element.className = 'critical-hit';
    element.textContent = 'CRITICAL!';
    element.style.left = '50%';
    element.style.top = '50%';
    document.body.appendChild(element);
    
    setTimeout(() => element.remove(), 500);
}

function createLevelUpEffect() {
    const element = document.createElement('div');
    element.className = 'level-up';
    element.textContent = 'LEVEL UP!';
    element.style.left = '50%';
    element.style.top = '50%';
    document.body.appendChild(element);
    
    setTimeout(() => element.remove(), 1000);
}

// Game state management
function saveGameState() {
    localStorage.setItem('knifeGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('knifeGameState');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(gameState, parsed);
        updateUI();
    }
}

// Export functions
export {
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
};
