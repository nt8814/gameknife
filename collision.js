class CollisionManager {
    constructor(game) {
        this.game = game;
        this.gridSize = CONFIG.game.gridSize;
    }

    // Проверка столкновения ножа с территорией
    checkKnifeTerritory(knife) {
        // Получаем координаты клетки
        const gridX = Math.floor(knife.x / this.gridSize);
        const gridY = Math.floor(knife.y / this.gridSize);
        
        // Проверяем соседние клетки
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const checkX = gridX + dx;
                const checkY = gridY + dy;
                
                // Проверяем границы поля
                if (checkX < 0 || checkY < 0 || 
                    checkX >= this.game.gridWidth || 
                    checkY >= this.game.gridHeight) {
                    continue;
                }
                
                const key = `${checkX},${checkY}`;
                const territory = this.game.state.territory.get(key);
                
                if (territory && territory.playerId !== knife.playerId) {
                    // Есть столкновение с чужой территорией
                    return {
                        collision: true,
                        type: 'territory',
                        x: checkX * this.gridSize,
                        y: checkY * this.gridSize,
                        territory: territory
                    };
                }
            }
        }
        
        return { collision: false };
    }

    // Проверка столкновения ножа с другим ножом
    checkKnifeKnife(knife, otherKnives) {
        for (const other of otherKnives) {
            if (knife === other) continue;
            
            const dx = knife.x - other.x;
            const dy = knife.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.gridSize / 2) {
                return {
                    collision: true,
                    type: 'knife',
                    x: other.x,
                    y: other.y,
                    knife: other
                };
            }
        }
        
        return { collision: false };
    }

    // Проверка столкновения ножа с бонусом
    checkKnifePowerup(knife) {
        for (const powerup of this.game.state.powerups) {
            if (powerup.collected) continue;
            
            const dx = knife.x - (powerup.x + this.gridSize / 2);
            const dy = knife.y - (powerup.y + this.gridSize / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.gridSize / 2) {
                return {
                    collision: true,
                    type: 'powerup',
                    x: powerup.x,
                    y: powerup.y,
                    powerup: powerup
                };
            }
        }
        
        return { collision: false };
    }

    // Проверка столкновения ножа с границами поля
    checkKnifeBounds(knife) {
        if (knife.x < 0 || knife.x > this.game.canvas.width ||
            knife.y < 0 || knife.y > this.game.canvas.height) {
            return {
                collision: true,
                type: 'bounds',
                x: knife.x,
                y: knife.y
            };
        }
        
        return { collision: false };
    }

    // Проверка всех столкновений для ножа
    checkKnifeCollisions(knife, otherKnives) {
        // Проверяем границы
        const boundsCollision = this.checkKnifeBounds(knife);
        if (boundsCollision.collision) {
            return boundsCollision;
        }
        
        // Проверяем столкновение с территорией
        const territoryCollision = this.checkKnifeTerritory(knife);
        if (territoryCollision.collision) {
            return territoryCollision;
        }
        
        // Проверяем столкновение с другими ножами
        const knifeCollision = this.checkKnifeKnife(knife, otherKnives);
        if (knifeCollision.collision) {
            return knifeCollision;
        }
        
        // Проверяем столкновение с бонусами
        const powerupCollision = this.checkKnifePowerup(knife);
        if (powerupCollision.collision) {
            return powerupCollision;
        }
        
        return { collision: false };
    }

    // Проверка захвата территории
    checkTerritoryClaim(x, y, playerId) {
        const claimed = new Set();
        const checked = new Set();
        const toCheck = [[x, y]];
        
        while (toCheck.length > 0) {
            const [checkX, checkY] = toCheck.pop();
            const key = `${checkX},${checkY}`;
            
            if (checked.has(key)) continue;
            checked.add(key);
            
            // Проверяем границы поля
            if (checkX < 0 || checkY < 0 || 
                checkX >= this.game.gridWidth || 
                checkY >= this.game.gridHeight) {
                continue;
            }
            
            // Проверяем принадлежность клетки
            const territory = this.game.state.territory.get(key);
            if (!territory || territory.playerId === playerId) {
                claimed.add(key);
                
                // Добавляем соседние клетки для проверки
                toCheck.push(
                    [checkX + 1, checkY],
                    [checkX - 1, checkY],
                    [checkX, checkY + 1],
                    [checkX, checkY - 1]
                );
            }
        }
        
        return claimed;
    }

    // Проверка замкнутости территории
    isTerritoryClosed(startX, startY, playerId) {
        const checked = new Set();
        const toCheck = [[startX, startY]];
        let reachedBorder = false;
        
        while (toCheck.length > 0) {
            const [checkX, checkY] = toCheck.pop();
            const key = `${checkX},${checkY}`;
            
            if (checked.has(key)) continue;
            checked.add(key);
            
            // Проверяем достижение границы поля
            if (checkX <= 0 || checkY <= 0 || 
                checkX >= this.game.gridWidth - 1 || 
                checkY >= this.game.gridHeight - 1) {
                reachedBorder = true;
                continue;
            }
            
            // Проверяем соседние клетки
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nextX = checkX + dx;
                const nextY = checkY + dy;
                const nextKey = `${nextX},${nextY}`;
                
                const territory = this.game.state.territory.get(nextKey);
                if (!territory || territory.playerId !== playerId) {
                    toCheck.push([nextX, nextY]);
                }
            }
        }
        
        return !reachedBorder;
    }
}

// Экспортируем класс
window.CollisionManager = CollisionManager;
