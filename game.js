// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
const gameState = {
    gridSize: 48,
    cellSize: 10,
    players: [
        { 
            id: 1, 
            score: 0, 
            color: '#FF4136', 
            knivesLeft: 10,
            powerups: [],
            combo: 0
        },
        { 
            id: 2, 
            score: 0, 
            color: '#0074D9', 
            knivesLeft: 10,
            powerups: [],
            combo: 0
        }
    ],
    currentPlayer: 0,
    knives: [],
    territory: Array(48).fill().map(() => Array(48).fill(0)),
    gameOver: false,
    powerups: [],
    animations: []
};

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

class Game {
    constructor() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Initialize game state
        this.state = {
            score: 0,
            combo: 1,
            lastKnifeTime: 0,
            knivesLeft: CONFIG.game.startingKnives,
            currentKnife: CONFIG.knives.standard,
            knives: [],
            particles: [],
            camera: {
                x: 0,
                y: 0,
                z: 0,
                rotationX: 0,
                rotationY: 0,
                velocity: { x: 0, y: 0, z: 0 }
            },
            abilities: {
                dash: { active: false, lastUsed: 0 },
                teleport: { active: false, lastUsed: 0 },
                timeSlowdown: { active: false, lastUsed: 0 },
                knifeRain: { active: false, lastUsed: 0 }
            },
            throwAnimation: {
                active: false,
                startTime: 0,
                duration: 300
            }
        };

        // Load knife models
        this.knifeModels = {};
        this.loadKnifeModels();

        // Create effect system
        this.effectSystem = new EffectSystem(this);

        // Initialize input handling
        this.setupInput();

        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }

    setupInput() {
        // Create input manager
        if (!window.inputManager) {
            window.inputManager = new InputManager();
        }
        this.input = window.inputManager;

        // Add mouse move handler
        document.addEventListener('mouse-move', (e) => {
            if (document.pointerLockElement === this.canvas) {
                this.handleMouseMove(e.detail.movementX, e.detail.movementY);
            }
        });

        // Add click handler
        this.canvas.addEventListener('click', () => {
            if (document.pointerLockElement !== this.canvas) {
                this.input.lockMouse(this.canvas);
            } else {
                this.throwKnife();
            }
        });
    }

    {{ ... }}

class InputManager {
    constructor() {
        this.mouseLocked = false;
    }

    lockMouse(canvas) {
        canvas.requestPointerLock = canvas.requestPointerLock || 
                                   canvas.mozRequestPointerLock ||
                                   canvas.webkitRequestPointerLock;
        document.exitPointerLock = document.exitPointerLock ||
                                 document.mozExitPointerLock ||
                                 document.webkitExitPointerLock;

        canvas.requestPointerLock();
        this.mouseLocked = true;
    }
}

// Export InputManager
window.InputManager = InputManager;

// Setup event listeners
function setupEventListeners() {
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch);
    window.addEventListener('resize', handleResize);
}

// Mouse move handler
function handleMouseMove(e) {
    if (gameState.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gameState.cellSize);
    const y = Math.floor((e.clientY - rect.top) / gameState.cellSize);
    
    drawGrid();
    drawPreview(x, y);
}

// Click handler
function handleClick(e) {
    if (gameState.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gameState.cellSize);
    const y = Math.floor((e.clientY - rect.top) / gameState.cellSize);
    
    throwKnife(x, y);
}

// Touch handler for mobile
function handleTouch(e) {
    e.preventDefault();
    if (gameState.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.floor((touch.clientX - rect.left) / gameState.cellSize);
    const y = Math.floor((touch.clientY - rect.top) / gameState.cellSize);
    
    throwKnife(x, y);
}

// Resize handler
function handleResize() {
    canvas.width = Math.min(480, window.innerWidth - 40);
    canvas.height = canvas.width;
    gameState.cellSize = canvas.width / gameState.gridSize;
    drawGrid();
}

// Animation loop
function startAnimationLoop() {
    function animate() {
        if (gameState.animations.length > 0) {
            gameState.animations = gameState.animations.filter(anim => {
                anim.update();
                return !anim.finished;
            });
            drawGrid();
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// Powerup spawner
function startPowerupSpawner() {
    function spawnPowerup() {
        if (Math.random() < 0.1 && gameState.powerups.length < 3) {
            const types = Object.keys(POWERUP_TYPES);
            const type = types[Math.floor(Math.random() * types.length)];
            const x = Math.floor(Math.random() * gameState.gridSize);
            const y = Math.floor(Math.random() * gameState.gridSize);
            
            if (isValidPosition(x, y)) {
                const powerup = { x, y, type, spawnTime: Date.now() };
                gameState.powerups.push(powerup);
                addPowerupAnimation(powerup);
            }
        }
        setTimeout(spawnPowerup, 5000);
    }
    spawnPowerup();
}

// Throw knife
function throwKnife(x, y) {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    
    if (currentPlayer.knivesLeft <= 0) {
        tg.showAlert('No knives left!');
        return;
    }
    
    if (!isValidPosition(x, y)) return;
    
    currentPlayer.knivesLeft--;
    updateKnivesDisplay();
    
    // Check for powerup collection
    const powerupIndex = gameState.powerups.findIndex(p => p.x === x && p.y === y);
    if (powerupIndex !== -1) {
        collectPowerup(gameState.powerups[powerupIndex]);
        gameState.powerups.splice(powerupIndex, 1);
    }
    
    // Add knife
    const knife = {
        x, y,
        player: gameState.currentPlayer,
        timestamp: Date.now()
    };
    gameState.knives.push(knife);
    
    // Add throwing animation
    addKnifeAnimation(knife);
    
    // Calculate territory
    const capturedArea = calculateTerritory();
    if (capturedArea > 0) {
        currentPlayer.combo++;
        const bonus = Math.floor(capturedArea * (1 + currentPlayer.combo * 0.1) * (currentPlayer.scoreMultiplier || 1));
        currentPlayer.score += bonus;
        
        // Show floating score
        addFloatingText(`+${bonus}`, x, y, currentPlayer.color);
        
        document.getElementById('combo').textContent = currentPlayer.combo;
    } else {
        currentPlayer.combo = 0;
        document.getElementById('combo').textContent = '0';
    }
    
    updateScore();
    checkGameOver();
    switchPlayer();
}

// Calculate territory using improved algorithm
function calculateTerritory() {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const playerKnives = gameState.knives.filter(k => k.player === gameState.currentPlayer);
    
    if (playerKnives.length < 3) return 0;
    
    let capturedCells = 0;
    const lastThreeKnives = playerKnives.slice(-3);
    
    // Create polygon from last three knives
    const polygon = lastThreeKnives.map(k => ({ x: k.x, y: k.y }));
    
    // Check each cell within bounding box of polygon
    const bounds = getBoundingBox(polygon);
    for (let i = bounds.minX; i <= bounds.maxX; i++) {
        for (let j = bounds.minY; j <= bounds.maxY; j++) {
            if (i >= 0 && i < gameState.gridSize && j >= 0 && j < gameState.gridSize) {
                if (isPointInPolygon({ x: i, y: j }, polygon)) {
                    if (gameState.territory[i][j] !== gameState.currentPlayer + 1) {
                        gameState.territory[i][j] = gameState.currentPlayer + 1;
                        capturedCells++;
                    }
                }
            }
        }
    }
    
    // Apply area boost if active
    if (currentPlayer.areaBoost > 1) {
        capturedCells = Math.floor(capturedCells * currentPlayer.areaBoost);
    }
    
    return capturedCells;
}

// Get bounding box of polygon
function getBoundingBox(polygon) {
    const xs = polygon.map(p => p.x);
    const ys = polygon.map(p => p.y);
    return {
        minX: Math.floor(Math.min(...xs)),
        maxX: Math.ceil(Math.max(...xs)),
        minY: Math.floor(Math.min(...ys)),
        maxY: Math.ceil(Math.max(...ys))
    };
}

// Check if point is in polygon
function isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

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
