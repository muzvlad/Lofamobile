const LANG_NAMES = {
    ru: 'Русский',
    en: 'English',
    es: 'Español',
    tg: 'Тоҷикӣ',
    uz: "O'zbekcha",
    bxr: 'Буряад'
};

const LANG_FLAGS = {
    ru: '/flags/ru.png',
    en: '/flags/us.png',
    es: '/flags/es.png',
    tg: '/flags/tg.png',
    uz: '/flags/uz.png',
    bxr: '/flags/ru.png'
};

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
        
        if (localizationManager) {
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
            let btn = backBtns[i];
            btn.addEventListener('click', function() {
                let currentScreen = document.querySelector('.screen.active');
                if (currentScreen && currentScreen.id === 'game-screen') {
                    levelsManager.load();
                    self.showMenu();
                } else if (currentScreen && currentScreen.id === 'profile-screen') {
                    app.showMenu();
                } else {
                    self.showMenu();
                }
            });
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
            let btn = langBtns[i];
            btn.addEventListener('click', function() {
                let lang = btn.dataset.lang;
                if (localizationManager) {
                    localizationManager.setLanguage(lang);
                }
                btn.setAttribute('aria-label', LANG_NAMES[lang] || lang);
            });
        }

        let menuTabs = document.querySelectorAll('.menu-tabs .tab-btn');
        for (let i = 0; i < menuTabs.length; i++) {
            let btn = menuTabs[i];
            btn.addEventListener('click', function() {
                let tab = btn.dataset.tab;
                let allTabs = document.querySelectorAll('.menu-tabs .tab-btn');
                for (let j = 0; j < allTabs.length; j++) {
                    allTabs[j].classList.remove('active');
                    allTabs[j].setAttribute('aria-selected', 'false');
                }
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');

                if (tab === 'levels') {
                    self.showMenu();
                } else if (tab === 'leaderboard') {
                    self.showLeaderboard();
                } else if (tab === 'achievements') {
                    self.showAchievements();
                }
            });
        }
        
        let performerBtns = document.querySelectorAll('#register-screen .char-btn, #profile-screen .char-btn');
        for (let i = 0; i < performerBtns.length; i++) {
            let btn = performerBtns[i];
            btn.addEventListener('click', function() {
                let container = btn.closest('.character-select') || btn.closest('.form-group');
                let btns = container.querySelectorAll('.char-btn');
                for (let j = 0; j < btns.length; j++) {
                    btns[j].classList.remove('selected');
                }
                btn.classList.add('selected');
            });
        }
        
        let genderBtns = document.querySelectorAll('#register-screen .gender-btn');
        for (let i = 0; i < genderBtns.length; i++) {
            let btn = genderBtns[i];
            btn.addEventListener('click', function() {
                let btns = document.querySelectorAll('#register-screen .gender-btn');
                for (let j = 0; j < btns.length; j++) {
                    btns[j].classList.remove('selected');
                }
                btn.classList.add('selected');
            });
        }
        
        let dropdownBtns = document.querySelectorAll('.lang-dropdown-btn');
        for (let i = 0; i < dropdownBtns.length; i++) {
            let btn = dropdownBtns[i];
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                let dropdown = btn.closest('.language-dropdown');
                let allDropdowns = document.querySelectorAll('.language-dropdown');
                for (let j = 0; j < allDropdowns.length; j++) {
                    if (allDropdowns[j] !== dropdown) allDropdowns[j].classList.remove('open');
                }
                dropdown.classList.toggle('open');
            });
        }
        
        let langOptions = document.querySelectorAll('.lang-option');
        for (let i = 0; i < langOptions.length; i++) {
            let btn = langOptions[i];
            btn.addEventListener('click', function() {
                let lang = btn.dataset.lang;
                let dropdown = btn.closest('.language-dropdown');
                dropdown.classList.remove('open');
                
                if (localizationManager) {
                    localizationManager.setLanguage(lang);
                }
                
                self.updateLanguageDropdowns(lang);
            });
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
            screens[i].setAttribute('aria-hidden', 'true');
        }
        let screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            screen.removeAttribute('aria-hidden');
            if (localizationManager) {
                setTimeout(function() { localizationManager.updateAllUI(); }, 0);
            }
        }
    },

    showWelcomeMessage: function() {
        let welcomeEl = document.querySelector('.welcome-msg');
        if (welcomeEl) {
            if (localizationManager) {
                welcomeEl.textContent = localizationManager.t('welcome');
            }
        }
    },

    showMenu: function() {
        let username = (localizationManager && localizationManager.t) ? localizationManager.t('hero') : 'Герой';
        if (this.currentUser) {
            username = this.currentUser.nickname || this.currentUser.name || username;
        }
        let usernameEl = document.getElementById('menu-username');
        if (usernameEl) {
            usernameEl.textContent = username;
        }
        
        if (localizationManager) {
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
        if (localizationManager) {
            localizationManager.updateAllUI();
            if (typeof app.updateLanguageDropdowns === 'function') {
                app.updateLanguageDropdowns(localizationManager.currentLanguage);
            }
        }
        this.showScreen('profile-screen');
    },

    showLeaderboard: function() {
        if (localizationManager) {
            localizationManager.updateAllUI();
        }

        this.showScreen('leaderboard-screen');
        if (typeof leaderboardManager !== 'undefined') {
            leaderboardManager.load('all');
        }
    },

    showAchievements: function() {
        if (localizationManager) {
            localizationManager.updateAllUI();
        }

        let titleEl = document.querySelector('#achievements-screen .header h2');
        if (titleEl) {
            let l10n = getL10n();
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
                if (data.token) {
                    auth.user.token = data.token;
                    auth.token = data.token;
                }
                localStorage.setItem('token', auth.token);
                localStorage.setItem('user', JSON.stringify(auth.user));
                
                themeManager.apply(gender);
                
                let saveBtn = document.getElementById('save-profile-btn');
                if (saveBtn) {
                    saveBtn.classList.remove('btn-pink', 'btn-blue');
                    saveBtn.classList.add(gender === 'girl' ? 'btn-pink' : 'btn-blue');
                }
                
                if (localizationManager) {
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
        let dropdownBtns = document.querySelectorAll('.lang-dropdown-btn');
        for (let i = 0; i < dropdownBtns.length; i++) {
            let btn = dropdownBtns[i];
            let flagImg = btn.querySelector('.flag-icon');
            let nameSpan = btn.querySelector('span:not(.dropdown-arrow)');
            if (flagImg) flagImg.src = LANG_FLAGS[lang] || LANG_FLAGS.ru;
            if (nameSpan) nameSpan.textContent = LANG_NAMES[lang] || LANG_NAMES.ru;
        }
        
        let langBtns = document.querySelectorAll('.language-bar .lang-btn');
        for (let i = 0; i < langBtns.length; i++) {
            langBtns[i].classList.remove('selected');
            if (langBtns[i].dataset.lang === lang) langBtns[i].classList.add('selected');
            langBtns[i].setAttribute('aria-label', LANG_NAMES[lang] || lang);
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

        if (localizationManager) {
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

    connectWebSocket: function(attempt) {
        let actualToken = auth.getToken();
        attempt = attempt || 0;
        
        if (!actualToken) {
            return;
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }
        
        let self = this;
        let wsUrl = window.location.origin.replace(/^http:/i, 'ws:') + '/ws';
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = function() {
            self.ws.send(JSON.stringify({ type: 'auth', token: auth.getToken() }));
        };
        
        this.ws.onmessage = function(event) {
            attempt = 0;
            try {
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
            } catch (e) {
                console.error('[WS] Parse error:', e);
            }
        };

        this.ws.onerror = function(err) {
            console.error('[WS] Error:', err);
        };
        
        this.ws.onclose = function() {
            let delay = Math.min(1000 * Math.pow(2, attempt), 30000);
            setTimeout(function() {
                if (auth.isAuthenticated()) {
                    self.connectWebSocket(attempt + 1);
                }
            }, delay);
        };
    },

    openModal: function(modalId) {
        let modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('active');
        modal.removeAttribute('aria-hidden');
        let firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) firstFocusable.focus();
    },

    closeModal: function(modalId) {
        let modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    app.init();
    
    let modals = document.querySelectorAll('.modal');
    for (let i = 0; i < modals.length; i++) {
        modals[i].addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                this.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            let activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                activeModal.classList.remove('active');
                activeModal.setAttribute('aria-hidden', 'true');
            }
        }
    });
});