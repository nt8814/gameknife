class Shop {
    constructor() {
        this.items = {
            knives: [
                {
                    id: 'standard',
                    name: 'Стандартный нож',
                    description: 'Базовый нож для начинающих',
                    price: 0,
                    image: 'items/standard.svg',
                    unlocked: true
                },
                {
                    id: 'fire',
                    name: 'Огненный нож',
                    description: 'Оставляет огненный след',
                    price: 1000,
                    image: 'items/standard.svg',
                    effect: 'fire'
                },
                {
                    id: 'ice',
                    name: 'Ледяной нож',
                    description: 'Замораживает территорию',
                    price: 1500,
                    image: 'items/standard.svg',
                    effect: 'ice'
                },
                {
                    id: 'poison',
                    name: 'Ядовитый нож',
                    description: 'Отравляет территорию',
                    price: 2000,
                    image: 'items/standard.svg',
                    effect: 'poison'
                },
                {
                    id: 'lightning',
                    name: 'Молниеносный нож',
                    description: 'Создает электрические разряды',
                    price: 2500,
                    image: 'items/standard.svg',
                    effect: 'lightning'
                }
            ],
            effects: {
                trail: {
                    name: 'Световой след',
                    description: 'Оставляет светящийся след за ножом',
                    price: 500,
                    preview: 'effects/trail.svg'
                },
                explosion: {
                    name: 'Взрыв при попадании',
                    description: 'Создает эффектный взрыв при попадании ножа',
                    price: 800,
                    preview: 'effects/explosion.svg'
                },
                rainbow: {
                    name: 'Радужная территория',
                    description: 'Ваша территория переливается всеми цветами',
                    price: 1200,
                    preview: 'effects/rainbow.svg'
                }
            },
            boosters: {
                extraKnives: {
                    name: 'Набор ножей',
                    description: '+5 ножей в начале игры',
                    price: 300,
                    uses: 3
                },
                doubleCoins: {
                    name: 'Удвоение монет',
                    description: 'Удваивает получаемые монеты в следующей игре',
                    price: 500,
                    uses: 1
                },
                shieldPack: {
                    name: 'Набор щитов',
                    description: 'Защищает территорию от захвата 3 раза',
                    price: 750,
                    uses: 3
                }
            }
        };

        this.playerInventory = this.loadInventory();
        this.initializeShop();
        this.addEventListeners();
    }

    loadInventory() {
        const saved = localStorage.getItem('playerInventory');
        return saved ? JSON.parse(saved) : {
            coins: 0,
            knives: ['standard'],
            effects: [],
            boosters: {},
            equipped: {
                knife: 'standard',
                effect: null
            }
        };
    }

    saveInventory() {
        localStorage.setItem('playerInventory', JSON.stringify(this.playerInventory));
        this.updateCoinsDisplay();
    }

    initializeShop() {
        // Создаем категории если их нет
        const categories = document.querySelector('.shop-categories');
        if (!categories) {
            this.createCategories();
        }

        // Загружаем первую категорию по умолчанию
        this.loadCategory('knives');
    }

    createCategories() {
        const categoriesHTML = `
            <div class="shop-categories">
                <button class="category-btn active" data-category="knives">Ножи</button>
                <button class="category-btn" data-category="abilities">Способности</button>
                <button class="category-btn" data-category="effects">Эффекты</button>
            </div>
            <div class="shop-items"></div>
        `;

        document.querySelector('.shop-container').innerHTML = categoriesHTML;
        
        // Добавляем обработчики событий для кнопок категорий
        document.querySelectorAll('.category-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Убираем активный класс у всех кнопок
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Добавляем активный класс нажатой кнопке
                button.classList.add('active');
                
                // Загружаем категорию
                this.loadCategory(button.dataset.category);
            });
        });
    }

    loadCategory(category) {
        const container = document.getElementById('shop-items');
        if (!container) return;

        // Очищаем контейнер
        container.innerHTML = '';

        // Отображаем предметы выбранной категории
        Object.entries(this.items[category]).forEach(([id, item]) => {
            const itemElement = this.createShopItem(id, item, category);
            container.appendChild(itemElement);
        });
    }

    createShopItem(id, item, category) {
        const element = document.createElement('div');
        element.className = 'shop-item';
        
        const isOwned = this.playerInventory[category].includes(id);
        const isEquipped = this.playerInventory.equipped[category === 'knives' ? 'knife' : 'effect'] === id;

        element.innerHTML = `
            <div class="item-preview">
                <img src="${item.image || `items/${id}.svg`}" alt="${item.name}">
            </div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <p>${item.description || ''}</p>
                <div class="item-price">
                    ${isOwned ? 
                        `<button class="equip-btn ${isEquipped ? 'equipped' : ''}" data-id="${id}" data-category="${category}">
                            ${isEquipped ? 'Экипировано' : 'Экипировать'}
                        </button>` : 
                        `<button class="buy-btn" data-id="${id}" data-category="${category}">
                            Купить за ${item.price} монет
                        </button>`
                    }
                </div>
            </div>
        `;

        return element;
    }

    addEventListeners() {
        // Делегирование событий для кнопок покупки и экипировки
        document.getElementById('shop-items')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('buy-btn')) {
                const { id, category } = e.target.dataset;
                this.buyItem(id, category);
            } else if (e.target.classList.contains('equip-btn')) {
                const { id, category } = e.target.dataset;
                this.equipItem(id, category);
            }
        });
    }

    buyItem(id, category) {
        const item = this.items[category][id];
        if (!item) return;

        if (this.playerInventory.coins >= item.price) {
            this.playerInventory.coins -= item.price;
            this.playerInventory[category].push(id);
            this.saveInventory();
            this.loadCategory(category);

            // Показываем уведомление о покупке
            this.showNotification(`Вы приобрели ${item.name}!`);
        } else {
            this.showNotification('Недостаточно монет!', 'error');
        }
    }

    equipItem(id, category) {
        const equipType = category === 'knives' ? 'knife' : 'effect';
        this.playerInventory.equipped[equipType] = id;
        this.saveInventory();
        this.loadCategory(category);
    }

    updateCoinsDisplay() {
        const coinsDisplay = document.getElementById('player-coins');
        if (coinsDisplay) {
            coinsDisplay.textContent = this.playerInventory.coins;
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `shop-notification ${type} animate__animated animate__fadeIn`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('animate__fadeIn');
            notification.classList.add('animate__fadeOut');
            setTimeout(() => notification.remove(), 1000);
        }, 2000);
    }

    // Методы для игровой логики
    getEquippedKnife() {
        return this.items.knives[this.playerInventory.equipped.knife];
    }

    getEquippedEffect() {
        return this.playerInventory.equipped.effect ? 
            this.items.effects[this.playerInventory.equipped.effect] : 
            null;
    }

    addCoins(amount) {
        this.playerInventory.coins += amount;
        this.saveInventory();
    }
}

// Создаем глобальный экземпляр магазина
const shop = new Shop();
