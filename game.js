// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

// Expand to full screen
tg.expand();

// Set header color
tg.setHeaderColor('#1a1a2e');
tg.setBackgroundColor('#1a1a2e');

// Game state
const gameState = {
    score: 0,
    combo: 1,
    power: 1,
    clickEffects: [],
    targets: [],
    activeKnife: 'basic',
    settings: {
        soundEnabled: true,
        hapticEnabled: true,
        particlesEnabled: true
    }
};

// Target class
class Target {
    constructor() {
        this.x = Math.random() * (canvas.width - 100);
        this.y = Math.random() * (canvas.height - 100);
        this.radius = 45;
        this.points = 100;
        this.spawnTime = Date.now();
        this.lifetime = 3000; // 3 seconds
        this.scale = 1;
        this.opacity = 1;
    }

    update() {
        const age = Date.now() - this.spawnTime;
        const lifePercent = age / this.lifetime;
        
        // Pulse effect
        this.scale = 1 + Math.sin(age * 0.005) * 0.1;
        
        // Fade out near end of life
        if (lifePercent > 0.7) {
            this.opacity = 1 - ((lifePercent - 0.7) / 0.3);
        }
        
        return age < this.lifetime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x + 50, this.y + 50);
        ctx.scale(this.scale, this.scale);
        
        // Draw target circles
        for (let i = 3; i > 0; i--) {
            ctx.beginPath();
            ctx.arc(0, 0, i * 15, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 75, 75, ${i * 0.1})`;
            ctx.strokeStyle = '#FF4B4B';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
        }
        
        ctx.restore();
    }

    hitTest(x, y) {
        const dx = x - (this.x + 50);
        const dy = y - (this.y + 50);
        return Math.sqrt(dx * dx + dy * dy) < this.radius * this.scale;
    }
}

// Load game items
let gameItems = {};
fetch('items.json')
    .then(response => response.json())
    .then(data => {
        gameItems = data;
        // Initialize with basic knife
        gameState.activeKnife = gameItems.knives.basic;
    })
    .catch(error => console.error('Error loading items:', error));

// Target spawning
function spawnTarget() {
    if (gameState.targets.length < 3) {
        gameState.targets.push(new Target());
    }
}

// Start target spawning
setInterval(spawnTarget, 1000);

// Click handler with improved mechanics
function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    let hit = false;
    
    // Check for target hits
    gameState.targets = gameState.targets.filter(target => {
        if (target.hitTest(x, y)) {
            hit = true;
            // Calculate score based on timing
            const age = Date.now() - target.spawnTime;
            const timeBonus = Math.max(0, 1 - (age / target.lifetime));
            const points = Math.floor(target.points * (1 + timeBonus) * gameState.combo * gameState.power);
            
            // Add score
            gameState.score += points;
            
            // Increase combo
            gameState.combo = Math.min(gameState.combo + 0.2, gameState.maxCombo || 5);
            
            // Show points text
            showFloatingText(`+${points}`, x, y);
            
            // Add hit effects
            addHitEffects(x, y);
            
            return false; // Remove hit target
        }
        return target.update(); // Keep target if still alive
    });

    // Miss effects
    if (!hit) {
        gameState.combo = 1; // Reset combo on miss
        showFloatingText('Miss!', x, y, '#FF4B4B');
    }

    // Haptic feedback
    if (gameState.settings.hapticEnabled) {
        tg.HapticFeedback.impactOccurred(hit ? 'medium' : 'light');
    }

    // Update UI
    updateUI();
}

// Floating text effect
function showFloatingText(text, x, y, color = '#FFD700') {
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        color: ${color};
        font-size: 24px;
        font-weight: bold;
        pointer-events: none;
        transform: translate(-50%, -50%);
        animation: float-up 1s ease-out forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// Hit effects
function addHitEffects(x, y) {
    // Add knife throw effect
    const knife = gameItems.knives[gameState.activeKnife];
    if (knife) {
        const img = new Image();
        img.src = knife.image;
        img.onload = () => {
            const el = document.createElement('div');
            el.className = 'knife-effect';
            el.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 32px;
                height: 32px;
                background-image: url(${knife.image});
                background-size: contain;
                pointer-events: none;
                transform: translate(-50%, -50%);
                animation: throw-knife 0.3s ease-out forwards;
            `;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 300);
        };
    }

    // Add particle effects
    if (gameState.settings.particlesEnabled) {
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            const angle = (i / 8) * Math.PI * 2;
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 8px;
                height: 8px;
                background: #FF4B4B;
                border-radius: 50%;
                pointer-events: none;
                transform: translate(-50%, -50%);
                animation: particle 0.5s ease-out forwards;
                --angle: ${angle}rad;
            `;
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 500);
        }
    }
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid (optional)
    drawGrid();

    // Update and draw targets
    gameState.targets = gameState.targets.filter(target => {
        const alive = target.update();
        if (alive) target.draw(ctx);
        return alive;
    });

    // Decrease combo over time
    gameState.combo = Math.max(1, gameState.combo - 0.001);
    updateUI();

    // Next frame
    requestAnimationFrame(gameLoop);
}

// Draw background grid
function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    ctx.restore();
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = Math.floor(gameState.score);
    document.getElementById('combo').textContent = `x${gameState.combo.toFixed(1)}`;
    document.getElementById('power').textContent = gameState.power;
}

// Initialize game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Event listeners
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleClick(e);
});

// Start game
gameLoop();
