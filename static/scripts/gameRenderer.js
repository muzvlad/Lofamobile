const gameRenderer = {
    renderGrid() {
        const grid = document.getElementById('game-grid');
        if (!grid) {
            console.error('[GRID] game-grid element not found!');
            return;
        }
        
        if (!gameManager.currentLevel) {
            console.error('[GRID] currentLevel is null!');
            return;
        }
        
        if (!gameManager.currentLevel.grid) {
            console.error('[GRID] currentLevel.grid is missing!', gameManager.currentLevel);
            return;
        }
        
        const level = gameManager.currentLevel;
        const rows = level.grid.length;
        const cols = level.grid[0].length;
        
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        grid.innerHTML = '';

        const gender = auth.getUser()?.gender || 'girl';
        const performer = auth.getUser()?.performer || 'builder';
        const themeData = themeManager.getTheme(gender);
        const charImage = themeData.characters && themeData.characters[performer] ? themeData.characters[performer] : '/frontend/src/components/character/' + performer + '.webp';
        const levelId = level.id || 1;
        
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

const getAssetUrl = (type) => {
            if (levelId === 10 && gender === 'girl') {
                if (type === 'apple') return '/frontend/src/assets/components/apple.webp';
                if (type === 'fridge') return '/frontend/src/assets/components/fridge.webp';
                if (type === 'oven') return '/frontend/src/assets/components/oven.webp';
                if (type === 'rolling_pin') return '/frontend/src/assets/components/rolling_pin.webp';
                if (type === 'puddle_of_milk') return '/frontend/src/assets/components/puddle_of_milk.webp';
                if (type === 'piles_of_flour') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'table') return '/frontend/src/assets/components/table.webp';
                if (type === 'box_apples') return '/frontend/src/assets/components/box_apples.webp';
                if (type === 'brick') return '/frontend/src/assets/components/fridge.webp';
                if (type === 'balk') return '/frontend/src/assets/components/rolling_pin.webp';
                if (type === 'trench') return '/frontend/src/assets/components/puddle_of_milk.webp';
            }
            if (levelId === 5 && gender === 'boy' && type === 'trench') {
                return '/frontend/src/assets/components/trench.webp';
            }
            if (levelId === 9 && gender === 'girl') {
                if (type === 'flour') return '/frontend/src/assets/components/flour.webp';
                if (type === 'bowl_of_dough') return '/frontend/src/assets/components/bowl_of_dough.webp';
                if (type === 'rolling_pin') return '/frontend/src/assets/components/rolling_pin.webp';
                if (type === 'piles_of_flour') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'puddle_of_juice') return '/frontend/src/assets/components/puddle_of_juice.webp';
                if (type === 'puddle_of_milk') return '/frontend/src/assets/components/puddle_of_milk.webp';
                if (type === 'table') return '/frontend/src/assets/components/table.webp';
                if (type === 'balk') return '/frontend/src/assets/components/rolling_pin.webp';
                if (type === 'brick') return '/frontend/src/assets/components/piles_of_flour.webp';
            }
            if (levelId === 8 && gender === 'girl') {
                if (type === 'broom') return '/frontend/src/assets/components/broom.webp';
                if (type === 'trash_bag') return '/frontend/src/assets/components/trash_bag.webp';
                if (type === 'table') return '/frontend/src/assets/components/table.webp';
                if (type === 'broken_lid') return '/frontend/src/assets/components/broken_lid.webp';
                if (type === 'piles_of_flour') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'puddle_of_milk') return '/frontend/src/assets/components/puddle_of_milk.webp';
                if (type === 'fridge') return '/frontend/src/assets/components/fridge.webp';
                if (type === 'balk') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'brick') return '/frontend/src/assets/components/table.webp';
            }
            if (levelId === 7 && gender === 'girl') {
                if (type === 'apple') return '/frontend/src/assets/components/apple.webp';
                if (type === 'puddle_of_milk') return '/frontend/src/assets/components/puddle_of_milk.webp';
                if (type === 'puddle_of_juice') return '/frontend/src/assets/components/puddle_of_juice.webp';
                if (type === 'fridge') return '/frontend/src/assets/components/fridge.webp';
                if (type === 'crane') return '/frontend/src/assets/components/crane.webp';
                if (type === 'table') return '/frontend/src/assets/components/table.webp';
                if (type === 'piles_of_flour') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'brick') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'bricks') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'wall_bricks') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'wall_girl') return '/frontend/src/assets/components/piles_of_flour.webp';
            }
            if (levelId === 6 && gender === 'girl') {
                if (type === 'flour') return '/frontend/src/assets/components/flour.webp';
                if (type === 'puddle_of_juice') return '/frontend/src/assets/components/puddle_of_juice.webp';
                if (type === 'fridge') return '/frontend/src/assets/components/fridge.webp';
                if (type === 'piles_of_flour') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'brick') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'bricks') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'wall_bricks') return '/frontend/src/assets/components/piles_of_flour.webp';
                if (type === 'wall_girl') return '/frontend/src/assets/components/piles_of_flour.webp';
            }
            let fileName = assetMap[type];
            if (!fileName) {
                fileName = assetMap[type + '_' + gender];
            }
            if (!fileName) {
                fileName = assetMap[type + (gender === 'girl' ? '_boy' : '_girl')];
            }
            if (!fileName) return null;
            return '/frontend/src/assets/components/' + fileName;
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
                        let wallAssetType;
                        if (gender === 'girl' && levelId === 6) {
                            if ((x === 0 && y === 3) || (x === 1 && y === 2) || (x === 2 && y === 1)) {
                                wallAssetType = 'piles_of_flour';
                            } else {
                                wallAssetType = 'brick';
                            }
                        } else if (levelId === 6) {
                            wallAssetType = 'brick';
                        } else if (gender === 'boy' && levelId === 2) {
                            wallAssetType = 'wall_crushed';
                        } else if (gender === 'girl') {
                            if (levelId === 2) {
                                if (x === 0 && y === 1) {
                                    wallAssetType = 'wall_girl_cat';
                                } else if (x === 2 && y === 1) {
                                    wallAssetType = 'wall_girl_oven';
                                } else if (x === 2 && y === 2) {
                                    wallAssetType = 'wall_girl_pot';
                                } else {
                                    wallAssetType = 'wall_girl';
                                }
                            } else if (levelId === 3) {
                                if (x === 3 && y === 0) {
                                    wallAssetType = 'wall_girl_oven';
                                } else if (x === 2 && y === 1) {
                                    wallAssetType = 'wall_girl_fridge';
                                } else {
                                    wallAssetType = 'wall_girl';
                                }
                            } else if (gender === 'girl' && levelId === 4) {
                                wallAssetType = 'wall_girl_milk';
                                
                            } else if (gender === 'girl' && levelId === 5) {
                                if (x === 1 && (y === 0 || y === 1)) {
                                    wallAssetType = 'wall_girl';
                                } else if (x === 2 && y === 3) {
                                    wallAssetType = 'wall_girl';
                                } else {
                                    wallAssetType = 'wall_girl_milk';
                                }
                            } else {
                                wallAssetType = 'wall_' + gender;
                            }
                        } else if (gender === 'boy' && levelId === 5 && x === 2 && y === 3) {
                            wallAssetType = 'trench';
                        } else {
                            wallAssetType = 'wall_' + gender;
                        }
                        const wallImg = document.createElement('img');
                        wallImg.src = getAssetUrl(wallAssetType);
                        if (!wallImg.src) wallImg.src = getAssetUrl('wall');
                        wallImg.alt = '🧱';
                        wallImg.style.width = '80%';
                        wallImg.style.height = '80%';
                        wallImg.style.objectFit = 'contain';
                        wallImg.style.imageRendering = '-webkit-optimize-contrast';
                        if (levelId === 5 && y === 2 && gender === 'boy') {
                            wallImg.style.transform = 'translate(-50%, -50%) rotate(90deg)';
                        } else {
                            wallImg.style.transform = 'translate(-50%, -50%)';
                        }
                        cell.appendChild(wallImg);
                        break;
                    case 6:
                        cell.classList.add('wall');
                        let case6Asset = 'brick.webp';
                        if (gender === 'girl' && levelId === 10) {
                            if (x === 3 && y === 1) {
                                case6Asset = 'rolling_pin.webp';
                            } else if (x === 1 && y === 3) {
                                case6Asset = 'puddle_of_milk.webp';
                            } else if (x === 3 && y === 3) {
                                case6Asset = 'piles_of_flour.webp';
                            } else {
                                case6Asset = 'fridge.webp';
                            }
                        }
                        const brickImg6 = document.createElement('img');
                        brickImg6.src = '/frontend/src/assets/components/' + case6Asset;
                        brickImg6.alt = '🧱';
                        brickImg6.style.width = '80%';
                        brickImg6.style.height = '80%';
                        brickImg6.style.objectFit = 'contain';
                        brickImg6.style.imageRendering = '-webkit-optimize-contrast';
                        brickImg6.style.transform = 'translate(-50%, -50%)';
                        cell.appendChild(brickImg6);
                        break;
                    case 7:
                        if (levelId === 10) {
                            cell.classList.add('warehouse');
                        } else {
                            cell.classList.add('wall');
                        }
                        let case7Asset = 'warehouse.webp';
                        if (gender === 'girl' && levelId === 10) {
                            if (x === 4 && y === 0) {
                                case7Asset = 'box_apples.webp';
                            } else if (x === 3 && y === 0) {
                                case7Asset = 'fridge.webp';
                            } else {
                                case7Asset = 'table.webp';
                            }
                        } else if (gender === 'girl' && levelId === 7 && x === 2 && y === 2) {
                            case7Asset = 'fridge.webp';
                        }
                        const warehouseImg = document.createElement('img');
                        warehouseImg.src = '/frontend/src/assets/components/' + case7Asset;
                        warehouseImg.alt = 'warehouse';
                        warehouseImg.style.width = '80%';
                        warehouseImg.style.height = '80%';
                        warehouseImg.style.objectFit = 'contain';
                        warehouseImg.style.imageRendering = '-webkit-optimize-contrast';
                        warehouseImg.style.transform = 'translate(-50%, -50%)';
                        cell.appendChild(warehouseImg);
                        break;
case 8:
                        cell.classList.add('wall');
                        let case8Asset = 'dump_truck.webp';
                        if (gender === 'girl' && levelId === 10 && x === 4 && y === 4) {
                            case8Asset = 'table.webp';
                        } else if (gender === 'girl' && levelId === 8 && x === 3 && y === 1) {
                            case8Asset = 'fridge.webp';
                        }
                        const truckImg = document.createElement('img');
                        truckImg.src = '/frontend/src/assets/components/' + case8Asset;
                        truckImg.alt = 'truck';
                        truckImg.style.width = '80%';
                        truckImg.style.height = '80%';
                        truckImg.style.objectFit = 'contain';
                        truckImg.style.imageRendering = '-webkit-optimize-contrast';
                        truckImg.style.transform = 'translate(-50%, -50%)';
                        cell.appendChild(truckImg);
                        break;
                    case 9:
                        cell.classList.add('wall');
                        let case9Asset = 'balk.webp';
                        if (gender === 'girl' && levelId === 8) {
                            if ((x === 0 && y === 2) || (x === 1 && y === 2)) {
                                case9Asset = 'piles_of_flour.webp';
                            } else if (x === 2 && y === 2) {
                                case9Asset = 'puddle_of_milk.webp';
                            } else {
                                case9Asset = 'piles_of_flour.webp';
                            }
                        } else if (gender === 'girl' && levelId === 9) {
                            if (x === 0 && y === 1) {
                                case9Asset = 'rolling_pin.webp';
                            } else if (x === 1 && y === 1) {
                                case9Asset = 'piles_of_flour.webp';
                            } else if (x === 3 && y === 1) {
                                case9Asset = 'puddle_of_juice.webp';
                            } else if (x === 3 && y === 2) {
                                case9Asset = 'puddle_of_milk.webp';
                            } else {
                                case9Asset = 'piles_of_flour.webp';
                            }
                        }
                        const BalkImg = document.createElement('img');
                        BalkImg.src = '/frontend/src/assets/components/' + case9Asset;
                        BalkImg.alt = 'balk';
                        BalkImg.style.width = '80%';
                        BalkImg.style.height = '80%';
                        BalkImg.style.objectFit = 'contain';
                        BalkImg.style.imageRendering = '-webkit-optimize-contrast';
                        BalkImg.style.transform = 'translate(-50%, -50%)';
                        cell.appendChild(BalkImg);
                        break;
                    case 2:
                        cell.classList.add('start');
                        break;
                    case 3: 
                        cell.classList.add('finish');
                        const finishImg = document.createElement('img');
                        
                        let finishAsset = null;
                        
                        const originalItems = gameManager.originalItems || [];
                        
                        if (gender === 'girl' && levelId === 9) {
                            finishAsset = 'table.webp';
                        } else if (levelId === 9) {
                            finishAsset = 'warehouse.webp';
                        } else if (gender === 'girl' && levelId === 10) {
                            finishAsset = 'oven.webp';
                        } else if (levelId === 10) {
                            finishAsset = 'headquarters.webp';
                        } else if (gender === 'girl' && levelId === 3) {
                            finishAsset = 'table.webp';
                        } else if (gender === 'girl' && levelId === 4) {
                            finishAsset = 'bowl_of_dough.webp';
                        } else if (gender === 'girl' && levelId === 5) {
                            finishAsset = 'fridge.webp';
                        } else if (gender === 'girl' && levelId === 6) {
                            finishAsset = 'oven.webp';
                        } else if (gender === 'girl' && levelId === 7) {
                            finishAsset = 'table.webp';
                        } else if (gender === 'girl' && levelId === 8) {
                            finishAsset = 'broken_lid.webp';
                        } else if (gender === 'girl' && levelId === 9) {
                            finishAsset = 'table.webp';
                        } else if (levelId === 4 || levelId === 5 || levelId === 6 || levelId === 7 || levelId === 8) {
                            finishAsset = 'foundation.webp';
                        } else if (originalItems.length > 0) {
                            const hasFlag = originalItems.some(item => item.type === 'flag');
                            const firstItem = originalItems[0];
                            const firstItemType = firstItem.type;
                            
                            if (hasFlag) {
                                finishAsset = 'flag.webp';
                            } else if (gender === 'girl') {
                                if (firstItemType === 'broom') finishAsset = 'oven.webp';
                                else if (firstItemType === 'apples') finishAsset = 'oven.webp';
                                else if (firstItemType === 'flour') finishAsset = 'bowl_of_dough.webp';
                                else finishAsset = 'fridge.webp';
                            } else {
                                if (firstItemType === 'flag_box') finishAsset = 'dump_truck.webp';
                                else if (firstItemType === 'nails') finishAsset = 'foundation.webp';
                                else finishAsset = 'headquarters.webp';
                            }
                        } else {
                            if (gender === 'girl') {
                                if (levelId === 3) finishAsset = 'table.webp';
                                else if (levelId === 4) finishAsset = 'bowl_of_dough.webp';
                                else finishAsset = 'fridge.webp';
                            } else {
                                if (levelId === 10) finishAsset = 'crane.webp';
                                else finishAsset = 'headquarters.webp';
                            }
                        }
                        
                        finishImg.src = '/frontend/src/assets/components/' + finishAsset;
                        finishImg.alt = '🎯';
                        finishImg.style.width = '80%';
                        finishImg.style.height = '80%';
                        finishImg.style.objectFit = 'contain';
                        finishImg.style.imageRendering = '-webkit-optimize-contrast';
                        cell.appendChild(finishImg);
                        break;
                    case 4:
                    case 5:
                        cell.classList.add('wall');
                        let wallAssetType4;
                        if (gender === 'girl' && levelId === 6) {
                            if (x === 1 && y === 0) {
                                wallAssetType4 = 'puddle_of_juice';
                            } else if (x === 3 && y === 0) {
                                wallAssetType4 = 'fridge';
                            } else {
                                wallAssetType4 = 'wall_bricks';
                            }
                        } else if (gender === 'girl' && levelId === 7) {
                            if (x === 1 && y === 0) {
                                wallAssetType4 = 'puddle_of_milk';
                            } else if (x === 0 && y === 2) {
                                wallAssetType4 = 'puddle_of_milk';
                            } else if (x === 3 && y === 1) {
                                wallAssetType4 = 'puddle_of_juice';
                            } else if (x === 3 && y === 2) {
                                wallAssetType4 = 'crane';
                            } else {
                                wallAssetType4 = 'wall_bricks';
                            }
                        } else if (gender === 'girl' && levelId === 8) {
                            if (x === 3 && y === 2) {
                                wallAssetType4 = 'table';
                            } else {
                                wallAssetType4 = 'wall_bricks';
                            }
                        } else if (gender === 'girl' && levelId === 3) {
                            if (x === 3 && y === 0) {
                                wallAssetType4 = 'wall_girl_oven';
                            } else if (x === 2 && y === 1) {
                                wallAssetType4 = 'wall_girl_fridge';
                            } else {
                                wallAssetType4 = 'wall_bricks';
                            }
                        } else if (gender === 'girl' && levelId === 4) {
                            wallAssetType4 = 'wall_girl_milk';
                            
} else if (gender === 'girl' && levelId === 5) {
                            if (x === 1 && (y === 0 || y === 1)) {
                                wallAssetType4 = 'wall_girl';
                            } else if (x === 2 && y === 3) {
                                wallAssetType4 = 'wall_girl';
                            } else {
                                wallAssetType4 = 'wall_girl_milk';
                            }
                        } else if (gender === 'boy' && levelId === 5 && x === 2 && y === 3) {
                            wallAssetType4 = 'trench';
                        } else if (gender === 'girl' && levelId === 10) {
                            if (x === 3 && y === 0) {
                                wallAssetType4 = 'fridge';
                            } else {
                                wallAssetType4 = 'wall_bricks';
                            }
                        } else {
                            wallAssetType4 = 'wall_bricks';
                        }
                        const bricksImg = document.createElement('img');
                        bricksImg.src = getAssetUrl(wallAssetType4);
                        if (!bricksImg.src) bricksImg.src = '/frontend/src/assets/components/bricks.webp';
                        bricksImg.alt = '🧱';
                        bricksImg.style.width = '80%';
                        bricksImg.style.height = '80%';
                        bricksImg.style.objectFit = 'contain';
                        bricksImg.style.imageRendering = '-webkit-optimize-contrast';
                        bricksImg.style.transform = 'translate(-50%, -50%)';
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
                    
                    var playerImg = document.createElement('img');
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
        const commands = [
            { id: 'up', icon: '⬆️' },
            { id: 'down', icon: '⬇️' },
            { id: 'left', icon: '⬅️' },
            { id: 'right', icon: '➡️' },
            { id: 'jump', icon: '🦘' },
            { id: 'turn', icon: '↩️' },
            { id: 'collect', icon: '✋' },
            { id: 'drop', icon: '📦' }
        ];

        const l10n = typeof localizationManager !== 'undefined' ? localizationManager : null;

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

        const cmdIcons = {
            up: '⬆️',
            down: '⬇️',
            left: '⬅️',
            right: '➡️',
            jump: '🦘',
            turn: '↩️',
            collect: '✋',
            drop: '📦'
        };

        const l10n = typeof localizationManager !== 'undefined' ? localizationManager : null;

        gameManager.editorCommands.forEach((cmd, index) => {
            const cmdDiv = document.createElement('div');
            cmdDiv.className = 'editor-command';
            cmdDiv.dataset.index = index;
            cmdDiv.draggable = true;

            const icon = cmdIcons[cmd] || '❓';
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

    removeItemFromGrid(x, y) {
        const grid = document.getElementById('game-grid');
        if (!grid) return;
        
        const cells = grid.querySelectorAll('.grid-cell');
        cells.forEach(cell => {
            if (parseInt(cell.dataset.x) === x && parseInt(cell.dataset.y) === y) {
                cell.classList.remove('item');
                cell.innerHTML = '';
            }
        });
    },

    getAssetUrl(type, levelId = null, genderOverride = null) {
        const gender = genderOverride || auth.getUser()?.gender || 'boy';
        
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
            flour: 'flour.webp',
            apples: 'apple.webp',
            broom: 'broom.webp',
            pot: 'pot.webp',
            rolling_pin: 'rolling_pin.webp',
            box_apples: 'box_apples.webp',
            nails: 'nails.webp',
            flag_box: 'dump_truck.webp',
            box_tools: 'box_tools.webp',
            wood_boards: 'wood_boards.webp',
            warehouse: 'warehouse.webp',
            dump_truck: 'dump_truck.webp',
            balk: 'balk.webp',
            player_girl: 'cat.webp',
            player_boy: 'crane.webp',
            wall_girl_cat: 'cat.webp',
            wall_girl_oven: 'oven.webp',
            wall_girl_pot: 'pot.webp',
            puddle_of_juice: 'puddle_of_juice.webp',
            fridge: 'fridge.webp',
            piles_of_flour: 'piles_of_flour.webp',
            puddle_of_milk: 'puddle_of_milk.webp',
            crane: 'crane.webp',
            table: 'table.webp',
            apple: 'apple.webp',
            trash_bag: 'trash_bag.webp',
            broken_lid: 'broken_lid.webp'
        };

        if (levelId === 6 && gender === 'girl') {
            if (type === 'flour') return '/frontend/src/assets/components/flour.webp';
            if (type === 'puddle_of_juice') return '/frontend/src/assets/components/puddle_of_juice.webp';
            if (type === 'fridge') return '/frontend/src/assets/components/fridge.webp';
            if (type === 'piles_of_flour') return '/frontend/src/assets/components/piles_of_flour.webp';
            if (type === 'brick') return '/frontend/src/assets/components/piles_of_flour.webp';
            if (type === 'bricks') return '/frontend/src/assets/components/piles_of_flour.webp';
            if (type === 'wall_bricks') return '/frontend/src/assets/components/piles_of_flour.webp';
            if (type === 'wall_girl') return '/frontend/src/assets/components/piles_of_flour.webp';
        }

        let fileName = assetMap[type];
        if (!fileName) {
            fileName = assetMap[type + '_' + gender];
        }
        if (!fileName) {
            fileName = assetMap[type + '_' + (gender === 'girl' ? 'boy' : 'girl')];
        }
        if (!fileName) return null;
        return '/frontend/src/assets/components/' + fileName;
    }
};

window.gameRenderer = gameRenderer;