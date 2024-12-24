class NetworkManager {
    constructor() {
        this.isHost = false;
        this.playerId = null;
        this.roomId = null;
        this.players = new Map();
        this.messageQueue = [];
        
        // Инициализируем WebApp
        this.initializeTelegramWebApp();
    }

    initializeTelegramWebApp() {
        if (!window.Telegram || !window.Telegram.WebApp) {
            console.error('Telegram WebApp is not available');
            return;
        }

        this.webApp = window.Telegram.WebApp;
        
        // Получаем данные пользователя
        const user = this.webApp.initDataUnsafe?.user;
        if (user) {
            this.playerId = user.id;
            this.playerName = user.first_name;
            this.playerAvatar = user.photo_url;
        }

        // Подписываемся на события WebApp
        this.webApp.onEvent('viewportChanged', this.handleViewportChange.bind(this));
        this.webApp.onEvent('themeChanged', this.handleThemeChange.bind(this));
    }

    // Методы для создания и присоединения к комнате
    async createRoom() {
        try {
            const response = await this.sendToBot({
                type: 'create_room',
                playerId: this.playerId
            });

            if (response.success) {
                this.isHost = true;
                this.roomId = response.roomId;
                this.addPlayer(this.playerId, {
                    name: this.playerName,
                    avatar: this.playerAvatar,
                    isHost: true
                });
                return true;
            }
        } catch (error) {
            console.error('Failed to create room:', error);
        }
        return false;
    }

    async joinRoom(roomId) {
        try {
            const response = await this.sendToBot({
                type: 'join_room',
                roomId: roomId,
                playerId: this.playerId
            });

            if (response.success) {
                this.roomId = roomId;
                this.addPlayer(this.playerId, {
                    name: this.playerName,
                    avatar: this.playerAvatar,
                    isHost: false
                });
                return true;
            }
        } catch (error) {
            console.error('Failed to join room:', error);
        }
        return false;
    }

    // Методы для управления игроками
    addPlayer(playerId, playerData) {
        this.players.set(playerId, {
            ...playerData,
            lastUpdate: Date.now()
        });
        this.notifyPlayerListUpdate();
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        this.notifyPlayerListUpdate();
    }

    updatePlayerData(playerId, data) {
        if (this.players.has(playerId)) {
            const player = this.players.get(playerId);
            this.players.set(playerId, {
                ...player,
                ...data,
                lastUpdate: Date.now()
            });
            this.notifyPlayerListUpdate();
        }
    }

    // Методы для отправки и получения игровых данных
    sendGameState(state) {
        if (!this.roomId) return;

        this.sendToBot({
            type: 'game_state',
            roomId: this.roomId,
            playerId: this.playerId,
            state: state
        });
    }

    sendPlayerAction(action) {
        if (!this.roomId) return;

        this.sendToBot({
            type: 'player_action',
            roomId: this.roomId,
            playerId: this.playerId,
            action: action
        });
    }

    // Методы для работы с ботом
    async sendToBot(data) {
        try {
            // Отправляем данные боту через WebApp
            return await this.webApp.sendData(JSON.stringify(data));
        } catch (error) {
            console.error('Failed to send data to bot:', error);
            throw error;
        }
    }

    // Обработчики событий WebApp
    handleViewportChange(event) {
        // Обновляем размеры игрового поля при изменении размера окна
        if (window.game) {
            window.game.resizeCanvas();
        }
    }

    handleThemeChange(event) {
        // Обновляем тему игры при изменении темы Telegram
        document.documentElement.style.setProperty('--background-color', 
            this.webApp.themeParams.bg_color || '#1a1a1a');
        document.documentElement.style.setProperty('--text-color', 
            this.webApp.themeParams.text_color || '#ffffff');
    }

    // Методы для обработки сетевых событий
    handleGameStateUpdate(state) {
        if (window.game) {
            window.game.updateFromNetwork(state);
        }
    }

    handlePlayerAction(playerId, action) {
        if (window.game) {
            window.game.handlePlayerAction(playerId, action);
        }
    }

    // Вспомогательные методы
    notifyPlayerListUpdate() {
        // Оповещаем игру об изменении списка игроков
        if (window.game) {
            window.game.handlePlayerListUpdate(Array.from(this.players.values()));
        }
    }

    getPlayerCount() {
        return this.players.size;
    }

    isRoomFull() {
        return this.getPlayerCount() >= CONFIG.game.maxPlayers;
    }

    cleanup() {
        // Очищаем все данные при выходе из игры
        this.players.clear();
        this.messageQueue = [];
        this.roomId = null;
        this.isHost = false;
    }
}

// Создаем глобальный экземпляр сетевого менеджера
const networkManager = new NetworkManager();
