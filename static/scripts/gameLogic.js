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
        ITEM: 4,
        OBSTACLE: 5,
        BRICK_WALL: 6,
        WAREHOUSE: 7,
        TRUCK: 8,
        BALK: 9
    },
    
    t(key) {
        const l10n = getL10n();
        if (l10n && l10n.t) {
            const val = l10n.t(key);
            return val || key;
        }
        return key;
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
        return cell !== this.cellTypes.WALL && cell !== this.cellTypes.OBSTACLE && cell !== this.cellTypes.TRUCK && cell !== this.cellTypes.BALK;
    },
    
    isValidJump(grid, x, y) {
        if (y < 0 || x < 0) return false;
        if (!grid[y] || grid[y][x] === undefined) return false;
        const cell = grid[y][x];
        return cell !== this.cellTypes.WALL && cell !== this.cellTypes.WAREHOUSE;
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
                    result.message = this.t('errWallUp');
                }
                break;
            case 'down':
                if (this.isValidMove(grid, player.x, player.y + 1)) {
                    player.y++;
                    player.direction = 2;
                } else {
                    result.success = false;
                    result.message = this.t('errWallDown');
                }
                break;
            case 'left':
                if (player.x > 0 && this.isValidMove(grid, player.x - 1, player.y)) {
                    player.x--;
                    player.direction = 3;
                } else {
                    result.success = false;
                    result.message = this.t('errWallLeft');
                }
                break;
            case 'right':
                if (this.isValidMove(grid, player.x + 1, player.y)) {
                    player.x++;
                    player.direction = 1;
                } else {
                    result.success = false;
                    result.message = this.t('errWallRight');
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
                } else {
                    result.success = false;
                    result.message = this.t('errJump');
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
                } else {
                    result.success = false;
                    result.message = this.t('errTurn');
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
                    result.message = this.t('itemTaken');
                } else {
                    result.success = false;
                    result.message = this.t('errNoItem');
                }
                break;
            case 'drop':
                if (player.heldItems && player.heldItems.length > 0) {
                    const item = player.heldItems.pop();
                    level.items.push({ x: player.x, y: player.y, type: item });
                    result.message = this.t('itemPlaced');
                } else {
                    result.success = false;
                    result.message = this.t('errNothingToDrop');
                }
                break;
        }
        
        return result;
    }
};

window.gameLogic = gameLogic;