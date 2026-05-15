var localizationManager = {
    currentLanguage: 'ru',
    translations: {},
    currentGender: 'boy',
    availableLanguages: [
        { code: 'ru', name: 'Русский', flag: '/flags/ru.png' },
        { code: 'en', name: 'English', flag: '/flags/us.png' },
        { code: 'es', name: 'Español', flag: '/flags/es.png' },
        { code: 'tg', name: 'Тоҷикӣ', flag: '/flags/tg.png' },
        { code: 'uz', name: "O'zbekcha", flag: '/flags/uz.png' },
        { code: 'bxr', name: 'Буряад', flag: '/flags/ru.png' }
    ],

    init: function() {
        var savedLang = localStorage.getItem('language');
        if (savedLang) {
            this.currentLanguage = savedLang;
        } else {
            this.currentLanguage = 'ru';
        }
        
        this.currentGender = 'boy';
        var user = auth.getUser ? auth.getUser() : null;
        if (user && user.gender) {
            this.currentGender = user.gender;
        } else {
            var savedGender = localStorage.getItem('gender');
            if (savedGender) {
                this.currentGender = savedGender;
            }
        }
        
        var self = this;
        return this.loadTranslations().then(function() {});
    },

loadTranslations: function() {
        var self = this;
        
        var scenarioPromises = [];
        for (var ch = 1; ch <= 2; ch++) {
            scenarioPromises.push(
                fetch('/assets/localization/scenarios/chapter_' + ch + '/chapter_' + ch + '_' + this.currentLanguage + '.json')
                .catch(function() { return null; })
            );
        }
        
        return Promise.all([
            fetch('/assets/localization/' + this.currentLanguage + '.json')
        ].concat(scenarioPromises))
        .then(function(responses) {
            var jsonPromises = responses.map(function(r) { 
                if (!r) return Promise.resolve(null);
                return r.text().then(function(text) {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        console.error('JSON parse error:', e.message, 'in', r.url);
                        return null;
                    }
                });
            });
            return Promise.all(jsonPromises);
        })
        .then(function(datas) {
            var main = datas[0];
            if (main) {
                self.translations.chapter1 = main;
            }
            self.translations.scenario = {};
            
            for (var i = 0; i < scenarioPromises.length; i++) {
                var chapterNum = i + 1;
                var scen = datas[i + 1];
                if (scen && scen.chapters) {
                    self.translations.scenario[chapterNum] = {
                        girl: null,
                        boy: null
                    };
                    
                    for (var j = 0; j < scen.chapters.length; j++) {
                        var ch = scen.chapters[j];
                        if (ch.gender === 'girl' || ch.gender === 'boy') {
                            self.translations.scenario[chapterNum][ch.gender] = ch;
                        }
                    }
                }
            }
        })
        .catch(function(err) {
            console.error('Error loading translations:', err);
        });
    },
    
    extractGenderScenario: function(scenario, gender) {
        if (!scenario || !scenario.chapters) {
            return scenario;
        }
        
        for (var i = 0; i < scenario.chapters.length; i++) {
            var ch = scenario.chapters[i];
            if (ch.gender === gender) {
                return ch;
            }
        }
        
        return scenario.chapters[0] || null;
    },

    setLanguage: function(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        var self = this;
        this.loadTranslations().then(function() {
            self.updateUI();
            self.updateAllUI();
            
            if (typeof app !== 'undefined' && app.updateLanguageDropdowns) {
                app.updateLanguageDropdowns(lang);
            }
            
            if (typeof gameManager !== 'undefined' && gameManager.currentLevel) {
                var chapter = Math.ceil(gameManager.currentLevel.id / 10);
                var levelName = gameManager.currentLevel.name;
                var localizedName = self.getScenarioLevelName(chapter, gameManager.currentLevel.id);
                if (localizedName) {
                    levelName = localizedName;
                }
                var nameEl = document.getElementById('level-name');
                if (nameEl) nameEl.textContent = levelName;
            }
        });
    },
    
    setGender: function(gender) {
        this.currentGender = gender;
        localStorage.setItem('gender', gender);
        
        var self = this;
        this.loadTranslations().then(function() {
            if (typeof levelsManager !== 'undefined') {
                levelsManager.load();
            }
            if (typeof app !== 'undefined' && app.currentView === 'levels') {
                app.showLevels();
            }
        });
    },

    t: function(key) {
        var chapter1 = this.translations.chapter1;

        var translation = null;
        if (chapter1 && chapter1[key]) {
            translation = chapter1[key];
        } else if (chapter1 && chapter1.commands && chapter1.commands[key]) {
            translation = chapter1.commands[key];
        } else if (chapter1 && chapter1.ui && chapter1.ui[key]) {
            translation = chapter1.ui[key];
        }

        return translation || null;
    },

    getLevelText: function(chapter, levelId, field) {
        var chapterKey = 'chapter' + chapter;
        var chapterData = this.translations[chapterKey];
        if (!chapterData || !chapterData.levels) return null;
        
        for (var i = 0; i < chapterData.levels.length; i++) {
            if (chapterData.levels[i].id === levelId) {
                return chapterData.levels[i][field] || null;
            }
        }
        return null;
    },
    
    getScenarioLevelName: function(chapter, levelId) {
        var scenarioData = this.translations.scenario;
        
        if (!scenarioData || !scenarioData[chapter]) {
            return null;
        }
        
        var gender = this.currentGender || 'boy';
        var chapterData = scenarioData[chapter][gender];
        
        if (!chapterData || !chapterData.levels) {
            return null;
        }
        
        var levels = chapterData.levels || [];
        
        for (var i = 0; i < levels.length; i++) {
            if (levels[i].id === levelId) {
                return levels[i].name || null;
            }
        }
        return null;
    },

    getChapterText: function(chapter, field) {
        var chapterKey = 'chapter' + chapter;
        var chapterData = this.translations[chapterKey];
        if (!chapterData || !chapterData.chapters) return null;
        for (var i = 0; i < chapterData.chapters.length; i++) {
            if (chapterData.chapters[i].id === chapter) {
                return chapterData.chapters[i][field] || null;
            }
        }
        return null;
    },

    getLanguageName: function(lang) {
        for (var i = 0; i < this.availableLanguages.length; i++) {
            if (this.availableLanguages[i].code === lang) {
                return this.availableLanguages[i].name;
            }
        }
        return lang;
    },

    getLanguageFlag: function(lang) {
        for (var i = 0; i < this.availableLanguages.length; i++) {
            if (this.availableLanguages[i].code === lang) {
                return this.availableLanguages[i].flag;
            }
        }
        return '';
    },

    updateUI: function() {
        var langBtns = document.querySelectorAll('.lang-btn');
        for (var i = 0; i < langBtns.length; i++) {
            var btn = langBtns[i];
            btn.classList.remove('selected');
            if (btn.dataset.lang === this.currentLanguage) {
                btn.classList.add('selected');
            }
        }
    },

    updateAllUI: function() {
        var chapter1 = this.translations.chapter1;
        var chapter2 = this.translations.chapter2;
        
        var uiTrans = chapter1 ? chapter1.ui : (chapter2 ? chapter2.ui : {});
        var translations = Object.assign({}, uiTrans);
        
        var elementMappings = {
            'welcome-msg': 'welcome',
            'login-title': 'login',
            'login-btn': 'loginBtn',
            'register-title': 'register',
            'register-btn': 'registerBtn',
            'menu-title': 'menuTitle',
            'tab-levels': 'levels',
            'tab-leaderboard': 'leaderboard',
            'tab-achievements': 'achievements',
            'profile-title': 'profile',
            'result-title': 'levelComplete',
            'result-message': 'resultMessage',
            'next-level-btn': 'nextLevel',
            'retry-level-btn': 'retry',
            'run-code': 'runCode',
            'start-level-btn': 'startGame',
            'cancel-level-btn': 'cancel',
            'save-profile-btn': 'save',
            'level-info-description': 'levelDescription',
            'register-phone-label': 'regPhone',
            'register-nickname-label': 'regNickname',
            'register-name-label': 'regName',
            'register-age-label': 'regAge',
            'register-password-label': 'regPassword',
            'profile-phone-label': 'loginPhone',
            'profile-nickname-label': 'regNickname',
            'profile-name-label': 'regName',
            'profile-age-label': 'regAge',
            'login-phone-label': 'loginPhone',
            'login-password-label': 'loginPassword',
            'language-label': 'language',
            'profile-language-label': 'language',
            'profile-screen-title': 'settings',
            'profile-gender-label': 'whoYouAre',
            'gender-boy-label': 'boy',
            'gender-girl-label': 'girl',
            'character-label': 'character',
            'char-boy-label': 'builder',
            'char-girl-label': 'cook'
        };
        
        for (var id in elementMappings) {
            var key = elementMappings[id];
            var el = document.getElementById(id);
            if (el && translations[key]) {
                el.textContent = translations[key];
            }
        }
        
        var i18nBtns = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < i18nBtns.length; i++) {
            var key = i18nBtns[i].dataset.i18n;
            var textEl = i18nBtns[i].querySelector('.btn-text');
            if (textEl && translations[key]) {
                textEl.textContent = translations[key];
            } else if (translations[key]) {
                i18nBtns[i].textContent = translations[key];
            }
        }
        
        this.updateUI();
    },

    getLocalizedLevel: function(chapter, levelId) {
        var name = this.getLevelText(chapter, levelId, 'name');
        var desc = this.getLevelText(chapter, levelId, 'description');
        var goal = this.getLevelText(chapter, levelId, 'goal');
        
        return {
            name: name,
            description: desc,
            goal: goal
        };
    },

    getRandomWelcome: function() {
        var welcomes = [
            'Добро пожаловать, герой!',
            'Привет, странник!',
            'Рад видеть тебя, воин!',
            'Добро пожаловать в мир приключений!'
        ];
        return welcomes[Math.floor(Math.random() * welcomes.length)];
    },
    
    getScenarioLevel: function(chapter, levelId) {
        if (!this.translations.scenario || !this.translations.scenario[chapter]) {
            return null;
        }
        
        var gender = this.currentGender || 'boy';
        var chapterData = this.translations.scenario[chapter][gender];
        
        if (!chapterData || !chapterData.levels) {
            return null;
        }
        
        var levels = chapterData.levels;
        
        for (var i = 0; i < levels.length; i++) {
            if (levels[i].id === levelId) {
                return {
                    name: levels[i].name || null,
                    intro: levels[i].intro || null,
                    task: levels[i].task || null
                };
            }
        }
        return null;
    },
    
    getScenarioChapterInfo: function(chapter) {
        if (!this.translations.scenario || !this.translations.scenario[chapter]) {
            return null;
        }
        var gender = this.currentGender || 'boy';
        var scen = this.translations.scenario[chapter][gender];
        if (!scen) {
            return null;
        }
        return {
            title: scen.chapterTitle || null,
            description: scen.chapterDescription || null
        };
    },
    
    getHeroInfo: function() {
        if (!this.translations.scenario) {
            return null;
        }
        var gender = this.currentGender || 'boy';
        var chapterData = this.translations.scenario[1] ? this.translations.scenario[1][gender] : null;
        if (!chapterData) {
            return null;
        }
        return {
            name: chapterData.hero || null,
            theme: chapterData.theme || null
        };
    }
};

function t(key) {
    if (typeof localizationManager !== 'undefined') {
        return localizationManager.t(key);
    }
    return key;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = localizationManager;
}