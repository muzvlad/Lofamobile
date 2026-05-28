const gameEngine = {
    isRunning: false,

    run() {
        if (this.isRunning) return;
        if (!gameManager.currentLevel || gameManager.editorCommands.length === 0) {
            return;
        }

        this.isRunning = true;

        const player = { 
            ...gameManager.player,
            heldItems: gameManager.player.heldItems ? [...gameManager.player.heldItems] : []
        };
        const grid = gameManager.currentLevel.grid;
        const levelItems = gameManager.currentLevel.items ? gameManager.currentLevel.items.map(i => ({...i})) : [];
        const level = {
            ...gameManager.currentLevel,
            items: levelItems
        };
        const moves = gameManager.editorCommands.length;
        const requiredItems = gameManager.originalItems ? gameManager.originalItems.length : 0;

        const executeStep = async (index) => {
            if (index >= gameManager.editorCommands.length) {
                const itemsCollected = player.heldItems ? player.heldItems.length : 0;
                
                const isLevel10 = gameManager.currentLevel && gameManager.currentLevel.id === 10;
                let itemsOnTarget = itemsCollected;
                if (isLevel10 && requiredItems > 0) {
                    let itemsOnWarehouse = 0;
                    level.items.forEach(item => {
                        let cellX = item.x;
                        let cellY = item.y;
                        if (cellX >= 0 && cellX < grid[0].length && cellY >= 0 && cellY < grid.length) {
                            if (grid[cellY][cellX] === 7) {
                                itemsOnWarehouse++;
                            }
                        }
                    });
                    itemsOnTarget = itemsOnWarehouse;
                }
                
                    this.isRunning = false;
                    await this.executeFinish(itemsOnTarget, moves, requiredItems);
                return;
            }

            const cmd = gameManager.editorCommands[index];

            const cmdResult = window.gameLogic.executeCommand(cmd, player, grid, level);

            gameManager.player = { 
                ...player,
                heldItems: player.heldItems ? [...player.heldItems] : []
            };
            gameManager.currentLevel.player = { ...player };
            gameManager.currentLevel.items = level.items.map(i => ({...i}));
            gameRenderer.renderGrid();

            setTimeout(() => executeStep(index + 1), 300);
        };

        executeStep(0);
    },

    isValidMove(x, y) {
        if (!gameManager.currentLevel || !gameManager.currentLevel.grid) return false;
        if (y < 0 || x < 0) return false;
        if (!gameManager.currentLevel.grid[y] || gameManager.currentLevel.grid[y][x] === undefined) return false;
        return gameManager.currentLevel.grid[y][x] !== 1;
    },

    async executeFinish(hasItem, moves, requiredItems) {
        const grid = gameManager.currentLevel.grid;
        const player = gameManager.player;

        if (player.y < 0 || player.x < 0 || !grid[player.y] || !grid[player.y][player.x]) {
            await this.completeLevel(false, moves, hasItem, requiredItems);
            return;
        }

        const isFinish = grid[player.y][player.x] === 3;

        await this.completeLevel(isFinish, moves, hasItem, requiredItems);
    },

    async completeLevel(success, moves, hasItem, requiredItems) {
        const levelId = gameManager.currentLevel.id;
        
        try {
            const res = await fetch(`${window.location.origin}/api/levels/${gameManager.currentLevel.id}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({
                    code: gameManager.editorCommands.join('\n'),
                    moves: moves,
                    hasItem: hasItem,
                    requiredItems: requiredItems || 0
                })
            });

            if (!res.ok) {
                this.showResult(0, 0, false);
                return;
            }
            
            const data = await res.json();
            
            if (data.success && success) {
                await achievementsManager.save(gameManager.currentLevel.id);
                
                if (typeof levelsManager !== 'undefined') {
                    await levelsManager.load();
                    await new Promise(r => setTimeout(r, 100));
                }
                
                const nextLevelId = gameManager.currentLevel.id + 1;
                
                setTimeout(() => {
                    const nextUnlocked = nextLevelId <= 20 && levelsManager.isLevelUnlocked(nextLevelId);
                    this.showResult(data.stars, data.score, nextUnlocked);
                }, 200);
            } else {
                this.showResult(0, 0, false);
            }
        } catch (err) {
            this.showResult(0, 0, false);
        }
    },

    t(key) {
        if (localizationManager && localizationManager.t) {
            let result = localizationManager.t(key);
            return result !== '' ? result : key;
        }
        return key;
    },

    showResult(stars, score, hasNext) {
        const modal = document.getElementById('result-modal');
        if (!modal) return;

        const titleEl = document.getElementById('result-title');
        const starsEl = document.getElementById('result-stars');
        const scoreEl = document.getElementById('result-score');

        modal.classList.remove('active');
        
        setTimeout(() => {
            if (stars > 0) {
                if (titleEl) titleEl.textContent = this.t('resultTitle');
                if (starsEl) starsEl.textContent = '⭐'.repeat(stars);
                if (scoreEl && scoreEl.previousElementSibling) {
                    scoreEl.textContent = '+' + score;
                }
                const msgEl = document.getElementById('result-message');
                if (msgEl) msgEl.textContent = this.t('resultMessage');
            } else {
                if (titleEl) titleEl.textContent = this.t('resultTitleFail');
                if (starsEl) starsEl.textContent = this.t('tryAgain');
                if (scoreEl) scoreEl.textContent = '';
            }

            const retryBtnEl = document.getElementById('retry-level-btn');
            const toMapBtnEl = document.getElementById('to-map-btn');

            if (retryBtnEl) {
                retryBtnEl.textContent = this.t('retry');
                retryBtnEl.onclick = () => {
                    modal.classList.remove('active');
                    gameManager.editorCommands = [];
                    gameManager.droppedItems = [];
                    if (gameManager.originalItems && gameManager.originalItems.length > 0) {
                        gameManager.currentLevel.items = gameManager.originalItems.map(item => ({ ...item }));
                    }
                    gameManager.player = { ...gameManager.originalPlayer, heldItems: [] };
                    gameManager.currentLevel.player = { ...gameManager.originalPlayer };
                    gameRenderer.renderEditor();
                    gameRenderer.renderGrid();
                };
            }

            if (toMapBtnEl) {
                toMapBtnEl.textContent = this.t('toLevels');
                toMapBtnEl.onclick = () => {
                    modal.classList.remove('active');
                    levelsManager.load();
                    app.showMenu();
                };
            }

            modal.classList.add('active');
        }, 10);
    },

    reset() {
        this.isRunning = false;
        gameManager.editorCommands = [];
        gameManager.droppedItems = [];
        gameRenderer.renderEditor();
        if (gameManager.currentLevel) {
            if (gameManager.originalItems && gameManager.originalItems.length > 0) {
                gameManager.currentLevel.items = gameManager.originalItems.map(item => ({ ...item }));
            }
            gameManager.player.hasItem = false;
            gameManager.player.heldItems = [];
            gameRenderer.renderGrid();
        }
    }
};

window.gameEngine = gameEngine;