class InputManager {
    constructor() {
        this.keys = new Set();
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = new Set();
        this.mouseLocked = false;

        // Привязываем обработчики событий
        this.bindEvents();
    }

    bindEvents() {
        // Обработка клавиатуры
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });

        // Обработка мыши
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;

            if (this.mouseLocked) {
                this.handleMouseMovement(e);
            }
        });

        document.addEventListener('mousedown', (e) => {
            this.mouseButtons.add(e.button);
        });

        document.addEventListener('mouseup', (e) => {
            this.mouseButtons.delete(e.button);
        });

        // Обработка блокировки указателя
        document.addEventListener('pointerlockchange', () => {
            this.mouseLocked = document.pointerLockElement !== null;
        });
    }

    handleMouseMovement(e) {
        // Отправляем событие движения мыши
        const event = new CustomEvent('mouse-move', {
            detail: {
                movementX: e.movementX,
                movementY: e.movementY
            }
        });
        document.dispatchEvent(event);
    }

    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }

    isMouseButtonPressed(button) {
        return this.mouseButtons.has(button);
    }

    getMousePosition() {
        return { ...this.mousePosition };
    }

    lockMouse(element) {
        if (element.requestPointerLock) {
            element.requestPointerLock();
        }
    }

    unlockMouse() {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }
}

// Создаем глобальный экземпляр
window.inputManager = new InputManager();
