let localizationManager = {
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
        let savedLang = localStorage.getItem('language');
        if (savedLang) {
            document.documentElement.lang = savedLang;
        }
        if (savedLang) {
            this.currentLanguage = savedLang;
        } else {
            this.currentLanguage = 'ru';
        }

        this.currentGender = 'boy';
        let user = auth.getUser ? auth.getUser() : null;
        if (user && user.gender) {
            this.currentGender = user.gender;
        } else {
            let savedGender = localStorage.getItem('gender');
            if (savedGender) {
                this.currentGender = savedGender;
            }
        }

        let self = this;
        return this.loadTranslations().then(function() {});
    },

    loadTranslations: function() {
        let self = this;

        let scenarioPromises = [];
        for (let ch = 1; ch <= 2; ch++) {
            scenarioPromises.push(
                fetch('/assets/localization/scenarios/chapter_' + ch + '/chapter_' + ch + '_' + this.currentLanguage + '.json')
                .catch(function() { return null; })
            );
        }

        return Promise.all([
            fetch('/assets/localization/' + this.currentLanguage + '.json')
        ].concat(scenarioPromises))
        .then(function(responses) {
            let jsonPromises = responses.map(function(r) {
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
            let main = datas[0];
            self.translations = main || {};
            self.translations.scenario = {};

            for (let i = 0; i < scenarioPromises.length; i++) {
                let chapterNum = i + 1;
                let scen = datas[i + 1];
                if (scen && scen.chapters) {
                    self.translations.scenario[chapterNum] = {
                        girl: null,
                        boy: null
                    };

                    for (let j = 0; j < scen.chapters.length; j++) {
                        let ch = scen.chapters[j];
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

    setLanguage: function(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
        this.init().then(function() {
            localizationManager.updateUI();
            localizationManager.updateAllUI();
        });
    },

    setGender: function(gender) {
        this.currentGender = gender;
        localStorage.setItem('gender', gender);

        let self = this;
        this.loadTranslations().then(function() {
            if (typeof levelsManager !== 'undefined') {
                levelsManager.load();
            }
        });
    },

    t: function(key, fallback) {
        let translations = this.translations;

        if (translations && translations[key] !== undefined) {
            return translations[key];
        }

        return fallback !== undefined ? fallback : key;
    },

    getLevelText: function(chapter, levelId, field) {
        let chapterKey = 'chapter' + chapter;
        let chapterData = this.translations[chapterKey];
        if (!chapterData || !chapterData.levels) return null;

        for (let i = 0; i < chapterData.levels.length; i++) {
            if (chapterData.levels[i].id === levelId) {
                return chapterData.levels[i][field] || null;
            }
        }
        return null;
    },

    getScenarioLevelName: function(chapter, levelId) {
        let scenarioData = this.translations.scenario;

        if (!scenarioData || !scenarioData[chapter]) {
            return null;
        }

        let gender = this.currentGender || 'boy';
        let chapterData = scenarioData[chapter][gender];

        if (!chapterData || !chapterData.levels) {
            return null;
        }

        let levels = chapterData.levels || [];

        for (let i = 0; i < levels.length; i++) {
            if (levels[i].id === levelId) {
                return levels[i].name || null;
            }
        }
        return null;
    },

    getChapterText: function(chapter, field) {
        let chapterKey = 'chapter' + chapter;
        let chapterData = this.translations[chapterKey];
        if (!chapterData || !chapterData.chapters) return null;
        for (let i = 0; i < chapterData.chapters.length; i++) {
            if (chapterData.chapters[i].id === chapter) {
                return chapterData.chapters[i][field] || null;
            }
        }
        return null;
    },

    getLanguageName: function(lang) {
        for (let i = 0; i < this.availableLanguages.length; i++) {
            if (this.availableLanguages[i].code === lang) {
                return this.availableLanguages[i].name;
            }
        }
        return lang;
    },

    getLanguageFlag: function(lang) {
        for (let i = 0; i < this.availableLanguages.length; i++) {
            if (this.availableLanguages[i].code === lang) {
                return this.availableLanguages[i].flag;
            }
        }
        return '';
    },

    updateUI: function() {
        let langBtns = document.querySelectorAll('.lang-btn');
        for (let i = 0; i < langBtns.length; i++) {
            let btn = langBtns[i];
            btn.classList.remove('selected');
            if (btn.dataset.lang === this.currentLanguage) {
                btn.classList.add('selected');
            }
        }
    },

    updateAllUI: function() {
        let translations = this.translations;

        let elementMappings = {
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

        for (let id in elementMappings) {
            let key = elementMappings[id];
            let el = document.getElementById(id);
            if (el && translations[key]) {
                el.textContent = translations[key];
            }
        }

        let i18nBtns = document.querySelectorAll('[data-i18n]');
        for (let i = 0; i < i18nBtns.length; i++) {
            let key = i18nBtns[i].dataset.i18n;
            let textEl = i18nBtns[i].querySelector('.btn-text');
            if (textEl && translations[key]) {
                textEl.textContent = translations[key];
            } else if (translations[key]) {
                i18nBtns[i].textContent = translations[key];
            }
        }

        this.updateUI();
    },

    getScenarioLevel: function(chapter, levelId) {
        if (!this.translations.scenario || !this.translations.scenario[chapter]) {
            return null;
        }

        let gender = this.currentGender || 'boy';
        let chapterData = this.translations.scenario[chapter][gender];

        if (!chapterData || !chapterData.levels) {
            return null;
        }

        let levels = chapterData.levels;

        for (let i = 0; i < levels.length; i++) {
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
        let gender = this.currentGender || 'boy';
        let scen = this.translations.scenario[chapter][gender];
        if (!scen) {
            return null;
        }
        return {
            title: scen.chapterTitle || null,
            description: scen.chapterDescription || null
        };
    }
};

function getL10n() {
    return localizationManager || null;
}