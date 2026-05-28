let app = {
    API_URL: window.location.origin,
    currentUser: null,
    ws: null,

    init: function() {
        let self = this;
        
        if (typeof theme !== 'undefined') {
            themeManager.activeTheme = theme;
            themeManager.apply();
        }
        
        if (typeof localizationManager !== 'undefined') {
            localizationManager.init().then(function() {
                localizationManager.updateUI();
                localizationManager.updateAllUI();
                if (typeof app.updateLanguageDropdowns === 'function') {
                    app.updateLanguageDropdowns(localizationManager.currentLanguage);
                }
            });
        }
        
        auth.initUI();
        this.showWelcomeMessage();
        this.initUIComponents();
        
        if (auth.isAuthenticated()) {
            auth.checkAuth().then(function(valid) {
                if (valid) {
                    self.onLoginSuccess();
                } else {
                    self.showScreen('start-screen');
                }
            });
        } else {
            this.showScreen('start-screen');
        }
    },

initUIComponents: function() {
        let self = this;
        
        let backBtns = document.querySelectorAll('.back-btn');
        for (let i = 0; i < backBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    let currentScreen = document.querySelector('.screen.active');
                    if (currentScreen && currentScreen.id === 'game-screen') {
                        levelsManager.load();
                        self.showMenu();
                    } else if (currentScreen && currentScreen.id === 'profile-screen') {
                        app.showMenu();
                    }
                });
            })(backBtns[i]);
        }
        
        let startLevelBtn = document.getElementById('start-level-btn');
        if (startLevelBtn) {
            startLevelBtn.addEventListener('click', function() {
                let levelData = window.currentLevelData;
                if (levelData) {
                    self.startLevel(levelData);
                }
                document.getElementById('level-info-modal').classList.remove('active');
            });
        }
        
        let cancelLevelBtn = document.getElementById('cancel-level-btn');
        if (cancelLevelBtn) {
            cancelLevelBtn.addEventListener('click', function() {
                document.getElementById('level-info-modal').classList.remove('active');
            });
        }
        
        let settingsBtn = document.querySelector('.settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function() { self.showProfile(); });
        }
        
        let logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() { self.logout(); });
        }
        
        let langBtns = document.querySelectorAll('.language-bar .lang-btn');
        for (let i = 0; i < langBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    let lang = btn.dataset.lang;
                    if (typeof localizationManager !== 'undefined') {
                        localizationManager.setLanguage(lang);
                    }
                });
            })(langBtns[i]);
        }

        let menuTabs = document.querySelectorAll('.menu-tabs .tab-btn');
        for (let i = 0; i < menuTabs.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    let tab = btn.dataset.tab;
                    let allTabs = document.querySelectorAll('.menu-tabs .tab-btn');
                    for (let j = 0; j < allTabs.length; j++) {
                        allTabs[j].classList.remove('active');
                    }
                    btn.classList.add('active');

                    if (tab === 'levels') {
                        self.showMenu();
                    } else if (tab === 'leaderboard') {
                        self.showLeaderboard();
                    } else if (tab === 'achievements') {
                        self.showAchievements();
                    }
                });
            })(menuTabs[i]);
        }
        
        let performerBtns = document.querySelectorAll('#register-screen .char-btn, #profile-screen .char-btn');
        for (let i = 0; i < performerBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    let container = btn.closest('.character-select') || btn.closest('.form-group');
                    let btns = container.querySelectorAll('.char-btn');
                    for (let j = 0; j < btns.length; j++) {
                        btns[j].classList.remove('selected');
                    }
                    btn.classList.add('selected');
                });
            })(performerBtns[i]);
        }
        
        let genderBtns = document.querySelectorAll('#register-screen .gender-btn');
        for (let i = 0; i < genderBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    let btns = document.querySelectorAll('#register-screen .gender-btn');
                    for (let j = 0; j < btns.length; j++) {
                        btns[j].classList.remove('selected');
                    }
                    btn.classList.add('selected');
                });
            })(genderBtns[i]);
        }
        
        let dropdownBtns = document.querySelectorAll('.lang-dropdown-btn');
        for (let i = 0; i < dropdownBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    let dropdown = btn.closest('.language-dropdown');
                    let allDropdowns = document.querySelectorAll('.language-dropdown');
                    for (let j = 0; j < allDropdowns.length; j++) {
                        if (allDropdowns[j] !== dropdown) allDropdowns[j].classList.remove('open');
                    }
                    dropdown.classList.toggle('open');
                });
            })(dropdownBtns[i]);
        }
        
        let langOptions = document.querySelectorAll('.lang-option');
        for (let i = 0; i < langOptions.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    let lang = btn.dataset.lang;
                    let dropdown = btn.closest('.language-dropdown');
                    dropdown.classList.remove('open');
                    
                    if (typeof localizationManager !== 'undefined') {
                        localizationManager.setLanguage(lang);
                    }
                    
                    self.updateLanguageDropdowns(lang);
                });
            })(langOptions[i]);
        }
        
        document.addEventListener('click', function() {
            let allDropdowns = document.querySelectorAll('.language-dropdown');
            for (let i = 0; i < allDropdowns.length; i++) {
                allDropdowns[i].classList.remove('open');
            }
        });
        
        let saveProfileBtn = document.getElementById('save-profile-btn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', function() { self.saveProfile(); });
        }
    },

    showScreen: function(screenId) {
        let screens = document.querySelectorAll('.screen');
        for (let i = 0; i < screens.length; i++) {
            screens[i].classList.remove('active');
        }
        let screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    },

    showWelcomeMessage: function() {
        let welcomeEl = document.querySelector('.welcome-msg');
        if (welcomeEl) {
            if (typeof localizationManager !== 'undefined') {
                welcomeEl.textContent = localizationManager.t('welcome');
            }
        }
    },

    showMenu: function() {
        let username = (typeof localizationManager !== 'undefined' && localizationManager.t) ? localizationManager.t('hero') : 'Герой';
        if (this.currentUser) {
            username = this.currentUser.nickname || this.currentUser.name || username;
        }
        let usernameEl = document.getElementById('menu-username');
        if (usernameEl) {
            usernameEl.textContent = username;
        }
        
        if (typeof localizationManager !== 'undefined') {
            localizationManager.updateAllUI();
        }
        
        this.showScreen('menu-screen');
        levelsManager.load();
    },

    showProfile: function() {
        let user = auth.getUser();
        if (!user) return;
        
        document.getElementById('profile-phone').value = user.phone || '';
        document.getElementById('profile-nickname').value = user.nickname || '';
        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-age').value = user.age || '';
        
        let radios = document.querySelectorAll('input[name="profile-gender"]');
        for (let i = 0; i < radios.length; i++) {
            radios[i].checked = radios[i].value === user.gender;
        }
        
        let gender = user.gender || 'boy';
        let saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.classList.remove('btn-pink', 'btn-blue');
            saveBtn.classList.add(gender === 'girl' ? 'btn-pink' : 'btn-blue');
        }
        
        let charBtns = document.querySelectorAll('#profile-screen .char-btn');
        for (let i = 0; i < charBtns.length; i++) {
            charBtns[i].classList.remove('selected');
            if (charBtns[i].dataset.performer === user.performer) {
                charBtns[i].classList.add('selected');
            }
        }
        
        document.getElementById('profile-message').textContent = '';
        if (typeof localizationManager !== 'undefined') {
            localizationManager.updateAllUI();
            if (typeof app.updateLanguageDropdowns === 'function') {
                app.updateLanguageDropdowns(localizationManager.currentLanguage);
            }
        }
        this.showScreen('profile-screen');
    },

    showLeaderboard: function() {
        if (typeof localizationManager !== 'undefined') {
            localizationManager.updateAllUI();
        }

        this.showScreen('leaderboard-screen');
        if (typeof leaderboardManager !== 'undefined') {
            leaderboardManager.load('all');
        }
    },

    showAchievements: function() {
        if (typeof localizationManager !== 'undefined') {
            localizationManager.updateAllUI();
        }

        let titleEl = document.querySelector('#achievements-screen .header h2');
        if (titleEl) {
            let l10n = typeof localizationManager !== 'undefined' ? localizationManager : null;
            titleEl.textContent = l10n ? l10n.t('achievements') : 'Награды';
        }

        this.showScreen('achievements-screen');
        if (typeof achievementsManager !== 'undefined') {
            achievementsManager.load();
        }
    },

    saveProfile: function() {
        let nickname = document.getElementById('profile-nickname').value.trim();
        let name = document.getElementById('profile-name').value.trim();
        let age = document.getElementById('profile-age').value;
        let genderRadio = document.querySelector('input[name="profile-gender"]:checked');
        let gender = genderRadio ? genderRadio.value : 'boy';
        
        let performerBtns = document.querySelectorAll('#profile-screen .char-btn.selected');
        let performer = performerBtns.length > 0 ? performerBtns[0].dataset.performer : 'builder';
        
        let messageEl = document.getElementById('profile-message');
        
        if (!nickname) {
            messageEl.textContent = localizationManager ? localizationManager.t('enterNickname') : 'Введите псевдоним!';
            messageEl.className = 'form-message error';
            messageEl.style.display = 'block';
            return;
        }
        
        let self = this;
        fetch(this.API_URL + '/api/auth/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + auth.getToken()
            },
            body: JSON.stringify({
                nickname: nickname,
                name: name,
                age: age ? parseInt(age) : null,
                gender: gender,
                performer: performer
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                auth.user.nickname = nickname;
                auth.user.name = name;
                auth.user.age = age ? parseInt(age) : null;
                auth.user.gender = gender;
                auth.user.performer = performer;
                localStorage.setItem('user', JSON.stringify(auth.user));
                
                themeManager.apply(gender);
                
                let saveBtn = document.getElementById('save-profile-btn');
                if (saveBtn) {
                    saveBtn.classList.remove('btn-pink', 'btn-blue');
                    saveBtn.classList.add(gender === 'girl' ? 'btn-pink' : 'btn-blue');
                }
                
                if (typeof localizationManager !== 'undefined') {
                    localizationManager.setGender(gender);
                }
                
                messageEl.textContent = localizationManager ? localizationManager.t('saved') : 'Сохранено!';
                messageEl.className = 'form-message success';
                messageEl.style.display = 'block';
            } else {
                let errMsg = localizationManager ? localizationManager.t('saveError') : 'Ошибка сохранения';
                messageEl.textContent = data.error || errMsg;
                messageEl.className = 'form-message error';
                messageEl.style.display = 'block';
            }
        })
        .catch(function(err) {
            messageEl.textContent = localizationManager ? localizationManager.t('connectionError') : 'Ошибка соединения';
            messageEl.className = 'form-message error';
            messageEl.style.display = 'block';
        });
    },

    updateLanguageDropdowns: function(lang) {
        let langNames = {
            ru: 'Русский',
            en: 'English',
            es: 'Español',
            tg: 'Тоҷикӣ',
            uz: "O'zbekcha",
            bxr: 'Буряад'
        };
        let langFlags = {
            ru: '/flags/ru.png',
            en: '/flags/us.png',
            es: '/flags/es.png',
            tg: '/flags/tg.png',
            uz: '/flags/uz.png',
            bxr: '/flags/ru.png'
        };
        
        let dropdownBtns = document.querySelectorAll('.lang-dropdown-btn');
        for (let i = 0; i < dropdownBtns.length; i++) {
            let btn = dropdownBtns[i];
            let flagImg = btn.querySelector('.flag-icon');
            let nameSpan = btn.querySelector('span:not(.dropdown-arrow)');
            if (flagImg) flagImg.src = langFlags[lang] || langFlags.ru;
            if (nameSpan) nameSpan.textContent = langNames[lang] || langNames.ru;
        }
        
        let langBtns = document.querySelectorAll('.language-bar .lang-btn');
        for (let i = 0; i < langBtns.length; i++) {
            langBtns[i].classList.remove('selected');
            if (langBtns[i].dataset.lang === lang) langBtns[i].classList.add('selected');
        }
    },

    startLevel: function(level) {
        if (typeof gameManager !== 'undefined') {
            gameManager.start(level);
        } else if (typeof window.gameManager !== 'undefined') {
            window.gameManager.start(level);
        } else {
            console.error('[APP] gameManager not found!');
        }
        this.showScreen('game-screen');
    },

    onLoginSuccess: function() {
        let self = this;
        this.currentUser = auth.user;
        themeManager.apply(this.currentUser.gender);

        let gender = this.currentUser.gender || 'boy';
        let saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.classList.remove('btn-pink', 'btn-blue');
            saveBtn.classList.add(gender === 'girl' ? 'btn-pink' : 'btn-blue');
        }

        if (typeof localizationManager !== 'undefined') {
            localizationManager.setGender(gender);
        }

        this.loadUserScore();
        this.connectWebSocket(auth.token);
        this.showMenu();
    },

    loadUserScore: function() {
        let self = this;
        let token = auth.getToken();
        if (!token) return;

        fetch(this.API_URL + '/api/score', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            let scoreEl = document.getElementById('total-score');
            if (scoreEl && data.score !== undefined) {
                scoreEl.textContent = data.score;
            }
        })
        .catch(function(err) {
            console.error('Error loading score:', err);
        });
    },

    logout: function() {
        auth.logout();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.showScreen('start-screen');
    },

    connectWebSocket: function(token) {
        let actualToken = auth.getToken();
        
        if (!actualToken) {
            console.error('[WS] NO TOKEN!');
            return;
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }
        
        let self = this;
        let wsUrl = window.location.origin.replace(/^http:/i, 'ws:') + '/ws?token=' + encodeURIComponent(actualToken);
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onmessage = function(event) {
            let data = JSON.parse(event.data);
            
            if (data.type === 'score_update') {
                leaderboardManager.load();
                let user = auth.getUser();
                if (user && data.userId === user.id) {
                    let scoreEl = document.getElementById('total-score');
                    if (scoreEl) {
                        scoreEl.textContent = data.score;
                    }
                }
            }
        };

        this.ws.onerror = function(err) {
            console.error('[WS] Error:', err);
        };
        
        this.ws.onclose = function() {
            setTimeout(function() {
                if (auth.isAuthenticated()) {
                    self.connectWebSocket(auth.getToken());
                }
            }, 3000);
        };
    }
};

document.addEventListener('DOMContentLoaded', function() {
    app.init();
    
    let modals = document.querySelectorAll('.modal');
    for (let i = 0; i < modals.length; i++) {
        modals[i].addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
});