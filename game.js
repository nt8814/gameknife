// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

// Expand to full screen
tg.expand();

// Set header color
tg.setHeaderColor('#2C2C2C');
tg.setBackgroundColor('#2C2C2C');

// Game state
const gameState = {
    score: 0,
    combo: 1,
    power: 1,
    clickEffects: [],
    settings: {
        soundEnabled: true,
        hapticEnabled: true
    }
};

// Load user data
if (tg.initDataUnsafe.user) {
    const { first_name, last_name, username, id } = tg.initDataUnsafe.user;
    gameState.user = {
        name: first_name,
        fullName: `${first_name} ${last_name || ''}`.trim(),
        username,
        id
    };
}

// Initialize CloudStorage
let cloudData = {};
try {
    const savedData = localStorage.getItem('gameData');
    if (savedData) {
        cloudData = JSON.parse(savedData);
        gameState.score = cloudData.score || 0;
        gameState.power = cloudData.power || 1;
    }
} catch (e) {
    console.error('Error loading saved data:', e);
}

// Save game data
function saveGameData() {
    const dataToSave = {
        score: gameState.score,
        power: gameState.power,
        lastSaved: Date.now()
    };
    localStorage.setItem('gameData', JSON.stringify(dataToSave));
    
    // Show popup
    tg.showPopup({
        title: 'Game Saved!',
        message: `Score: ${Math.floor(gameState.score)}\nPower: ${gameState.power}`,
        buttons: [{
            type: 'ok'
        }]
    });
}

// Handle back button
tg.BackButton.onClick(() => {
    // Show confirmation before exit
    tg.showConfirm('Do you want to save and exit?', (confirmed) => {
        if (confirmed) {
            saveGameData();
            tg.close();
        }
    });
});

// Shop functionality
const shopBtn = document.getElementById('shop-btn');
const shopModal = document.getElementById('shop-modal');
const closeShopBtn = document.getElementById('close-shop');

shopBtn.addEventListener('click', () => {
    if (gameState.settings.hapticEnabled) {
        tg.HapticFeedback.impactOccurred('medium');
    }
    shopModal.classList.remove('hidden');
});

closeShopBtn.addEventListener('click', () => {
    if (gameState.settings.hapticEnabled) {
        tg.HapticFeedback.impactOccurred('light');
    }
    shopModal.classList.add('hidden');
});

// Shop items handling
document.querySelectorAll('.shop-item').forEach(item => {
    item.addEventListener('click', () => {
        const itemType = item.dataset.item;
        const cost = parseInt(item.querySelector('.item-cost').textContent);
        
        if (gameState.score >= cost) {
            // Purchase confirmation
            tg.showConfirm(`Buy ${itemType} upgrade for ${cost} points?`, (confirmed) => {
                if (confirmed) {
                    gameState.score -= cost;
                    
                    switch(itemType) {
                        case 'power':
                            gameState.power += 1;
                            break;
                        case 'combo':
                            gameState.maxCombo = (gameState.maxCombo || 5) + 1;
                            break;
                        case 'auto':
                            startAutoClicker();
                            break;
                    }
                    
                    // Haptic feedback
                    if (gameState.settings.hapticEnabled) {
                        tg.HapticFeedback.notificationOccurred('success');
                    }
                    
                    updateUI();
                    saveGameData();
                }
            });
        } else {
            // Not enough points
            tg.showPopup({
                title: 'Not enough points!',
                message: `You need ${cost - Math.floor(gameState.score)} more points`,
                buttons: [{
                    type: 'ok'
                }]
            });
            
            if (gameState.settings.hapticEnabled) {
                tg.HapticFeedback.notificationOccurred('error');
            }
        }
    });
});

// Main click handler
function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    // Add score
    gameState.score += Math.floor(gameState.power * gameState.combo);
    
    // Increase combo
    gameState.combo = Math.min(gameState.combo + 0.1, gameState.maxCombo || 5);
    
    // Add click effect
    gameState.clickEffects.push(new ClickEffect(x, y));

    // Haptic feedback
    if (gameState.settings.hapticEnabled) {
        tg.HapticFeedback.impactOccurred('light');
    }

    // Update UI
    updateUI();
    
    // Auto-save every 1000 points
    if (Math.floor(gameState.score) % 1000 === 0) {
        saveGameData();
    }
}

// Settings button in MainButton
tg.MainButton.setText('Settings').show();
tg.MainButton.onClick(() => {
    tg.showPopup({
        title: 'Settings',
        message: 'Game Settings',
        buttons: [
            {
                id: 'sound',
                type: 'default',
                text: `Sound: ${gameState.settings.soundEnabled ? 'ON' : 'OFF'}`
            },
            {
                id: 'haptic',
                type: 'default',
                text: `Haptic: ${gameState.settings.hapticEnabled ? 'ON' : 'OFF'}`
            },
            {
                id: 'save',
                type: 'default',
                text: 'Save Game'
            },
            {
                id: 'close',
                type: 'cancel',
                text: 'Close'
            }
        ]
    }, (buttonId) => {
        switch (buttonId) {
            case 'sound':
                gameState.settings.soundEnabled = !gameState.settings.soundEnabled;
                break;
            case 'haptic':
                gameState.settings.hapticEnabled = !gameState.settings.hapticEnabled;
                break;
            case 'save':
                saveGameData();
                break;
        }
    });
});

// Auto-clicker functionality
let autoClickerInterval;
function startAutoClicker() {
    if (!autoClickerInterval) {
        autoClickerInterval = setInterval(() => {
            gameState.score += Math.floor(gameState.power * (gameState.combo / 2));
            updateUI();
        }, 1000);
    }
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = Math.floor(gameState.score);
    document.getElementById('combo').textContent = `x${gameState.combo.toFixed(1)}`;
    document.getElementById('power').textContent = gameState.power;
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw effects
    gameState.clickEffects = gameState.clickEffects.filter(effect => {
        const alive = effect.update();
        if (alive) effect.draw();
        return alive;
    });

    // Decrease combo over time
    gameState.combo = Math.max(1, gameState.combo - 0.001);
    updateUI();

    // Next frame
    requestAnimationFrame(gameLoop);
}

// Start game
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

// Start game loop
gameLoop();

// Powerup types
const POWERUP_TYPES = {
    DOUBLE_SCORE: {
        name: 'Double Score',
        duration: 3,
        color: '#FFD700',
        effect: (player) => {
            player.scoreMultiplier = 2;
            return () => player.scoreMultiplier = 1;
        }
    },
    EXTRA_KNIFE: {
        name: 'Extra Knives',
        color: '#32CD32',
        effect: (player) => {
            player.knivesLeft += 3;
            updateKnivesDisplay();
        }
    },
    AREA_BOOST: {
        name: 'Area Boost',
        duration: 5,
        color: '#9932CC',
        effect: (player) => {
            player.areaBoost = 1.5;
            return () => player.areaBoost = 1;
        }
    },
    STEAL_TERRITORY: {
        name: 'Territory Steal',
        color: '#FF1493',
        effect: (player) => {
            const opponent = gameState.players[(gameState.currentPlayer + 1) % 2];
            const stolenCells = stealTerritory(opponent, 50);
            player.score += stolenCells;
            updateScore();
        }
    }
};

// Animation classes
class KnifeAnimation {
    constructor(knife) {
        this.knife = knife;
        this.progress = 0;
        this.duration = 500;
        this.startTime = Date.now();
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        this.progress = Math.min(1, elapsed / this.duration);
        this.finished = this.progress >= 1;
        return !this.finished;
    }
    
    draw(ctx) {
        const scale = 1 + Math.sin(this.progress * Math.PI) * 0.5;
        ctx.save();
        ctx.translate(
            this.knife.x * gameState.cellSize + gameState.cellSize / 2,
            this.knife.y * gameState.cellSize + gameState.cellSize / 2
        );
        ctx.rotate(this.progress * Math.PI * 4);
        ctx.scale(scale, scale);
        drawKnife(ctx, gameState.players[this.knife.player].color);
        ctx.restore();
    }
}

class FloatingText {
    constructor(text, x, y, color) {
        this.text = text;
        this.x = x * gameState.cellSize;
        this.y = y * gameState.cellSize;
        this.color = color;
        this.progress = 0;
        this.duration = 1000;
        this.startTime = Date.now();
    }
    
    update() {
        const elapsed = Date.now() - this.startTime;
        this.progress = Math.min(1, elapsed / this.duration);
        this.finished = this.progress >= 1;
        return !this.finished;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 1 - this.progress;
        ctx.font = '20px sans-serif';
        ctx.fillText(
            this.text,
            this.x,
            this.y - this.progress * 30
        );
        ctx.restore();
    }
}

class ClickEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 50;
        this.speed = 2;
        this.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
        this.opacity = 1;
    }

    update() {
        this.radius += this.speed;
        this.opacity = 1 - (this.radius / this.maxRadius);
        return this.radius <= this.maxRadius;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color + Math.floor(this.opacity * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

// Helper functions
function addKnifeAnimation(knife) {
    gameState.animations.push(new KnifeAnimation(knife));
}

function addFloatingText(text, x, y, color) {
    gameState.animations.push(new FloatingText(text, x, y, color));
}

function drawKnife(ctx, color) {
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(5, 0);
    ctx.lineTo(-5, 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function isValidPosition(x, y) {
    if (x < 0 || x >= gameState.gridSize || y < 0 || y >= gameState.gridSize) return false;
    return !gameState.knives.some(k => k.x === x && k.y === y);
}

function switchPlayer() {
    gameState.currentPlayer = (gameState.currentPlayer + 1) % 2;
    document.getElementById('current-player').textContent = gameState.currentPlayer + 1;
}

function updateScore() {
    // Update total score
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = gameState.players[0].score + ':' + gameState.players[1].score;
    }

    // Update combo
    const comboElement = document.getElementById('combo');
    if (comboElement) {
        comboElement.textContent = `x${gameState.players[gameState.currentPlayer].combo}`;
    }

    // Update knives left
    const knivesElement = document.getElementById('knives');
    if (knivesElement) {
        knivesElement.textContent = gameState.players[gameState.currentPlayer].knivesLeft;
    }
}

function updateKnivesDisplay() {
    gameState.players.forEach((player, index) => {
        document.getElementById(`knives-${index + 1}`).textContent = player.knivesLeft;
    });
}

function checkGameOver() {
    const noKnivesLeft = gameState.players.every(p => p.knivesLeft <= 0);
    const totalTerritory = gameState.gridSize * gameState.gridSize;
    const capturedTerritory = gameState.territory.flat().filter(x => x > 0).length;
    
    if (noKnivesLeft || capturedTerritory > totalTerritory * 0.8) {
        gameState.gameOver = true;
        
        const winner = gameState.players[0].score > gameState.players[1].score ? 1 : 2;
        const finalScores = `${gameState.players[0].score}:${gameState.players[1].score}`;
        
        tg.showPopup({
            title: 'Game Over!',
            message: `Player ${winner} wins!\nFinal Score: ${finalScores}`,
            buttons: [{
                type: 'ok',
                text: 'New Game'
            }]
        }).then(() => {
            window.location.reload();
        });
        
        sendScore();
    }
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gameState.cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gameState.cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw click effects
    gameState.clickEffects.forEach(effect => effect.draw());
}

function addPowerupAnimation(powerup) {
    const effectSystem = {
        addPowerupEffect: (x, y, color) => {
            ctx.save();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        }
    };
    effectSystem.addPowerupEffect(
        powerup.x * gameState.cellSize + gameState.cellSize / 2,
        powerup.y * gameState.cellSize + gameState.cellSize / 2,
        powerup.color
    );
}

// Initialize game
const game = new Game();
game.start();
setupEventListeners();
startAnimationLoop();
startPowerupSpawner();

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw effects
    gameState.clickEffects = gameState.clickEffects.filter(effect => {
        const alive = effect.update();
        if (alive) effect.draw();
        return alive;
    });

    // Decrease combo over time
    gameState.combo = Math.max(1, gameState.combo - 0.001);
    updateUI();

    // Next frame
    requestAnimationFrame(gameLoop);
}

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = Math.floor(gameState.score);
    document.getElementById('combo').textContent = `x${gameState.combo.toFixed(1)}`;
    document.getElementById('power').textContent = gameState.power;
}
