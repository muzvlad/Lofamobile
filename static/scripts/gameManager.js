const gameManager = {
    currentLevel: null,
    player: null,
    commands: [
        { id: 'up', icon: '⬆️', labelKey: 'up', color: null },
        { id: 'down', icon: '⬇️', labelKey: 'down', color: null },
        { id: 'left', icon: '⬅️', labelKey: 'left', color: null },
        { id: 'right', icon: '➡️', labelKey: 'right', color: null },
        { id: 'jump', icon: '🦘', labelKey: 'jump', color: null },
        { id: 'turn', icon: '↩️', labelKey: 'turn', color: null },
        { id: 'collect', icon: '✋', labelKey: 'collect', color: null },
        { id: 'drop', icon: '📦', labelKey: 'drop', color: null }
    ],
    editorCommands: [],
    droppedItems: [],
    originalItems: [],
    originalPlayer: null,

    start(level) {
        this.currentLevel = level;
        this.player = { ...level.player, heldItems: [] };
        this.originalPlayer = { ...level.player };
        this.editorCommands = [];

        if (level.id === 3) {
            level.items = level.items.filter(item => item.type !== 'flag_box');
            level.items.forEach(item => {
                if (item.type === 'nails') item.x += 1;
            });
        }

        this.originalItems = level.items ? level.items.map(item => ({ ...item })) : [];
        this.droppedItems = [];

        var chapter = Math.ceil(level.id / 10);
        var levelName = level.name;

        if (typeof localizationManager !== 'undefined' && localizationManager.getScenarioLevelName) {
            var localizedName = localizationManager.getScenarioLevelName(chapter, level.id);
            if (localizedName) {
                levelName = localizedName;
            }
        }

        var l10n = typeof localizationManager !== 'undefined' ? localizationManager : null;
        var starsText = l10n ? l10n.t('emptyStars') : 'emptyStars';

        document.getElementById('level-name').textContent = levelName;
        document.getElementById('level-stars').textContent = starsText;

        gameRenderer.renderGrid();
        gameRenderer.renderCommands();
        gameRenderer.renderEditor();
    },

    addCommand(cmdId) {
        if (cmdId && cmdId.startsWith('REORDER:')) {
            return;
        }
        gameRenderer.addCommand(cmdId);
    },

    reorderCommand(fromIndex, toIndex) {
        const cmd = this.editorCommands.splice(fromIndex, 1)[0];
        this.editorCommands.splice(toIndex, 0, cmd);
        gameRenderer.renderEditor();
    },

    removeItemFromGrid(x, y) {
        gameRenderer.removeItemFromGrid(x, y);
    },

    movePlayer(player, dir) {
        const dx = [0, 1, 0, -1];
        const dy = [-1, 0, 1, 0];
        
        const newX = player.x + dx[player.direction] * dir;
        const newY = player.y + dy[player.direction] * dir;
        
        if (newX >= 0 && newY >= 0 && 
            this.currentLevel.grid[newY] && 
            this.currentLevel.grid[newY][newX] !== 1) {
            player.x = newX;
            player.y = newY;
        }
    },

    movePlayerLeft(player) {
        player.direction = (player.direction + 3) % 4;
    },

    movePlayerRight(player) {
        player.direction = (player.direction + 1) % 4;
    }
};

window.gameManager = gameManager;

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('code-editor');
    if (editor) {
        editor.addEventListener('dragover', (e) => e.preventDefault());
        editor.addEventListener('drop', (e) => {
            e.preventDefault();
            const cmd = e.dataTransfer.getData('text/plain');
            if (cmd && cmd !== 'null' && !cmd.startsWith('REORDER:')) {
                const srcElement = e.dataTransfer.getData('source');
                if (srcElement === 'grid') return;
                gameManager.addCommand(cmd);
            }
        });
        
        editor.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('editor-command')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', 'REORDER:' + e.target.dataset.index);
            }
        });
        
        editor.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('editor-command')) {
                e.target.classList.remove('dragging');
            }
        });
    }

    const runBtn = document.getElementById('run-code');
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            gameEngine.run();
        });
    }

    const resetBtn = document.getElementById('reset-code');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            gameEngine.reset();
        });
    }
});