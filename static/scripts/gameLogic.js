const gameLogic = {
    directions: {
        NORTH: 0,
        EAST: 1,
        SOUTH: 2,
        WEST: 3
    },
    
    cellTypes: {
        EMPTY: 0,
        WALL: 1,
        START: 2,
        FINISH: 3,
        ITEM: 4
    },
    
    movePlayer(player, direction) {
        const dx = [0, 1, 0, -1];
        const dy = [-1, 0, 1, 0];
        
        const newX = player.x + dx[direction];
        const newY = player.y + dy[direction];
        
        return { x: newX, y: newY };
    },
    
    isValidMove(grid, x, y) {
        if (y < 0 || x < 0) return false;
        if (!grid[y] || grid[y][x] === undefined) return false;
        const cell = grid[y][x];
        return cell !== this.cellTypes.WALL && cell !== 4 && cell !== 5 && cell !== 8 && cell !== 9;
    },
    
    isValidJump(grid, x, y) {
        if (y < 0 || x < 0) return false;
        if (!grid[y] || grid[y][x] === undefined) return false;
        const cell = grid[y][x];
        return cell !== this.cellTypes.WALL && cell !== 7;
    },
    
    executeCommand(command, player, grid, level) {
        const result = { success: true, message: '' };
        
        switch (command) {
            case 'up':
                if (player.y > 0 && this.isValidMove(grid, player.x, player.y - 1)) {
                    player.y--;
                    player.direction = 0;
                } else {
                    result.success = false;
                    result.message = 'Не могу идти вверх - стена!';
                }
                break;
            case 'down':
                if (this.isValidMove(grid, player.x, player.y + 1)) {
                    player.y++;
                    player.direction = 2;
                } else {
                    result.success = false;
                    result.message = 'Не могу идти вниз - стена!';
                }
                break;
            case 'left':
                if (player.x > 0 && this.isValidMove(grid, player.x - 1, player.y)) {
                    player.x--;
                    player.direction = 3;
                } else {
                    result.success = false;
                    result.message = 'Не могу идти влево - стена!';
                }
                break;
            case 'right':
                if (this.isValidMove(grid, player.x + 1, player.y)) {
                    player.x++;
                    player.direction = 1;
                } else {
                    result.success = false;
                    result.message = 'Не могу идти вправо - стена!';
                }
                break;
            case 'jump':
                const jumpDir = player.direction;
                const dx = [0, 1, 0, -1];
                const dy = [-1, 0, 1, 0];
                const jumpX = player.x + dx[jumpDir] * 2;
                const jumpY = player.y + dy[jumpDir] * 2;
                if (this.isValidJump(grid, jumpX, jumpY)) {
                    player.x = jumpX;
                    player.y = jumpY;
                }
                break;
            case 'turn':
                const turnDir = (player.direction + 2) % 4;
                const dxTurn = [0, 1, 0, -1];
                const dyTurn = [-1, 0, 1, 0];
                const turnX = player.x + dxTurn[turnDir] * 2;
                const turnY = player.y + dyTurn[turnDir] * 2;
                if (this.isValidJump(grid, turnX, turnY)) {
                    player.direction = turnDir;
                    player.x = turnX;
                    player.y = turnY;
                }
                break;
            case 'collect':
                const collectX = player.x;
                const collectY = player.y;
                const itemIndex = level.items.findIndex(item => item.x === collectX && item.y === collectY);
                if (itemIndex !== -1) {
                    if (!player.heldItems) player.heldItems = [];
                    player.heldItems.push(level.items[itemIndex].type);
                    level.items.splice(itemIndex, 1);
                    result.message = 'Предмет взят';
                } else {
                    result.success = false;
                    result.message = 'Здесь нет предмета';
                }
                break;
            case 'drop':
                if (player.heldItems && player.heldItems.length > 0) {
                    const item = player.heldItems.pop();
                    level.items.push({ x: player.x, y: player.y, type: item });
                    result.message = 'Предмет положен';
                } else {
                    result.success = false;
                    result.message = 'Нечего класть';
                }
                break;
        }
        
        return result;
    },
    
    async executeLevel(level, commands) {
        const player = { ...level.player };
        const items = level.items ? level.items.map(i => ({ ...i })) : [];
        const grid = level.grid;
        const results = [];
        
        for (const cmd of commands) {
            const result = this.executeCommand(cmd, player, grid);
            results.push(result);
            
            if (!result.success) {
                return {
                    success: false,
                    player: player,
                    items: items,
                    error: result.message,
                    results: results
                };
            }
        }
        
        const finalCell = grid[player.y]?.[player.x];
        const isFinish = finalCell === this.cellTypes.FINISH;
        
        return {
            success: isFinish,
            player: player,
            items: items,
            results: results
        };
    },
    
    calculateStars(moves, par) {
        if (moves <= par) return 3;
        if (moves <= par * 2) return 2;
        return 1;
    }
};

window.gameLogic = gameLogic;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = gameLogic;
}