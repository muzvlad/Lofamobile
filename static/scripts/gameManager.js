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

        this.originalItems = level.items ? level.items.map(item => ({ ...item })) : [];
        this.droppedItems = [];

        let chapter = Math.ceil(level.id / 10);
        let levelName = level.name;

        if (typeof localizationManager !== 'undefined' && localizationManager.getScenarioLevelName) {
            let localizedName = localizationManager.getScenarioLevelName(chapter, level.id);
            if (localizedName) {
                levelName = localizedName;
            }
        }

        let l10n = typeof localizationManager !== 'undefined' ? localizationManager : null;
        let starsText = l10n ? l10n.t('emptyStars') : 'emptyStars';

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