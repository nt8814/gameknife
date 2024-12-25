class EffectSystem {
    constructor() {
        this.effects = [];
        this.particles = [];
        this.effectsLayer = document.getElementById('effects-layer');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.initializeEffects();
    }

    initializeEffects() {
        // Создаем канвас для эффектов
        this.effectsCanvas = document.createElement('canvas');
        this.effectsCanvas.width = this.canvas.width;
        this.effectsCanvas.height = this.canvas.height;
        this.effectsCtx = this.effectsCanvas.getContext('2d');
        
        this.effectsLayer.appendChild(this.effectsCanvas);
        
        // Запускаем анимационный цикл
        this.animate();
    }

    animate() {
        this.effectsCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
        
        // Обновляем и отрисовываем все активные эффекты
        this.effects = this.effects.filter(effect => {
            effect.update();
            effect.draw(this.effectsCtx);
            return !effect.finished;
        });
        
        // Обновляем и отрисовываем все частицы
        this.particles = this.particles.filter(particle => {
            particle.update();
            particle.draw(this.effectsCtx);
            return !particle.finished;
        });
        
        requestAnimationFrame(() => this.animate());
    }

    // Эффект броска ножа
    addKnifeThrowEffect(x, y, color) {
        this.effects.push(new KnifeTrailEffect(x, y, color));
        this.addParticles(x, y, color, 10);
    }

    // Эффект захвата территории
    addTerritoryEffect(x, y, color) {
        this.effects.push(new TerritoryCapureEffect(x, y, color));
        this.addParticles(x, y, color, 20);
    }

    // Эффект сбора бонуса
    addPowerupEffect(x, y, color) {
        this.effects.push(new PowerupCollectEffect(x, y, color));
        this.addParticles(x, y, color, 15);
    }

    // Добавление частиц
    addParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
}

// Базовый класс для эффектов
class Effect {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.lifetime = 1000; // миллисекунды
        this.startTime = Date.now();
        this.finished = false;
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        this.progress = Math.min(elapsed / this.lifetime, 1);
        this.finished = this.progress >= 1;
    }

    draw(ctx) {
        // Реализуется в дочерних классах
    }
}

// Эффект следа ножа
class KnifeTrailEffect extends Effect {
    constructor(x, y, color) {
        super(x, y, color);
        this.points = [{x, y}];
        this.maxPoints = 10;
    }

    update() {
        super.update();
        
        // Добавляем новые точки для следа
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }

    draw(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2 * (1 - this.progress);
        ctx.beginPath();
        this.points.forEach((point, i) => {
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    }
}

// Эффект захвата территории
class TerritoryCapureEffect extends Effect {
    constructor(x, y, color) {
        super(x, y, color);
        this.radius = 0;
        this.maxRadius = 50;
    }

    update() {
        super.update();
        this.radius = this.progress * this.maxRadius;
    }

    draw(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * (1 - this.progress);
        ctx.globalAlpha = 1 - this.progress;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
}

// Эффект сбора бонуса
class PowerupCollectEffect extends Effect {
    constructor(x, y, color) {
        super(x, y, color);
        this.size = 30;
    }

    draw(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1 - this.progress;
        
        const size = this.size * (1 + this.progress);
        
        ctx.beginPath();
        ctx.moveTo(this.x - size/2, this.y - size/2);
        ctx.lineTo(this.x + size/2, this.y + size/2);
        ctx.moveTo(this.x + size/2, this.y - size/2);
        ctx.lineTo(this.x - size/2, this.y + size/2);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
}

// Класс частиц
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.lifetime = 1000;
        this.startTime = Date.now();
        this.finished = false;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.95;
        this.speedY *= 0.95;
        
        const elapsed = Date.now() - this.startTime;
        this.progress = Math.min(elapsed / this.lifetime, 1);
        this.finished = this.progress >= 1;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 1 - this.progress;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// Создаем глобальный экземпляр системы эффектов
const effectSystem = new EffectSystem();
