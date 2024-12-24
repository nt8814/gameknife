const CONFIG = {
    // Игровые настройки
    game: {
        gridSize: 48,
        defaultKnives: 15,
        minPlayersForGame: 2,
        comboTimeWindow: 5000,
        maxCombo: 10,
        baseScoreMultiplier: 1,
        gravity: 9.8,
        jumpForce: 5,
        moveSpeed: 5
    },

    // Типы ножей
    knifeTypes: {
        standard: {
            name: 'Стандартный',
            damage: 1,
            speed: 1,
            price: 0,
            color: '#FF4136',
            model: 'items/standard.svg',
            throwSound: 'knife-throw',
            description: 'Базовый нож для новичков'
        },
        fire: {
            name: 'Огненный',
            damage: 1.5,
            speed: 1.2,
            price: 1000,
            color: '#FF851B',
            model: 'items/fire.svg',
            effect: 'burn',
            throwSound: 'fire-throw',
            description: 'Поджигает врагов и оставляет огненный след'
        },
        ice: {
            name: 'Ледяной',
            damage: 0.8,
            speed: 1.5,
            price: 1500,
            color: '#7FDBFF',
            model: 'items/ice.svg',
            effect: 'freeze',
            throwSound: 'ice-throw',
            description: 'Замораживает врагов и замедляет их'
        },
        poison: {
            name: 'Ядовитый',
            damage: 1.2,
            speed: 0.9,
            price: 2000,
            color: '#2ECC40',
            model: 'items/poison.svg',
            effect: 'poison',
            throwSound: 'poison-throw',
            description: 'Отравляет врагов, нанося урон со временем'
        },
        lightning: {
            name: 'Молния',
            damage: 2,
            speed: 2,
            price: 3000,
            color: '#F012BE',
            model: 'items/lightning.svg',
            effect: 'chain',
            throwSound: 'lightning-throw',
            description: 'Создает цепную молнию между врагами'
        },
        ninja: {
            name: 'Сюрикен ниндзя',
            damage: 1.3,
            speed: 1.8,
            price: 2500,
            color: '#B10DC9',
            model: 'items/ninja.svg',
            effect: 'stealth',
            throwSound: 'ninja-throw',
            description: 'Можно метать три ножа одновременно'
        }
    },

    // Способности
    abilities: {
        dash: {
            name: 'Рывок',
            cooldown: 5000,
            description: 'Быстрый рывок вперед'
        },
        teleport: {
            name: 'Телепорт',
            cooldown: 8000,
            description: 'Мгновенное перемещение к прицелу'
        },
        timeSlowdown: {
            name: 'Замедление времени',
            cooldown: 15000,
            duration: 3000,
            description: 'Замедляет время для точных бросков'
        },
        knifeRain: {
            name: 'Дождь из ножей',
            cooldown: 20000,
            description: 'Вызывает дождь из ножей в указанной области'
        }
    },

    // Эффекты
    effects: {
        burn: {
            damage: 0.2,
            duration: 3000,
            tickRate: 500
        },
        freeze: {
            slowAmount: 0.5,
            duration: 2000
        },
        poison: {
            damage: 0.1,
            duration: 5000,
            tickRate: 1000
        },
        chain: {
            damage: 0.5,
            radius: 100,
            maxTargets: 3
        }
    },

    // Достижения
    achievements: {
        firstBlood: {
            name: 'Первая кровь',
            description: 'Выполните первое убийство',
            reward: 100
        },
        comboMaster: {
            name: 'Мастер комбо',
            description: 'Достигните комбо х10',
            reward: 500
        },
        knifeMaster: {
            name: 'Мастер ножей',
            description: 'Купите все типы ножей',
            reward: 1000
        },
        perfectGame: {
            name: 'Идеальная игра',
            description: 'Выиграйте игру без смертей',
            reward: 2000
        }
    }
};
