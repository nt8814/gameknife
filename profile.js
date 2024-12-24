class PlayerProfile {
    constructor() {
        // Загружаем или создаем профиль
        this.profile = this.loadProfile() || this.createDefaultProfile();
        
        // Создаем UI профиля
        this.createProfileUI();
        
        // Инициализируем профиль
        this.initializeProfile();
        
        // Сохраняем профиль
        this.saveProfile();
    }

    loadProfile() {
        const saved = localStorage.getItem('playerProfile');
        return saved ? JSON.parse(saved) : null;
    }

    createDefaultProfile() {
        return {
            name: 'Player',
            level: 1,
            experience: 0,
            coins: 0,
            achievements: [],
            stats: {
                gamesPlayed: 0,
                totalScore: 0,
                highScore: 0,
                knivesThrown: 0,
                targetsHit: 0,
                accuracy: 0
            }
        };
    }

    createProfileUI() {
        // Проверяем существование контейнера
        let container = document.querySelector('.profile-container');
        if (!container) {
            const profileHTML = `
                <div class="profile-container">
                    <div class="profile-header">
                        <img id="profile-avatar" src="images/default-avatar.svg" alt="Avatar">
                        <h2 id="profile-name">Player</h2>
                    </div>
                    <div class="profile-stats">
                        <div class="stat-item">
                            <span class="stat-label">Уровень:</span>
                            <span id="profile-level">1</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Опыт:</span>
                            <span id="profile-xp">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Монеты:</span>
                            <span id="profile-coins">0</span>
                        </div>
                    </div>
                    <div class="profile-achievements">
                        <h3>Достижения</h3>
                        <div id="achievements-list"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', profileHTML);
        }
    }

    initializeProfile() {
        // Обновляем основную информацию
        document.getElementById('profile-name').textContent = this.profile.name;
        document.getElementById('profile-level').textContent = this.profile.level;
        
        // Обновляем прогресс опыта
        const expNeeded = this.getExperienceForNextLevel();
        document.getElementById('profile-xp').textContent = 
            `${this.profile.experience}/${expNeeded}`;
        
        // Обновляем аватар если есть
        const avatarElement = document.getElementById('profile-avatar');
        if (avatarElement && this.profile.avatar) {
            avatarElement.src = this.profile.avatar;
        }
    }

    saveProfile() {
        localStorage.setItem('playerProfile', JSON.stringify(this.profile));
        this.updateProfileDisplay();
    }

    updateProfileDisplay() {
        // Обновляем основную информацию
        document.getElementById('profile-name').textContent = this.profile.name;
        document.getElementById('profile-level').textContent = this.profile.level;
        
        // Обновляем прогресс опыта
        const expNeeded = this.getExperienceForNextLevel();
        document.getElementById('profile-xp').textContent = 
            `${this.profile.experience}/${expNeeded}`;
        
        // Обновляем аватар если есть
        const avatarElement = document.getElementById('profile-avatar');
        if (avatarElement && this.profile.avatar) {
            avatarElement.src = this.profile.avatar;
        }
    }

    addEventListeners() {
        // Обработчик изменения имени
        const nameElement = document.getElementById('profile-name');
        if (nameElement) {
            nameElement.addEventListener('click', () => {
                const newName = prompt('Введите новое имя:', this.profile.name);
                if (newName && newName.trim()) {
                    this.profile.name = newName.trim();
                    this.saveProfile();
                }
            });
        }
    }

    // Методы для игровой логики
    addExperience(amount) {
        this.profile.experience += amount;
        
        // Проверяем повышение уровня
        while (this.profile.experience >= this.getExperienceForNextLevel()) {
            this.levelUp();
        }
        
        this.saveProfile();
    }

    levelUp() {
        this.profile.level++;
        
        // Награда за уровень
        const reward = {
            coins: CONFIG.levels.rewards.coins * this.profile.level,
            knives: CONFIG.levels.rewards.knives
        };
        
        this.profile.inventory.coins += reward.coins;
        
        // Показываем уведомление о повышении уровня
        this.showLevelUpNotification(reward);
    }

    getExperienceForNextLevel() {
        return Math.floor(CONFIG.levels.baseExperience * 
            Math.pow(CONFIG.levels.experienceMultiplier, this.profile.level - 1));
    }

    updateGameStats(gameResult) {
        const stats = this.profile.stats;
        
        stats.gamesPlayed++;
        if (gameResult.isWinner) stats.gamesWon++;
        
        stats.totalScore += gameResult.score;
        stats.bestScore = Math.max(stats.bestScore, gameResult.score);
        stats.territoryCaptured += gameResult.territoryCaptured;
        stats.powerupsCollected += gameResult.powerupsCollected;
        stats.maxCombo = Math.max(stats.maxCombo, gameResult.maxCombo);
        
        // Начисляем опыт за игру
        const expGained = this.calculateGameExperience(gameResult);
        this.addExperience(expGained);
        
        this.saveProfile();
    }

    calculateGameExperience(gameResult) {
        let experience = gameResult.score * 0.1; // Базовый опыт от счета
        
        // Бонусы за достижения в игре
        if (gameResult.isWinner) experience *= 1.5;
        if (gameResult.maxCombo >= 5) experience *= 1.2;
        if (gameResult.territoryCaptured > 75) experience *= 1.3;
        
        return Math.floor(experience);
    }

    showLevelUpNotification(reward) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification animate__animated animate__bounceIn';
        notification.innerHTML = `
            <h3>Уровень повышен!</h3>
            <p>Вы достигли ${this.profile.level} уровня</p>
            <div class="reward-info">
                <p>Награда:</p>
                <ul>
                    <li>${reward.coins} монет</li>
                    <li>${reward.knives} новых ножей</li>
                </ul>
            </div>
        `;

        document.body.appendChild(notification);

        // Удаляем уведомление через 5 секунд
        setTimeout(() => {
            notification.classList.remove('animate__bounceIn');
            notification.classList.add('animate__bounceOut');
            setTimeout(() => notification.remove(), 1000);
        }, 4000);
    }

    // Методы для работы с достижениями
    unlockAchievement(achievementId) {
        if (!this.profile.achievements.includes(achievementId)) {
            this.profile.achievements.push(achievementId);
            this.saveProfile();
            
            // Получаем информацию о достижении
            const achievement = CONFIG.achievements[achievementId];
            if (achievement) {
                // Начисляем награду
                this.profile.inventory.coins += achievement.reward;
                this.saveProfile();
                
                // Показываем уведомление
                this.showAchievementNotification(achievement);
            }
        }
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

        setTimeout(() => {
            notification.classList.remove('animate__fadeInRight');
            notification.classList.add('animate__fadeOutRight');
            setTimeout(() => notification.remove(), 1000);
        }, 4000);
    }
}

// Создаем глобальный экземпляр профиля игрока
const playerProfile = new PlayerProfile();
