class AchievementSystem {
    constructor() {
        this.achievements = CONFIG.achievements;
        this.unlockedAchievements = this.loadUnlockedAchievements();
        this.initializeAchievements();
    }

    loadUnlockedAchievements() {
        const saved = localStorage.getItem('unlockedAchievements');
        return saved ? JSON.parse(saved) : {};
    }

    saveUnlockedAchievements() {
        localStorage.setItem('unlockedAchievements', JSON.stringify(this.unlockedAchievements));
    }

    initializeAchievements() {
        const container = document.getElementById('achievements-grid');
        if (!container) return;

        container.innerHTML = '';
        
        Object.entries(this.achievements).forEach(([id, achievement]) => {
            const isUnlocked = this.unlockedAchievements[id];
            const achievementElement = this.createAchievementElement(id, achievement, isUnlocked);
            container.appendChild(achievementElement);
        });
    }

    createAchievementElement(id, achievement, isUnlocked) {
        const element = document.createElement('div');
        element.className = `achievement ${isUnlocked ? 'unlocked' : 'locked'}`;
        element.innerHTML = `
            <div class="achievement-icon">
                <i class="achievement-${id}"></i>
                ${isUnlocked ? '<div class="check-mark">✓</div>' : ''}
            </div>
            <div class="achievement-info">
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
                <div class="achievement-reward">
                    Награда: ${achievement.reward} монет
                </div>
            </div>
        `;
        return element;
    }

    checkAchievement(id, condition) {
        if (this.unlockedAchievements[id]) return false;
        
        if (condition) {
            this.unlockAchievement(id);
            return true;
        }
        return false;
    }

    unlockAchievement(id) {
        if (this.unlockedAchievements[id]) return;

        const achievement = this.achievements[id];
        this.unlockedAchievements[id] = true;
        this.saveUnlockedAchievements();

        // Обновляем отображение
        this.initializeAchievements();

        // Показываем уведомление
        this.showAchievementNotification(achievement);

        // Начисляем награду
        this.grantAchievementReward(achievement);
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification animate__animated animate__fadeInRight';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>Достижение разблокировано!</h4>
                <p>${achievement.name}</p>
                <span class="reward">+${achievement.reward} монет</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Удаляем уведомление через 5 секунд
        setTimeout(() => {
            notification.classList.remove('animate__fadeInRight');
            notification.classList.add('animate__fadeOutRight');
            setTimeout(() => notification.remove(), 1000);
        }, 4000);
    }

    grantAchievementReward(achievement) {
        // Добавляем монеты игроку
        const currentCoins = parseInt(localStorage.getItem('playerCoins') || '0');
        localStorage.setItem('playerCoins', currentCoins + achievement.reward);
        
        // Обновляем отображение монет в интерфейсе
        const coinsDisplay = document.getElementById('player-coins');
        if (coinsDisplay) {
            coinsDisplay.textContent = currentCoins + achievement.reward;
        }
    }

    // Методы проверки различных достижений
    checkGameAchievements(gameState) {
        // Проверяем достижение первой победы
        if (gameState.isWinner) {
            this.checkAchievement('firstWin', true);
        }

        // Проверяем достижение комбо
        if (gameState.maxCombo >= 10) {
            this.checkAchievement('comboMaster', true);
        }

        // Проверяем захват территории
        const territoryPercentage = (gameState.capturedTerritory / gameState.totalTerritory) * 100;
        if (territoryPercentage >= 75) {
            this.checkAchievement('territoryKing', true);
        }

        // Проверяем сбор бонусов
        if (gameState.collectedPowerups.length === Object.keys(CONFIG.powerups).length) {
            this.checkAchievement('powerupCollector', true);
        }

        // Проверяем разблокировку ножей
        const unlockedKnives = Object.keys(gameState.unlockedKnives).length;
        if (unlockedKnives === Object.keys(CONFIG.knifeTypes).length) {
            this.checkAchievement('knifeExpert', true);
        }
    }
}

// Создаем глобальный экземпляр системы достижений
const achievementSystem = new AchievementSystem();
