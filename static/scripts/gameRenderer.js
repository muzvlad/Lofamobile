const gameRenderer = {
    renderGrid() {
        const grid = document.getElementById('game-grid');
        if (!grid) return;

        if (!gameManager.currentLevel) return;

        if (!gameManager.currentLevel.grid) return;

        const level = gameManager.currentLevel;
        const rows = level.grid.length;
        const cols = level.grid[0].length;
        const levelId = level.id || 1;

        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        grid.innerHTML = '';

        const gender = auth.getUser()?.gender || 'girl';
        const performer = auth.getUser()?.performer || 'builder';
        const themeData = themeManager.getTheme(gender);
        const charImage = themeData.characters && themeData.characters[performer] ? themeData.characters[performer] : '/frontend/src/components/character/' + performer + '.webp';

        const assetMap = {
            wall_girl: 'puddle_of_juice.webp',
            wall_boy: 'trench.webp',
            wall_bricks: 'bricks.webp',
            wall_crushed: 'crushed_stone.webp',
            brick: 'brick.webp',
            bricks: 'bricks.webp',
            start_girl: null,
            start_boy: null,
            finish_default_girl: 'oven.webp',
            finish_default_boy: 'crane.webp',
            finish_flag: 'flag.webp',
            'flour': 'flour.webp',
            'apples': 'apple.webp',
            'broom': 'broom.webp',
            'pot': 'pot.webp',
            'rolling_pin': 'rolling_pin.webp',
            'box_apples': 'box_apples.webp',
            'nails': 'nails.webp',
            'flag_box': 'dump_truck.webp',
            'flag': 'flag.webp',
            'box_tools': 'box_tools.webp',
            'wood_boards': 'wood_boards.webp',
            'warehouse': 'warehouse.webp',
            'dump_truck': 'dump_truck.webp',
            'balk': 'balk.webp',
            player_girl: 'cat.webp',
            player_boy: 'crane.webp',
            wall_girl_cat: 'cat.webp',
            wall_girl_oven: 'oven.webp',
            wall_girl_fridge: 'fridge.webp',
            wall_girl_milk: 'puddle_of_milk.webp',
            wall_girl_pot: 'pot.webp'
        };

        const assetPath = (type) => '/frontend/src/assets/components/' + type;

        const levelAssetOverride = {
            10: {
                girl: {
                    'apple': assetPath('apple.webp'),
                    'fridge': assetPath('fridge.webp'),
                    'oven': assetPath('oven.webp'),
                    'rolling_pin': assetPath('rolling_pin.webp'),
                    'puddle_of_milk': assetPath('puddle_of_milk.webp'),
                    'piles_of_flour': assetPath('piles_of_flour.webp'),
                    'table': assetPath('table.webp'),
                    'box_apples': assetPath('box_apples.webp'),
                    'brick': assetPath('fridge.webp'),
                    'balk': assetPath('rolling_pin.webp'),
                    'trench': assetPath('puddle_of_milk.webp')
                }
            },
            5: {
                boy: {
                    'trench': assetPath('trench.webp')
                }
            },
            9: {
                girl: {
                    'flour': assetPath('flour.webp'),
                    'bowl_of_dough': assetPath('bowl_of_dough.webp'),
                    'rolling_pin': assetPath('rolling_pin.webp'),
                    'piles_of_flour': assetPath('piles_of_flour.webp'),
                    'puddle_of_juice': assetPath('puddle_of_juice.webp'),
                    'puddle_of_milk': assetPath('puddle_of_milk.webp'),
                    'table': assetPath('table.webp'),
                    'balk': assetPath('rolling_pin.webp'),
                    'brick': assetPath('piles_of_flour.webp')
                }
            },
            8: {
                girl: {
                    'broom': assetPath('broom.webp'),
                    'trash_bag': assetPath('trash_bag.webp'),
                    'table': assetPath('table.webp'),
                    'broken_lid': assetPath('broken_lid.webp'),
                    'piles_of_flour': assetPath('piles_of_flour.webp'),
                    'puddle_of_milk': assetPath('puddle_of_milk.webp'),
                    'fridge': assetPath('fridge.webp'),
                    'balk': assetPath('piles_of_flour.webp'),
                    'brick': assetPath('table.webp')
                }
            },
            7: {
                girl: {
                    'apple': assetPath('apple.webp'),
                    'puddle_of_milk': assetPath('puddle_of_milk.webp'),
                    'puddle_of_juice': assetPath('puddle_of_juice.webp'),
                    'fridge': assetPath('fridge.webp'),
                    'crane': assetPath('crane.webp'),
                    'table': assetPath('table.webp'),
                    'piles_of_flour': assetPath('piles_of_flour.webp'),
                    'brick': assetPath('piles_of_flour.webp'),
                    'bricks': assetPath('piles_of_flour.webp'),
                    'wall_bricks': assetPath('piles_of_flour.webp'),
                    'wall_girl': assetPath('piles_of_flour.webp')
                }
            },
            6: {
                girl: {
                    'flour': assetPath('flour.webp'),
                    'puddle_of_juice': assetPath('puddle_of_juice.webp'),
                    'fridge': assetPath('fridge.webp'),
                    'piles_of_flour': assetPath('piles_of_flour.webp'),
                    'brick': assetPath('piles_of_flour.webp'),
                    'bricks': assetPath('piles_of_flour.webp'),
                    'wall_bricks': assetPath('piles_of_flour.webp'),
                    'wall_girl': assetPath('piles_of_flour.webp')
                }
            }
        };

        const getAssetUrl = (type) => {
            const lvlOverrides = levelAssetOverride[levelId];
            if (lvlOverrides) {
                const genderOverrides = lvlOverrides[gender];
                if (genderOverrides && genderOverrides[type]) {
                    return genderOverrides[type];
                }
            }
            let fileName = assetMap[type];
            if (!fileName) {
                fileName = assetMap[type + '_' + gender];
            }
            if (!fileName) {
                fileName = assetMap[type + (gender === 'girl' ? '_boy' : '_girl')];
            }
            if (!fileName) return null;
            return assetPath(fileName);
        };

        const wallOverrides = {
            2: {
                girl: {
                    default: 'wall_girl',
                    specific: { '0,1': 'wall_girl_cat', '2,1': 'wall_girl_oven', '2,2': 'wall_girl_pot' }
                },
                boy: { default: 'wall_crushed', specific: {} }
            },
            3: {
                girl: {
                    default: 'wall_girl',
                    specific: { '3,0': 'wall_girl_oven', '2,1': 'wall_girl_fridge' }
                },
                boy: { default: 'wall_boy', specific: {} }
            },
            4: {
                girl: { default: 'wall_girl_milk', specific: {} },
                boy: { default: 'wall_boy', specific: {} }
            },
            5: {
                girl: {
                    default: 'wall_girl_milk',
                    specific: { '1,0': 'wall_girl', '1,1': 'wall_girl', '2,3': 'wall_girl' }
                },
                boy: {
                    default: 'wall_boy',
                    specific: { '2,3': 'trench' }
                }
            },
            6: {
                girl: {
                    default: 'brick',
                    specific: { '0,3': 'piles_of_flour', '1,2': 'piles_of_flour', '2,1': 'piles_of_flour' }
                },
                boy: { default: 'brick', specific: {} }
            }
        };

        const getWallAsset = (x, y) => {
            const cfg = wallOverrides[levelId];
            if (!cfg) return 'wall_' + gender;
            const gcfg = cfg[gender];
            if (!gcfg) return 'wall_' + gender;
            const key = x + ',' + y;
            return gcfg.specific[key] || gcfg.default;
        };

        const case6Overrides = {
            10: {
                girl: {
                    '3,1': 'rolling_pin.webp',
                    '1,3': 'puddle_of_milk.webp',
                    '3,3': 'piles_of_flour.webp'
                }
            }
        };

        const case7Overrides = {
            10: {
                girl: {
                    '4,0': 'box_apples.webp',
                    '3,0': 'fridge.webp'
                }
            },
            7: {
                girl: {
                    '2,2': 'fridge.webp'
                }
            }
        };

        const case8Overrides = {
            10: {
                girl: { '4,4': 'table.webp' }
            },
            8: {
                girl: { '3,1': 'fridge.webp' }
            }
        };

        const case9Overrides = {
            8: {
                girl: {
                    '0,2': 'piles_of_flour.webp',
                    '1,2': 'piles_of_flour.webp',
                    '2,2': 'puddle_of_milk.webp'
                }
            },
            9: {
                girl: {
                    '0,1': 'rolling_pin.webp',
                    '1,1': 'piles_of_flour.webp',
                    '3,1': 'puddle_of_juice.webp',
                    '3,2': 'puddle_of_milk.webp'
                }
            }
        };

        const case45Overrides = {
            6: {
                girl: {
                    '1,0': 'puddle_of_juice',
                    '3,0': 'fridge'
                }
            },
            7: {
                girl: {
                    '1,0': 'puddle_of_milk',
                    '0,2': 'puddle_of_milk',
                    '3,1': 'puddle_of_juice',
                    '3,2': 'crane'
                }
            },
            8: {
                girl: {
                    '3,2': 'table'
                }
            },
            3: {
                girl: {
                    '3,0': 'wall_girl_oven',
                    '2,1': 'wall_girl_fridge'
                }
            },
            4: {
                girl: { __default: 'wall_girl_milk' }
            },
            5: {
                girl: {
                    '1,0': 'wall_girl',
                    '1,1': 'wall_girl',
                    '2,3': 'wall_girl'
                },
                boy: {
                    '2,3': 'trench'
                }
            },
            10: {
                girl: {
                    '3,0': 'fridge'
                }
            }
        };

        const getCase45Asset = (x, y) => {
            const cfg = case45Overrides[levelId];
            if (!cfg) return 'wall_bricks';
            const gcfg = cfg[gender];
            if (!gcfg) return 'wall_bricks';
            const key = x + ',' + y;
            const overridden = gcfg[key];
            if (overridden) return overridden;
            return gcfg['__default'] || 'wall_bricks';
        };

        const finishAssetOverrides = {
            9: {
                girl: 'table.webp',
                default: 'warehouse.webp'
            },
            10: {
                girl: 'oven.webp',
                default: 'headquarters.webp'
            },
            3: {
                girl: 'table.webp'
            },
            4: {
                girl: 'bowl_of_dough.webp'
            },
            5: {
                girl: 'fridge.webp'
            },
            6: {
                girl: 'oven.webp'
            },
            7: {
                girl: 'table.webp'
            },
            8: {
                girl: 'broken_lid.webp'
            }
        };

        const getDefaultFinish = (gender) => {
            if (gender === 'girl') {
                if (levelId === 3) return 'table.webp';
                if (levelId === 4) return 'bowl_of_dough.webp';
                return 'fridge.webp';
            }
            if (levelId === 10) return 'crane.webp';
            return 'headquarters.webp';
        };

        const itemMap = {};
        if (level.items) {
            level.items.forEach(item => {
                const key = item.x + ',' + item.y;
                itemMap[key] = item.type;
            });
        }

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.draggable = false;
                cell.ondragstart = () => false;

                const cellType = level.grid[y][x];
                const isPlayer = (level.player.x === x && level.player.y === y);
                const itemKey = x + ',' + y;
                const itemType = itemMap[itemKey];

                switch (cellType) {
                    case 1:
                        cell.classList.add('wall');
                        const wallAssetType = getWallAsset(x, y);
                        const wallImg = document.createElement('img');
                        let wallUrl = getAssetUrl(wallAssetType);
                        if (!wallUrl) wallUrl = getAssetUrl('wall');
                        wallImg.src = wallUrl;
                        wallImg.alt = 'wall';
                        wallImg.style.cssText = 'width:80%;height:80%;object-fit:contain;image-rendering:-webkit-optimize-contrast;';
                        if (levelId === 5 && y === 2 && gender === 'boy') {
                            wallImg.style.transform = 'translate(-50%, -50%) rotate(90deg)';
                        } else {
                            wallImg.style.transform = 'translate(-50%, -50%)';
                        }
                        cell.appendChild(wallImg);
                        break;
                    case 6:
                        cell.classList.add('wall');
                        const lvl6cfg = case6Overrides[levelId];
                        let case6Asset = 'brick.webp';
                        if (lvl6cfg && lvl6cfg[gender]) {
                            const key6 = x + ',' + y;
                            case6Asset = lvl6cfg[gender][key6] || 'fridge.webp';
                        }
                        const brickImg6 = document.createElement('img');
                        brickImg6.src = assetPath(case6Asset);
                        brickImg6.alt = 'brick';
                        brickImg6.style.cssText = 'width:80%;height:80%;object-fit:contain;image-rendering:-webkit-optimize-contrast;transform:translate(-50%, -50%);';
                        cell.appendChild(brickImg6);
                        break;
                    case 7:
                        if (levelId === 10) {
                            cell.classList.add('warehouse');
                        } else {
                            cell.classList.add('wall');
                        }
                        const lvl7cfg = case7Overrides[levelId];
                        let case7Asset = 'warehouse.webp';
                        if (lvl7cfg && lvl7cfg[gender]) {
                            const key7 = x + ',' + y;
                            case7Asset = lvl7cfg[gender][key7] || case7Asset;
                        }
                        const warehouseImg = document.createElement('img');
                        warehouseImg.src = assetPath(case7Asset);
                        warehouseImg.alt = 'warehouse';
                        warehouseImg.style.cssText = 'width:80%;height:80%;object-fit:contain;image-rendering:-webkit-optimize-contrast;transform:translate(-50%, -50%);';
                        cell.appendChild(warehouseImg);
                        break;
                    case 8:
                        cell.classList.add('wall');
                        const lvl8cfg = case8Overrides[levelId];
                        let case8Asset = 'dump_truck.webp';
                        if (lvl8cfg && lvl8cfg[gender]) {
                            const key8 = x + ',' + y;
                            case8Asset = lvl8cfg[gender][key8] || case8Asset;
                        }
                        const truckImg = document.createElement('img');
                        truckImg.src = assetPath(case8Asset);
                        truckImg.alt = 'truck';
                        truckImg.style.cssText = 'width:80%;height:80%;object-fit:contain;image-rendering:-webkit-optimize-contrast;transform:translate(-50%, -50%);';
                        cell.appendChild(truckImg);
                        break;
                    case 9:
                        cell.classList.add('wall');
                        const lvl9cfg = case9Overrides[levelId];
                        let case9Asset = 'balk.webp';
                        if (lvl9cfg && lvl9cfg[gender]) {
                            const key9 = x + ',' + y;
                            case9Asset = lvl9cfg[gender][key9] || case9Asset;
                        }
                        const BalkImg = document.createElement('img');
                        BalkImg.src = assetPath(case9Asset);
                        BalkImg.alt = 'balk';
                        BalkImg.style.cssText = 'width:80%;height:80%;object-fit:contain;image-rendering:-webkit-optimize-contrast;transform:translate(-50%, -50%);';
                        cell.appendChild(BalkImg);
                        break;
                    case 2:
                        cell.classList.add('start');
                        break;
                    case 3:
                        cell.classList.add('finish');
                        const finishImg = document.createElement('img');

                        let finishAsset = null;
                        const lvlFinish = finishAssetOverrides[levelId];
                        if (lvlFinish) {
                            finishAsset = lvlFinish[gender] || lvlFinish.default || null;
                        }

                        if (!finishAsset) {
                            const originalItems = gameManager.originalItems || [];
                            if (levelId >= 4 && levelId <= 8 && gender === 'boy') {
                                finishAsset = 'foundation.webp';
                            } else if (originalItems.length > 0) {
                                const hasFlag = originalItems.some(item => item.type === 'flag');
                                const firstItem = originalItems[0];

                                if (hasFlag) {
                                    finishAsset = 'flag.webp';
                                } else if (gender === 'girl') {
                                    const t = firstItem.type;
                                    if (t === 'broom') finishAsset = 'oven.webp';
                                    else if (t === 'apples') finishAsset = 'oven.webp';
                                    else if (t === 'flour') finishAsset = 'bowl_of_dough.webp';
                                    else finishAsset = 'fridge.webp';
                                } else {
                                    const t = firstItem.type;
                                    if (t === 'flag_box') finishAsset = 'dump_truck.webp';
                                    else if (t === 'nails') finishAsset = 'foundation.webp';
                                    else finishAsset = 'headquarters.webp';
                                }
                            } else {
                                finishAsset = getDefaultFinish(gender);
                            }
                        }

                        finishImg.src = assetPath(finishAsset);
                        finishImg.alt = 'finish';
                        finishImg.style.cssText = 'width:80%;height:80%;object-fit:contain;image-rendering:-webkit-optimize-contrast;';
                        cell.appendChild(finishImg);
                        break;
                    case 4:
                    case 5:
                        cell.classList.add('wall');
                        const wallAssetType45 = getCase45Asset(x, y);
                        const bricksImg = document.createElement('img');
                        let bricksUrl = getAssetUrl(wallAssetType45);
                        if (!bricksUrl) bricksUrl = assetPath('bricks.webp');
                        bricksImg.src = bricksUrl;
                        bricksImg.alt = 'brick';
                        bricksImg.style.cssText = 'width:80%;height:80%;object-fit:contain;image-rendering:-webkit-optimize-contrast;transform:translate(-50%, -50%);';
                        cell.appendChild(bricksImg);
                        break;
                }

                if ((cellType === 0 || cellType === 7) && itemType) {
                    cell.classList.add('item');
                    if (itemType === 'warehouse') {
                        cell.classList.add('warehouse');
                    }
                    if (cellType === 7) {
                        cell.classList.add('warehouse-cell');
                        cell.style.cssText = 'position:relative !important; width:100% !important; height:100% !important;';
                    }
                    const originalItemKeys = (gameManager.originalItems || []).map(i => i.x + ',' + i.y);
                    const isOriginalItem = originalItemKeys.includes(x + ',' + y);
                    const itemsAtCell = level.items.filter(i => i.x === x && i.y === y);

                    if (isOriginalItem) {
                        const itemImg = document.createElement('img');
                        itemImg.src = getAssetUrl(itemType) || getAssetUrl(gender === 'girl' ? 'flour' : 'nails');
                        itemImg.alt = itemType;
                        itemImg.style.cssText = 'width:80%;height:80%;object-fit:contain;image-rendering:-webkit-optimize-contrast;transform:translate(-50%, -50%);';
                        cell.appendChild(itemImg);
                    } else if (itemsAtCell.length > 0) {
                        itemsAtCell.forEach((item, idx) => {
                            const row = Math.floor(idx / 3);
                            const col = idx % 3;
                            const bottom = (2 - row) * 30;
                            const right = col * 30;

                            const container = document.createElement('div');
                            container.style.cssText = 'position:absolute !important;top:0 !important;left:0 !important;width:100% !important;height:100% !important;pointer-events:none;';

                            const itemImg = document.createElement('img');
                            itemImg.src = getAssetUrl(item.type) || getAssetUrl(gender === 'girl' ? 'flour' : 'nails');
                            itemImg.alt = item.type;
                            itemImg.className = 'placed-item';
                            itemImg.style.cssText = 'position:absolute;bottom:' + bottom + '%;right:' + right + '%;width:30%;height:30%;object-fit:contain;image-rendering:-webkit-optimize-contrast;z-index:5;';
                            container.appendChild(itemImg);
                            cell.appendChild(container);
                        });
                    }
                }

                if (isPlayer) {
                    cell.className = 'grid-cell player-cell';
                    cell.dataset.x = x;
                    cell.dataset.y = y;
                    cell.style.cssText = 'background:transparent !important;background-color:transparent !important;border:none !important;box-shadow:none !important;';

                    let playerImg = document.createElement('img');
                    playerImg.src = charImage;
                    playerImg.alt = 'player';
                    playerImg.className = 'player-sprite';
                    playerImg.style.cssText = 'width:80%;height:80%;object-fit:contain;image-rendering:-webkit-optimize-contrast;transition:opacity 0.3s;';
                    cell.appendChild(playerImg);

                    if (gameManager.player && gameManager.player.heldItems && gameManager.player.heldItems.length > 0) {
                        gameManager.player.heldItems.forEach((itemType, idx) => {
                            const heldItemImg = document.createElement('img');
                            heldItemImg.src = getAssetUrl(itemType);
                            heldItemImg.alt = itemType;
                            heldItemImg.className = 'held-item-sprite';
                            const offset = idx * 25;
                            heldItemImg.style.cssText = 'position:absolute;bottom:' + (5 + offset) + '%;right:5%;width:30% !important;height:30% !important;object-fit:contain;image-rendering:-webkit-optimize-contrast;z-index:10;';
                            cell.appendChild(heldItemImg);
                        });
                    }
                }

                grid.appendChild(cell);
            }
        }
    },

    renderCommands() {
        const palette = document.getElementById('commands-palette');
        if (!palette) return;

        palette.innerHTML = '';

        const level = gameManager.currentLevel;
        const availableCommands = level.availableCommands || ['up', 'down', 'left', 'right', 'jump', 'turn'];
        const commands = gameManager.commands;

        const l10n = getL10n();

        commands.forEach(cmd => {
            if (!availableCommands.includes(cmd.id)) return;

            const btn = document.createElement('button');
            btn.className = 'command-btn';
            btn.dataset.command = cmd.id;
            btn.draggable = true;

            const localizedLabel = l10n && l10n.t ? l10n.t(cmd.id) : cmd.id;
            btn.innerHTML = '<span class="command-icon">' + cmd.icon + '</span><span class="command-label">' + localizedLabel + '</span>';

            btn.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', cmd.id);
                e.dataTransfer.setData('source', 'palette');
            });

            btn.addEventListener('click', () => {
                gameManager.addCommand(cmd.id);
            });

            palette.appendChild(btn);
        });
    },

    addCommand(cmdId) {
        gameManager.editorCommands.push(cmdId);
        this.renderEditor();
    },

    renderEditor() {
        const editor = document.getElementById('code-editor');
        if (!editor) return;

        editor.innerHTML = '';

        const l10n = getL10n();
        const placeholder = l10n && l10n.t ? l10n.t('dragHere') : '';
        editor.setAttribute('data-placeholder', placeholder);

        const cmdIconMap = {};
        gameManager.commands.forEach(function(c) { cmdIconMap[c.id] = c.icon; });

        gameManager.editorCommands.forEach((cmd, index) => {
            const cmdDiv = document.createElement('div');
            cmdDiv.className = 'editor-command';
            cmdDiv.dataset.index = index;
            cmdDiv.draggable = true;

            const icon = cmdIconMap[cmd] || '\u2753';
            const localizedLabel = l10n && l10n.t ? l10n.t(cmd) : cmd;
            cmdDiv.innerHTML = '<span class="cmd-icon">' + icon + '</span><span class="cmd-label">' + localizedLabel + '</span>';

            cmdDiv.addEventListener('click', () => {
                gameManager.editorCommands.splice(index, 1);
                this.renderEditor();
            });

            cmdDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', 'REORDER:' + index);
                cmdDiv.classList.add('dragging');
            });

            cmdDiv.addEventListener('dragend', () => {
                cmdDiv.classList.remove('dragging');
            });

            cmdDiv.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            cmdDiv.addEventListener('drop', (e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData('text/plain');
                if (data && data.startsWith('REORDER:')) {
                    const fromIndex = parseInt(data.split(':')[1]);
                    const toIndex = index;
                    if (fromIndex !== toIndex) {
                        gameManager.reorderCommand(fromIndex, toIndex);
                    }
                }
            });

            editor.appendChild(cmdDiv);
        });

        const emptyMsg = document.getElementById('editor-empty-message');
        if (emptyMsg) {
            emptyMsg.style.display = gameManager.editorCommands.length === 0 ? 'block' : 'none';
        }
    },

};

window.gameRenderer = gameRenderer;
