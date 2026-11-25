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

        const executeStep = async (index) => {
            if (index >= gameManager.editorCommands.length) {
                const itemsCollected = player.heldItems ? player.heldItems.length : 0;
                
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
                
                this.isRunning = false;
                await this.executeFinish(moves, itemsCollected, itemsOnWarehouse);
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

    async executeFinish(moves, itemsCollected, itemsOnWarehouse) {
        const grid = gameManager.currentLevel.grid;
        const player = gameManager.player;

        if (player.y < 0 || player.x < 0 || !grid[player.y] || !grid[player.y][player.x]) {
            await this.completeLevel(moves, itemsCollected, itemsOnWarehouse);
            return;
        }

        await this.completeLevel(moves, itemsCollected, itemsOnWarehouse);
    },

    async completeLevel(moves, itemsCollected, itemsOnWarehouse) {
        const levelId = gameManager.currentLevel.id;
        
        try {
            const requestBody = {
                code: gameManager.editorCommands.join('\n'),
                moves: moves,
                playerX: gameManager.player.x,
                playerY: gameManager.player.y,
                itemsCollected: itemsCollected,
                itemsOnWarehouse: itemsOnWarehouse
            };
            console.log('[LEVEL] Sending:', requestBody);
            const res = await fetch(`${window.location.origin}/api/levels/${gameManager.currentLevel.id}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!res.ok) {
                console.warn('[LEVEL] Server returned', res.status, 'for level', levelId);
                this.showResult(0, 0, false);
                return;
            }
            
            const data = await res.json();
            console.log('[LEVEL] Result:', data);
            
            if (data.success) {
                await achievementsManager.save(gameManager.currentLevel.id);
                
                if (typeof levelsManager !== 'undefined') {
                    await levelsManager.load();
                }
                
                const nextLevelId = gameManager.currentLevel.id + 1;
                const nextUnlocked = nextLevelId <= 20 && levelsManager.isLevelUnlocked(nextLevelId);
                this.showResult(data.stars, data.score, nextUnlocked);
            } else {
                this.showResult(0, 0, false);
            }
        } catch (err) {
            this.showResult(0, 0, false);
        }
    },

    t(key, fallback) {
        if (localizationManager && localizationManager.t) {
            return localizationManager.t(key, fallback);
        }
        return fallback !== undefined ? fallback : key;
    },

    showResult(stars, score, hasNext) {
        const modal = document.getElementById('result-modal');
        if (!modal) return;

        const titleEl = document.getElementById('result-title');
        const starsEl = document.getElementById('result-stars');
        const scoreEl = document.getElementById('result-score');

        modal.classList.remove('active');
        
        setTimeout(() => {
            const msgEl = document.getElementById('result-message');
            if (stars > 0) {
                if (titleEl) titleEl.textContent = this.t('resultTitle');
                if (starsEl) starsEl.textContent = '⭐'.repeat(stars);
                if (scoreEl && scoreEl.previousElementSibling) {
                    scoreEl.textContent = '+' + score;
                }
                if (msgEl) msgEl.textContent = this.t('resultMessage');
            } else {
                if (titleEl) titleEl.textContent = this.t('resultTitleFail');
                if (starsEl) starsEl.textContent = this.t('tryAgain');
                if (scoreEl) scoreEl.textContent = '';
                if (msgEl) msgEl.textContent = '';
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
