class AnimationSystem {
    constructor() {
        this.animations = new Map();
        this.requestId = null;
        this.lastTime = 0;
        
        this.start();
    }

    start() {
        if (!this.requestId) {
            this.animate(performance.now());
        }
    }

    stop() {
        if (this.requestId) {
            cancelAnimationFrame(this.requestId);
            this.requestId = null;
        }
    }

    animate(currentTime) {
        this.requestId = requestAnimationFrame(time => this.animate(time));

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Обновляем все активные анимации
        for (const [id, animation] of this.animations) {
            if (animation.update(deltaTime)) {
                this.animations.delete(id);
            }
        }
    }

    // Создание анимации
    createAnimation(options) {
        const id = Math.random().toString(36).substr(2, 9);
        const animation = new Animation(options);
        this.animations.set(id, animation);
        return id;
    }

    // Остановка конкретной анимации
    stopAnimation(id) {
        this.animations.delete(id);
    }

    // Различные предустановленные анимации
    fadeIn(element, duration = 500) {
        return this.createAnimation({
            target: element,
            duration: duration,
            properties: {
                opacity: [0, 1]
            },
            easing: 'easeOutCubic'
        });
    }

    fadeOut(element, duration = 500) {
        return this.createAnimation({
            target: element,
            duration: duration,
            properties: {
                opacity: [1, 0]
            },
            easing: 'easeInCubic'
        });
    }

    slideIn(element, direction = 'right', duration = 500) {
        const start = direction === 'right' ? [100, 0] : [-100, 0];
        return this.createAnimation({
            target: element,
            duration: duration,
            properties: {
                transform: [
                    `translateX(${start[0]}%)`,
                    'translateX(0)'
                ]
            },
            easing: 'easeOutQuart'
        });
    }

    pulse(element, scale = 1.2, duration = 500) {
        return this.createAnimation({
            target: element,
            duration: duration,
            properties: {
                transform: [
                    'scale(1)',
                    `scale(${scale})`,
                    'scale(1)'
                ]
            },
            easing: 'easeInOutQuad'
        });
    }

    shake(element, intensity = 5, duration = 500) {
        return this.createAnimation({
            target: element,
            duration: duration,
            properties: {
                transform: [
                    'translateX(0)',
                    `translateX(${intensity}px)`,
                    `translateX(-${intensity}px)`,
                    'translateX(0)'
                ]
            },
            easing: 'linear',
            iterations: 3
        });
    }

    rotate(element, degrees = 360, duration = 1000) {
        return this.createAnimation({
            target: element,
            duration: duration,
            properties: {
                transform: [
                    'rotate(0deg)',
                    `rotate(${degrees}deg)`
                ]
            },
            easing: 'easeInOutQuad'
        });
    }
}

class Animation {
    constructor(options) {
        this.target = options.target;
        this.duration = options.duration;
        this.properties = options.properties;
        this.easing = options.easing || 'linear';
        this.iterations = options.iterations || 1;
        this.delay = options.delay || 0;
        
        this.currentIteration = 0;
        this.progress = 0;
        this.elapsed = 0;
        this.started = false;
    }

    update(deltaTime) {
        if (!this.started) {
            this.delay -= deltaTime;
            if (this.delay <= 0) {
                this.started = true;
            } else {
                return false;
            }
        }

        this.elapsed += deltaTime;
        this.progress = Math.min(this.elapsed / this.duration, 1);

        // Применяем функцию плавности
        const easedProgress = this.applyEasing(this.progress);

        // Обновляем все анимируемые свойства
        Object.entries(this.properties).forEach(([property, values]) => {
            const current = this.interpolate(values, easedProgress);
            this.target.style[property] = current;
        });

        // Проверяем завершение итерации
        if (this.progress >= 1) {
            this.currentIteration++;
            if (this.currentIteration >= this.iterations) {
                return true; // Анимация завершена
            } else {
                // Сброс для следующей итерации
                this.elapsed = 0;
                this.progress = 0;
            }
        }

        return false; // Анимация продолжается
    }

    interpolate(values, progress) {
        // Если значения - это массив строк с transform
        if (typeof values[0] === 'string' && values[0].includes('translate') || 
            values[0].includes('scale') || values[0].includes('rotate')) {
            return values[Math.floor(progress * (values.length - 1))];
        }

        // Для числовых значений
        const start = values[0];
        const end = values[1];
        return start + (end - start) * progress;
    }

    applyEasing(t) {
        switch (this.easing) {
            case 'linear':
                return t;
            case 'easeInQuad':
                return t * t;
            case 'easeOutQuad':
                return t * (2 - t);
            case 'easeInOutQuad':
                return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'easeInCubic':
                return t * t * t;
            case 'easeOutCubic':
                return (--t) * t * t + 1;
            case 'easeInOutCubic':
                return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
            case 'easeInQuart':
                return t * t * t * t;
            case 'easeOutQuart':
                return 1 - (--t) * t * t * t;
            case 'easeInOutQuart':
                return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
            default:
                return t;
        }
    }
}

// Создаем глобальный экземпляр системы анимаций
const animationSystem = new AnimationSystem();
