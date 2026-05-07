var levelsManager = {
    API_URL: window.location.origin,
    levels: [],
    completedLevels: [],
    currentChapter: 1,

    init: function() {
        var self = this;
        
        var chapterBoxes = document.querySelectorAll('.chapter-box, .chapter-btn');
        for (var i = 0; i < chapterBoxes.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var chapter = parseInt(btn.dataset.chapter);
                    var boxes = document.querySelectorAll('.chapter-box, .chapter-btn');
                    for (var j = 0; j < boxes.length; j++) {
                        boxes[j].classList.remove('active');
                    }
                    btn.classList.add('active');
                    self.setChapter(chapter);
                });
            })(chapterBoxes[i]);
        }
        
        var characterBtns = document.querySelectorAll('.char-btn');
        for (var i = 0; i < characterBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var btns = document.querySelectorAll('.char-btn');
                    for (var j = 0; j < btns.length; j++) {
                        btns[j].classList.remove('selected');
                    }
                    btn.classList.add('selected');
                });
            })(characterBtns[i]);
        }

        var tabBtns = document.querySelectorAll('.tab-btn');
        for (var i = 0; i < tabBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var btns = document.querySelectorAll('.tab-btn');
                    for (var j = 0; j < btns.length; j++) {
                        btns[j].classList.remove('active');
                    }
                    btn.classList.add('active');
                });
            })(tabBtns[i]);
        }
    },

load: function() {
        var self = this;
        
        var gender = 'boy';
        var token = null;
        
        if (typeof auth !== 'undefined' && auth.getToken) {
            token = auth.getToken();
        }
        
        if (typeof localizationManager !== 'undefined' && localizationManager.currentGender) {
            gender = localizationManager.currentGender;
        }
        
        var fetchOptions = { 
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
            var levelsData = datas[0];
            var progressData = datas[1] || {progress: []};
            
            self.levels = levelsData.levels || [];
            self.completedLevels = progressData.progress || [];
            
            self.render();
            self.updateChapterBoxes();
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

        var chapter = Math.ceil(levelId / 10);
        var firstLevelInChapter = (chapter - 1) * 10 + 1;

        if (levelId === firstLevelInChapter) {
            if (chapter === 1) return true;
            return this.isLevelUnlocked(firstLevelInChapter - 1);
        }

        var prevLevelId = levelId - 1;

        for (var i = 0; i < this.completedLevels.length; i++) {
            var completedLevelId = parseInt(this.completedLevels[i].level_id);
            if (completedLevelId === prevLevelId && this.completedLevels[i].stars > 0) {
                return true;
            }
        }
        return false;
    },

getLevelLocalized: function(chapter, levelId) {
        if (typeof localizationManager !== 'undefined' && localizationManager.getLevelText) {
            var name = localizationManager.getLevelText(chapter, levelId, 'name');
            var desc = localizationManager.getLevelText(chapter, levelId, 'description');
            var goal = localizationManager.getLevelText(chapter, levelId, 'goal');
            return { name: name, description: desc, goal: goal };
        }
        return null;
    },

getLevelImage: function(chapter, levelId, gender) {
        var emojis = {
            girl: ['🍳', '🥧', '🧁', '🍎', '🥛', '🥛', '🍪', '🚰', '🍎', '🎂'],
            boy: ['🏠', '🔨', '📦', '🚧', '🏴', '🧱', '🏗️', '🔧', '🚩', '🏆']
        };
        var themeEmojis = emojis[gender] || emojis.boy;
        var emoji = themeEmojis[(levelId - 1) % themeEmojis.length];
        return emoji;
    },

showLevelInfo: function(level) {
        var scenarioLevel = null;
        var localized = null;
        var gender = 'boy';
        
        if (typeof localizationManager !== 'undefined' && localizationManager.currentGender) {
            gender = localizationManager.currentGender;
        }
        
        if (typeof localizationManager !== 'undefined') {
            if (this.currentChapter === 1 && localizationManager.getScenarioLevel) {
                scenarioLevel = localizationManager.getScenarioLevel(this.currentChapter, level.id);
            }
            
            if (!scenarioLevel && this.currentChapter === 2 && localizationManager.getLevelText) {
                localized = localizationManager.getLevelText(this.currentChapter, level.id, 'name');
            }
        }
        
        var levelName = level.name;
        var levelDesc = level.description || '';
        var levelGoal = '';
        
        if (scenarioLevel) {
            if (scenarioLevel.name) levelName = scenarioLevel.name;
            if (scenarioLevel.intro) levelDesc = scenarioLevel.intro;
            if (scenarioLevel.task) levelGoal = scenarioLevel.task;
        } else if (localized) {
            if (localized.name) levelName = localized.name;
            if (localized.description) levelDesc = localized.description;
            if (localized.goal) levelGoal = localized.goal;
        }
        
        var stars = 0;
        for (var si = 0; si < this.completedLevels.length; si++) {
            if (this.completedLevels[si].level_id === level.id) {
                stars = this.completedLevels[si].stars;
                break;
            }
        }
        
        var scenarioLevelName = null;
        var l10n = typeof localizationManager !== 'undefined' ? localizationManager : null;
        var titleContainer = document.getElementById('level-info-title');
        
        if (l10n && l10n.getScenarioLevelName) {
            scenarioLevelName = l10n.getScenarioLevelName(this.currentChapter, level.id);
        }
        
        titleContainer.innerHTML = '<div class="level-card-number">' + (l10n && l10n.t ? l10n.t('level') : 'Level') + ' ' + level.id + '</div>' +
            '<div class="level-card-name">' + (scenarioLevelName || levelName) + '</div>' +
            '<div class="level-card-stars">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</div>';
        
        document.getElementById('level-info-description').textContent = levelDesc;
        
        var imageDiv = document.getElementById('level-info-image');
        if (imageDiv) {
            var emoji = this.getLevelImage(this.currentChapter, level.id, gender);
            imageDiv.innerHTML = '';
            var levelNum = level.id < 10 ? '00' + level.id : (level.id < 100 ? '0' + level.id : '' + level.id);
            var img = document.createElement('img');
            var targetSrc = '/frontend/src/levels/chapter_' + this.currentChapter + '/chapter_' + this.currentChapter + '_' + gender + '_' + levelNum + '.webp';
            img.src = targetSrc;
            img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
            img.onerror = function() {
                img.style.display = 'none';
                var fallback = emoji;
                imageDiv.textContent = fallback;
            };
            imageDiv.appendChild(img);
        }
        
        var commandsDiv = document.getElementById('level-info-commands');
        if (commandsDiv) {
            if (levelGoal) {
                var taskTitle = localizationManager ? localizationManager.t('task') : 'Задание';
                commandsDiv.innerHTML = '<div class="level-task-box"><h3>📋 ' + taskTitle + '</h3><p>' + levelGoal + '</p></div>';
            } else {
                commandsDiv.innerHTML = '';
            }
        }
        
        var diffDiv = document.getElementById('level-info-difficulty');
        if (diffDiv) {
            var stars = 0;
            for (var i = 0; i < this.completedLevels.length; i++) {
                if (this.completedLevels[i].level_id === level.id) {
                    stars = this.completedLevels[i].stars;
                    break;
                }
            }
            var starsStr = '';
            for (var s = 0; s < 3; s++) {
                starsStr += s < stars ? '⭐' : '☆';
            }
            var progressLabel = localizationManager ? localizationManager.t('progress') : 'Progress';
            diffDiv.innerHTML = '<p>' + progressLabel + ': ' + starsStr + '</p>';
        }
        
        window.currentLevelData = level;
        document.getElementById('level-info-modal').classList.add('active');
    },

render: function() {
        var grid = document.getElementById('levels-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        var self = this;
        var chapterNum = this.currentChapter;
        
        var chapterData = null;
        
        if (typeof localizationManager !== 'undefined' && localizationManager.getScenarioChapterInfo) {
            chapterData = localizationManager.getScenarioChapterInfo(chapterNum);
        }
        
        if (!chapterData) {
            chapterData = {
                title: '',
                description: ''
            };
        }
        
        var chapterLabel = localizationManager ? localizationManager.t('chapter') : 'Глава';
        var chaptersDescKey = 'chapters_description_' + chapterNum;
        var chapterTitle = chapterLabel + ' ' + chapterNum;
        var chapterDesc = chapterData && chapterData.description ? chapterData.description : (localizationManager ? localizationManager.t(chaptersDescKey) : '');
        
        var chapterDivider = document.createElement('div');
        chapterDivider.className = 'chapter-divider active';
        chapterDivider.innerHTML = '<div class="chapter-title">' + chapterTitle + '</div><div class="chapter-description">' + chapterDesc + '</div>';
        grid.appendChild(chapterDivider);

        var startIdx = (chapterNum - 1) * 10;
        var endIdx = chapterNum * 10;
        var chapterLevels = self.levels.slice(startIdx, endIdx);
        
        for (var i = 0; i < chapterLevels.length; i++) {
            var level = chapterLevels[i];
            var stars = 0;
            var levelId = parseInt(level.id);
            
            for (var j = 0; j < self.completedLevels.length; j++) {
                var completedLevelId = parseInt(self.completedLevels[j].level_id);
                if (completedLevelId === levelId) {
                    stars = self.completedLevels[j].stars || 0;
                    break;
                }
            }
            
            var isUnlocked = self.isLevelUnlocked(level.id);
            
            var gender = 'boy';
            if (typeof localizationManager !== 'undefined' && localizationManager.currentGender) {
                gender = localizationManager.currentGender;
            }
            
            var levelNum = level.id < 10 ? '00' + level.id : (level.id < 100 ? '0' + level.id : '' + level.id);
            var levelImgPath = '/frontend/src/levels/chapter_' + chapterNum + '/chapter_' + chapterNum + '_' + gender + '_' + levelNum + '.webp';
            var fallbackBg = '';
            
            if (typeof localizationManager !== 'undefined' && localizationManager.translations.scenario && chapterNum === 1) {
                var emojis = {
                    girl: ['🍳', '🥧', '🧁', '🍎', '🥛'],
                    boy: ['🏠', '🔨', '🚧', '📦', '🏴']
                };
                var themeEmojis = emojis[gender] || emojis.boy;
                fallbackBg = themeEmojis[(level.id - 1) % themeEmojis.length];
            } else {
                var levelIndex = (level.id - 1) % 10;
                fallbackBg = ['🗺️', '🎮', '🏆', '⭐', '🎯', '🎲', '🎪', '🎭', '🎨', '🎬'][levelIndex];
            }
            
            var starsStr = '';
            for (var s = 0; s < 3; s++) {
                starsStr += s < stars ? '⭐' : '☆';
            }
            
            var levelName = level.name || '';
            if (typeof localizationManager !== 'undefined') {
                if (localizationManager.translations && localizationManager.translations.scenario) {
                    var l10nName = localizationManager.getScenarioLevelName(chapterNum, level.id);
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
            
            var levelBtn = document.createElement('button');
            levelBtn.className = 'level-btn';
            if (stars > 0) levelBtn.className += ' completed';
            if (!isUnlocked) levelBtn.className += ' locked';
            
            var nameBgClass = gender === 'girl' ? 'bg-pink' : 'bg-blue';
            
            var starsDisplay = stars > 0 ? '<span class="level-stars" style="display:block;">' + '⭐'.repeat(stars) + '</span>' : '';
            
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
                var bgDiv = btn.querySelector('.level-btn-bg');
                if (bgDiv) {
                    var imgPath = bgDiv.dataset.bg;
                    if (imgPath) {
                        var img = new Image();
                        var div = bgDiv;
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
            var chapterLabel = localizationManager ? localizationManager.t('chapter') : 'Глава';
            var ch2Info = localizationManager && localizationManager.getScenarioChapterInfo ? localizationManager.getScenarioChapterInfo(2) : null;
            var ch2Title = chapterLabel + ' 2';
            var ch2Desc = ch2Info && ch2Info.description ? ch2Info.description : (localizationManager ? localizationManager.t('chapters_description_2') : '');
            var nextChapter = document.createElement('div');
            nextChapter.className = 'chapter-divider next-chapter';
            nextChapter.innerHTML = '<div class="chapter-title">' + ch2Title + '</div><div class="chapter-description">' + ch2Desc + '</div>';
            nextChapter.onclick = function() {
                self.setChapter(2);
            };
            grid.appendChild(nextChapter);
        } else if (chapterNum === 2) {
            var chapterLabel = localizationManager ? localizationManager.t('chapter') : 'Глава';
            var ch1Info = localizationManager && localizationManager.getScenarioChapterInfo ? localizationManager.getScenarioChapterInfo(1) : null;
            var ch1Title = chapterLabel + ' 1';
            var ch1Desc = ch1Info && ch1Info.description ? ch1Info.description : (localizationManager ? localizationManager.t('chapters_description_1') : '');
            var prevChapter = document.createElement('div');
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
    },
    
updateChapterBoxes: function() {
        var self = this;
        
        var chapter1Btn = document.getElementById('chapter1-btn');
        var chapter2Btn = document.getElementById('chapter2-btn');
        var chapter1Name = document.getElementById('chapter1-name');
        var chapter2Name = document.getElementById('chapter2-name');
        var chapter1Desc = document.getElementById('chapter1-desc');
        var chapter2Desc = document.getElementById('chapter2-desc');
        
        if (typeof localizationManager !== 'undefined' && localizationManager.getScenarioChapterInfo) {
            var chapterKey = localizationManager.t('chapter');
            
            var ch1Info = localizationManager.getScenarioChapterInfo(1);
            if (ch1Info) {
                var title1 = chapterKey + ' 1';
                if (chapter1Name) chapter1Name.textContent = title1;
                if (chapter1Desc) chapter1Desc.textContent = ch1Info.description || '';
            }
            
            var ch2Info = localizationManager.getScenarioChapterInfo(2);
            if (ch2Info) {
                var title2 = chapterKey + ' 2';
                if (chapter2Name) chapter2Name.textContent = title2;
                if (chapter2Desc) chapter2Desc.textContent = ch2Info.description || '';
            }
        }
        
        var boxes = document.querySelectorAll('.chapter-box');
        for (var i = 0; i < boxes.length; i++) {
            boxes[i].classList.remove('active');
            if (parseInt(boxes[i].dataset.chapter) === this.currentChapter) {
                boxes[i].classList.add('active');
            }
        }
    }
};