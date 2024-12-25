// Управление UI и навигацией
class UI {
    constructor() {
        // Создаем элементы UI если их нет
        this.createUIElements();
        
        // Инициализируем кнопки
        this.initializeButtons();
        
        // Привязываем обработчики событий
        this.bindEvents();
    }

    createUIElements() {
        const uiHTML = `
            <div class="game-ui">
                <div class="top-bar">
                    <button id="profile-btn">Профиль</button>
                    <button id="shop-btn">Магазин</button>
                    <button id="achievements-btn">Достижения</button>
                    <button id="settings-btn">Настройки</button>
                </div>
                <div class="game-stats">
                    <div class="stat">Счет: <span id="score">0</span></div>
                    <div class="stat">Комбо: <span id="combo">x1</span></div>
                    <div class="stat">Монеты: <span id="coins">0</span></div>
                </div>
                <div class="ability-bar">
                    <div class="ability" data-ability="dash">
                        <span class="key">SHIFT</span>
                        <div class="cooldown"></div>
                    </div>
                    <div class="ability" data-ability="teleport">
                        <span class="key">E</span>
                        <div class="cooldown"></div>
                    </div>
                    <div class="ability" data-ability="time-slow">
                        <span class="key">Q</span>
                        <div class="cooldown"></div>
                    </div>
                    <div class="ability" data-ability="knife-rain">
                        <span class="key">R</span>
                        <div class="cooldown"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', uiHTML);
    }

    initializeButtons() {
        this.buttons = {
            profile: document.getElementById('profile-btn'),
            shop: document.getElementById('shop-btn'),
            achievements: document.getElementById('achievements-btn'),
            settings: document.getElementById('settings-btn')
        };
    }

    bindEvents() {
        if (this.buttons.profile) {
            this.buttons.profile.addEventListener('click', () => {
                this.togglePanel('profile');
            });
        }

        if (this.buttons.shop) {
            this.buttons.shop.addEventListener('click', () => {
                this.togglePanel('shop');
            });
        }

        if (this.buttons.achievements) {
            this.buttons.achievements.addEventListener('click', () => {
                this.togglePanel('achievements');
            });
        }

        if (this.buttons.settings) {
            this.buttons.settings.addEventListener('click', () => {
                this.togglePanel('settings');
            });
        }
    }

    togglePanel(panelName) {
        // Скрываем все панели
        document.querySelectorAll('.panel').forEach(panel => {
            panel.style.display = 'none';
        });

        // Показываем выбранную панель
        const panel = document.querySelector(`.${panelName}-panel`);
        if (panel) {
            panel.style.display = 'block';
        }
    }

    updateStats(stats) {
        // Обновляем отображение статистики
        if (stats.score !== undefined) {
            document.getElementById('score').textContent = stats.score;
        }
        if (stats.combo !== undefined) {
            document.getElementById('combo').textContent = `x${stats.combo}`;
        }
        if (stats.coins !== undefined) {
            document.getElementById('coins').textContent = stats.coins;
        }
    }

    updateAbilityCooldowns(abilities) {
        // Обновляем отображение перезарядки способностей
        for (const [name, ability] of Object.entries(abilities)) {
            const element = document.querySelector(`.ability[data-ability="${name}"] .cooldown`);
            if (element) {
                const cooldownPercent = (ability.cooldown - (Date.now() - ability.lastUsed)) / ability.cooldown * 100;
                element.style.height = `${Math.max(0, Math.min(100, cooldownPercent))}%`;
            }
        }
    }
}

// Инициализация UI при загрузке страницы
window.addEventListener('load', () => {
    window.ui = new UI();
});
