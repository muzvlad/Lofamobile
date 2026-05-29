let levelsManager = {
    API_URL: window.location.origin,
    levels: [],
    completedLevels: [],
    currentChapter: 1,

    init: function() {
    },

load: function() {
        let self = this;
        
        let gender = 'boy';
        let token = null;
        
        if (typeof auth !== 'undefined' && auth.getToken) {
            token = auth.getToken();
        }
        
        if (typeof localizationManager !== 'undefined' && localizationManager.currentGender) {
            gender = localizationManager.currentGender;
        }
        
        let fetchOptions = { 
            method: 'GET',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        };
        if (token) {
            fetchOptions.headers['Authorization'] = 'Bearer ' + token;
        }
        
        Promise.all([
            fetch(this.API_URL + '/api/levels?gender=' + gender + '&t=' + Date.now(), fetchOptions),
            token ? fetch(this.API_URL + '/api/progress?t=' + Date.now(), fetchOptions) : Promise.resolve({ ok: true, json: function() { return Promise.resolve({progress: []}); } })
        ])
        .then(function(responses) {
            return Promise.all(responses.map(function(r) { return r.json(); }));
        })
        .then(function(datas) {
            let levelsData = datas[0];
            let progressData = datas[1] || {progress: []};
            
            self.levels = levelsData.levels || [];
            self.completedLevels = progressData.progress || [];
            
            self.render();
            if (typeof leaderboardManager !== 'undefined') {
                leaderboardManager.load();
            }
        })
        .catch(function(err) {
            console.error('Error loading levels:', err);
            self.levels = [];
            self.render();
        });
    },

    isLevelUnlocked: function(levelId) {
        if (levelId === 1) return true;

        let chapter = Math.ceil(levelId / 10);
        let firstLevelInChapter = (chapter - 1) * 10 + 1;

        if (levelId === firstLevelInChapter) {
            if (chapter === 1) return true;
            return this.isLevelUnlocked(firstLevelInChapter - 1);
        }

        let prevLevelId = levelId - 1;

        for (let i = 0; i < this.completedLevels.length; i++) {
            let completedLevelId = parseInt(this.completedLevels[i].level_id);
            if (completedLevelId === prevLevelId && this.completedLevels[i].stars > 0) {
                return true;
            }
        }
        return false;
    },

getLevelLocalized: function(chapter, levelId) {
        if (typeof localizationManager !== 'undefined' && localizationManager.getLevelText) {
            let name = localizationManager.getLevelText(chapter, levelId, 'name');
            let desc = localizationManager.getLevelText(chapter, levelId, 'description');
            let goal = localizationManager.getLevelText(chapter, levelId, 'goal');
            return { name: name, description: desc, goal: goal };
        }
        return null;
    },

getLevelImage: function(chapter, levelId, gender) {
        let emojis = {
            girl: ['🍳', '🥧', '🧁', '🍎', '🥛', '🥛', '🍪', '🚰', '🍎', '🎂'],
            boy: ['🏠', '🔨', '📦', '🚧', '🏴', '🧱', '🏗️', '🔧', '🚩', '🏆']
        };
        let themeEmojis = emojis[gender] || emojis.boy;
        let emoji = themeEmojis[(levelId - 1) % themeEmojis.length];
        return emoji;
    },

showLevelInfo: function(level) {
        let scenarioLevel = null;
        let localized = null;
        let gender = 'boy';
        
        if (typeof localizationManager !== 'undefined' && localizationManager.currentGender) {
            gender = localizationManager.currentGender;
        }
        
        if (typeof localizationManager !== 'undefined') {
            if (localizationManager.getScenarioLevel) {
                scenarioLevel = localizationManager.getScenarioLevel(this.currentChapter, level.id);
            }
            
            if (!scenarioLevel && localizationManager.getLevelText) {
                localized = localizationManager.getLevelText(this.currentChapter, level.id, 'name');
            }
        }
        
        let levelName = level.name;
        let levelDesc = level.description || '';
        let levelGoal = '';
        
        if (scenarioLevel) {
            if (scenarioLevel.name) levelName = scenarioLevel.name;
            if (scenarioLevel.intro) levelDesc = scenarioLevel.intro;
            if (scenarioLevel.task) levelGoal = scenarioLevel.task;
        } else if (localized) {
            if (localized.name) levelName = localized.name;
            if (localized.description) levelDesc = localized.description;
            if (localized.goal) levelGoal = localized.goal;
        }
        
        let stars = 0;
        for (let si = 0; si < this.completedLevels.length; si++) {
            if (this.completedLevels[si].level_id === level.id) {
                stars = this.completedLevels[si].stars;
                break;
            }
        }
        
        let scenarioLevelName = null;
        let l10n = typeof localizationManager !== 'undefined' ? localizationManager : null;
        let titleContainer = document.getElementById('level-info-title');
        
        if (l10n && l10n.getScenarioLevelName) {
            scenarioLevelName = l10n.getScenarioLevelName(this.currentChapter, level.id);
        }
        
        titleContainer.innerHTML = '<div class="level-card-number">' + (l10n && l10n.t ? l10n.t('level') : 'Level') + ' ' + level.id + '</div>' +
            '<div class="level-card-name">' + (scenarioLevelName || levelName) + '</div>' +
            '<div class="level-card-stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>';
        
        document.getElementById('level-info-description').textContent = levelDesc;
        
        let imageDiv = document.getElementById('level-info-image');
        if (imageDiv) {
            let emoji = this.getLevelImage(this.currentChapter, level.id, gender);
            imageDiv.innerHTML = '';
            let levelNum = level.id < 10 ? '00' + level.id : (level.id < 100 ? '0' + level.id : '' + level.id);
            let img = document.createElement('img');
            let targetSrc = '/frontend/src/levels/chapter_' + this.currentChapter + '/chapter_' + this.currentChapter + '_' + gender + '_' + levelNum + '.webp';
            img.src = targetSrc;
            img.alt = levelName || '';
            img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
            img.onerror = function() {
                img.style.display = 'none';
                let fallback = emoji;
                imageDiv.textContent = fallback;
            };
            imageDiv.appendChild(img);
        }
        
        let commandsDiv = document.getElementById('level-info-commands');
        if (commandsDiv) {
            if (levelGoal) {
                let taskTitle = localizationManager ? localizationManager.t('task') : 'Задание';
                commandsDiv.innerHTML = '<div class="level-task-box"><h3>📋 ' + taskTitle + '</h3><p>' + levelGoal + '</p></div>';
            } else {
                commandsDiv.innerHTML = '';
            }
        }
        
        let diffDiv = document.getElementById('level-info-difficulty');
        if (diffDiv) {
            let stars = 0;
            for (let i = 0; i < this.completedLevels.length; i++) {
                if (this.completedLevels[i].level_id === level.id) {
                    stars = this.completedLevels[i].stars;
                    break;
                }
            }
            let starsStr = '';
            for (let s = 0; s < 3; s++) {
                starsStr += s < stars ? '⭐' : '☆';
            }
            let progressLabel = localizationManager ? localizationManager.t('progress') : 'Progress';
            diffDiv.innerHTML = '<p>' + progressLabel + ': ' + starsStr + '</p>';
        }
        
        window.currentLevelData = level;
        document.getElementById('level-info-modal').classList.add('active');
    },

render: function() {
        let grid = document.getElementById('levels-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        let self = this;
        let chapterNum = this.currentChapter;
        
        let chapterData = null;
        
        if (typeof localizationManager !== 'undefined' && localizationManager.getScenarioChapterInfo) {
            chapterData = localizationManager.getScenarioChapterInfo(chapterNum);
        }
        
        if (!chapterData) {
            chapterData = {
                title: '',
                description: ''
            };
        }
        
        let chapterLabel = localizationManager ? localizationManager.t('chapter') : 'Глава';
        let chaptersDescKey = 'chapters_description_' + chapterNum;
        let chapterTitle = chapterLabel + ' ' + chapterNum;
        let chapterDesc = chapterData && chapterData.description ? chapterData.description : (localizationManager ? localizationManager.t(chaptersDescKey) : '');
        
        let chapterDivider = document.createElement('div');
        chapterDivider.className = 'chapter-divider active';
        chapterDivider.innerHTML = '<div class="chapter-title">' + chapterTitle + '</div><div class="chapter-description">' + chapterDesc + '</div>';
        grid.appendChild(chapterDivider);

        let startIdx = (chapterNum - 1) * 10;
        let endIdx = chapterNum * 10;
        let chapterLevels = self.levels.slice(startIdx, endIdx);
        
        for (let i = 0; i < chapterLevels.length; i++) {
            let level = chapterLevels[i];
            let stars = 0;
            let levelId = parseInt(level.id);
            
            for (let j = 0; j < self.completedLevels.length; j++) {
                let completedLevelId = parseInt(self.completedLevels[j].level_id);
                if (completedLevelId === levelId) {
                    stars = self.completedLevels[j].stars || 0;
                    break;
                }
            }
            
            let isUnlocked = self.isLevelUnlocked(level.id);
            
            let gender = 'boy';
            if (typeof localizationManager !== 'undefined' && localizationManager.currentGender) {
                gender = localizationManager.currentGender;
            }
            
            let levelNum = level.id < 10 ? '00' + level.id : (level.id < 100 ? '0' + level.id : '' + level.id);
            let levelImgPath = '/frontend/src/levels/chapter_' + chapterNum + '/chapter_' + chapterNum + '_' + gender + '_' + levelNum + '.webp';
            let fallbackBg = '';
            
            if (typeof localizationManager !== 'undefined' && localizationManager.translations.scenario && chapterNum === 1) {
                let emojis = {
                    girl: ['🍳', '🥧', '🧁', '🍎', '🥛'],
                    boy: ['🏠', '🔨', '🚧', '📦', '🏴']
                };
                let themeEmojis = emojis[gender] || emojis.boy;
                fallbackBg = themeEmojis[(level.id - 1) % themeEmojis.length];
            } else {
                let levelIndex = (level.id - 1) % 10;
                fallbackBg = ['🗺️', '🎮', '🏆', '⭐', '🎯', '🎲', '🎪', '🎭', '🎨', '🎬'][levelIndex];
            }
            
            let starsStr = '';
            for (let s = 0; s < 3; s++) {
                starsStr += s < stars ? '⭐' : '☆';
            }
            
            let levelName = level.name || '';
            if (typeof localizationManager !== 'undefined') {
                if (localizationManager.translations && localizationManager.translations.scenario) {
                    let l10nName = localizationManager.getScenarioLevelName(chapterNum, level.id);
                    if (l10nName) {
                        levelName = l10nName;
                    }
                }
                if (!levelName) {
                    levelName = level.name || 'Level ' + level.id;
                }
            } else {
                levelName = level.name || 'Level ' + level.id;
            }
            
            let levelBtn = document.createElement('button');
            levelBtn.className = 'level-btn';
            if (stars > 0) levelBtn.className += ' completed';
            if (!isUnlocked) levelBtn.className += ' locked';
            
            let nameBgClass = gender === 'girl' ? 'bg-pink' : 'bg-blue';
            
            let starsDisplay = stars > 0 ? '<span class="level-stars" style="display:block;">' + '⭐'.repeat(stars) + '</span>' : '';
            
            levelBtn.innerHTML = '<div class="level-btn-bg" data-bg="' + levelImgPath + '"></div>' +
                '<div class="level-btn-content">' +
                starsDisplay +
                '<span class="level-num">' + level.id + '</span>' +
                '<span class="level-name ' + nameBgClass + '">' + levelName + '</span>' +
                '</div>';
            
            (function(lvl) {
                levelBtn.addEventListener('click', function() {
                    if (self.isLevelUnlocked(lvl.id)) {
                        self.showLevelInfo(lvl);
                    }
                });
            })(level);
            
            if (!isUnlocked) {
                levelBtn.disabled = true;
            }
            
            grid.appendChild(levelBtn);
            
            (function(btn) {
                let bgDiv = btn.querySelector('.level-btn-bg');
                if (bgDiv) {
                    let imgPath = bgDiv.dataset.bg;
                    if (imgPath) {
                        let img = new Image();
                        let div = bgDiv;
                        img.onload = function() {
                            div.style.backgroundImage = 'url(' + imgPath + ')';
                            div.textContent = '';
                        };
                        img.onerror = function() {
                        };
                        img.src = imgPath;
                    }
                }
            })(levelBtn);
        }
        
        if (chapterNum === 1) {
            let chapterLabel = localizationManager ? localizationManager.t('chapter') : 'Глава';
            let ch2Info = localizationManager && localizationManager.getScenarioChapterInfo ? localizationManager.getScenarioChapterInfo(2) : null;
            let ch2Title = chapterLabel + ' 2';
            let ch2Desc = ch2Info && ch2Info.description ? ch2Info.description : (localizationManager ? localizationManager.t('chapters_description_2') : '');
            let nextChapter = document.createElement('div');
            nextChapter.className = 'chapter-divider next-chapter';
            nextChapter.innerHTML = '<div class="chapter-title">' + ch2Title + '</div><div class="chapter-description">' + ch2Desc + '</div>';
            nextChapter.onclick = function() {
                self.setChapter(2);
            };
            grid.appendChild(nextChapter);
        } else if (chapterNum === 2) {
            let chapterLabel = localizationManager ? localizationManager.t('chapter') : 'Глава';
            let ch1Info = localizationManager && localizationManager.getScenarioChapterInfo ? localizationManager.getScenarioChapterInfo(1) : null;
            let ch1Title = chapterLabel + ' 1';
            let ch1Desc = ch1Info && ch1Info.description ? ch1Info.description : (localizationManager ? localizationManager.t('chapters_description_1') : '');
            let prevChapter = document.createElement('div');
            prevChapter.className = 'chapter-divider next-chapter';
            prevChapter.innerHTML = '<div class="chapter-title">' + ch1Title + '</div><div class="chapter-description">' + ch1Desc + '</div>';
            prevChapter.onclick = function() {
                self.setChapter(1);
            };
            grid.appendChild(prevChapter);
        }
    },

    setChapter: function(chapter) {
        this.currentChapter = chapter;
        this.render();
    }
};