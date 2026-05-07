var app = {
    API_URL: window.location.origin,
    currentUser: null,
    currentLevel: null,
    ws: null,

    init: function() {
        var self = this;
        
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
        var self = this;
        
        var backBtns = document.querySelectorAll('.back-btn');
        for (var i = 0; i < backBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var currentScreen = document.querySelector('.screen.active');
                    if (currentScreen && currentScreen.id === 'game-screen') {
                        levelsManager.load();
                        self.showMenu();
                    } else if (currentScreen && currentScreen.id === 'profile-screen') {
                        app.showMenu();
                    }
                });
            })(backBtns[i]);
        }
        
        var startLevelBtn = document.getElementById('start-level-btn');
        if (startLevelBtn) {
            startLevelBtn.addEventListener('click', function() {
                var levelData = window.currentLevelData;
                if (levelData) {
                    self.startLevel(levelData);
                }
                document.getElementById('level-info-modal').classList.remove('active');
            });
        }
        
        var cancelLevelBtn = document.getElementById('cancel-level-btn');
        if (cancelLevelBtn) {
            cancelLevelBtn.addEventListener('click', function() {
                document.getElementById('level-info-modal').classList.remove('active');
            });
        }
        
        var settingsBtn = document.querySelector('.settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function() { self.showProfile(); });
        }
        
        var logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() { self.logout(); });
        }
        
        var langBtns = document.querySelectorAll('.language-bar .lang-btn');
        for (var i = 0; i < langBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var lang = btn.dataset.lang;
                    if (typeof localizationManager !== 'undefined') {
                        localizationManager.setLanguage(lang);
                    }
                });
            })(langBtns[i]);
        }
        
        var performerBtns = document.querySelectorAll('#register-screen .char-btn, #profile-screen .char-btn');
        for (var i = 0; i < performerBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var container = btn.closest('.character-select') || btn.closest('.form-group');
                    var btns = container.querySelectorAll('.char-btn');
                    for (var j = 0; j < btns.length; j++) {
                        btns[j].classList.remove('selected');
                    }
                    btn.classList.add('selected');
                });
            })(performerBtns[i]);
        }
        
        var genderBtns = document.querySelectorAll('#register-screen .gender-btn');
        for (var i = 0; i < genderBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var btns = document.querySelectorAll('#register-screen .gender-btn');
                    for (var j = 0; j < btns.length; j++) {
                        btns[j].classList.remove('selected');
                    }
                    btn.classList.add('selected');
                });
            })(genderBtns[i]);
        }
        
        var chapterBtns = document.querySelectorAll('.chapter-btn');
        for (var i = 0; i < chapterBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var chapter = parseInt(btn.dataset.chapter);
                    var btns = document.querySelectorAll('.chapter-btn');
                    for (var j = 0; j < btns.length; j++) {
                        btns[j].classList.remove('active');
                    }
                    btn.classList.add('active');
                    if (typeof levelsManager !== 'undefined') {
                        levelsManager.setChapter(chapter);
                    }
                });
            })(chapterBtns[i]);
        }
        
        var dropdownBtns = document.querySelectorAll('.lang-dropdown-btn');
        for (var i = 0; i < dropdownBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var dropdown = btn.closest('.language-dropdown');
                    var allDropdowns = document.querySelectorAll('.language-dropdown');
                    for (var j = 0; j < allDropdowns.length; j++) {
                        if (allDropdowns[j] !== dropdown) allDropdowns[j].classList.remove('open');
                    }
                    dropdown.classList.toggle('open');
                });
            })(dropdownBtns[i]);
        }
        
        var langOptions = document.querySelectorAll('.lang-option');
        for (var i = 0; i < langOptions.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var lang = btn.dataset.lang;
                    var dropdown = btn.closest('.language-dropdown');
                    dropdown.classList.remove('open');
                    
                    if (typeof localizationManager !== 'undefined') {
                        localizationManager.setLanguage(lang);
                    }
                    
                    self.updateLanguageDropdowns(lang);
                });
            })(langOptions[i]);
        }
        
        document.addEventListener('click', function() {
            var allDropdowns = document.querySelectorAll('.language-dropdown');
            for (var i = 0; i < allDropdowns.length; i++) {
                allDropdowns[i].classList.remove('open');
            }
        });
        
        var saveProfileBtn = document.getElementById('save-profile-btn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', function() { self.saveProfile(); });
        }
    },

    showScreen: function(screenId) {
        var screens = document.querySelectorAll('.screen');
        for (var i = 0; i < screens.length; i++) {
            screens[i].classList.remove('active');
        }
        var screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    },

    showWelcomeMessage: function() {
        var welcomeEl = document.querySelector('.welcome-msg');
        if (welcomeEl) {
            if (typeof localizationManager !== 'undefined') {
                welcomeEl.textContent = localizationManager.t('welcome');
            }
        }
    },

    showMenu: function() {
        var username = (typeof localizationManager !== 'undefined' && localizationManager.t) ? localizationManager.t('hero') : 'Герой';
        if (this.currentUser) {
            username = this.currentUser.nickname || this.currentUser.name || username;
        }
        var usernameEl = document.getElementById('menu-username');
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
        var user = auth.getUser();
        if (!user) return;
        
        document.getElementById('profile-phone').value = user.phone || '';
        document.getElementById('profile-nickname').value = user.nickname || '';
        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-age').value = user.age || '';
        
        var radios = document.querySelectorAll('input[name="profile-gender"]');
        for (var i = 0; i < radios.length; i++) {
            radios[i].checked = radios[i].value === user.gender;
        }
        
        var gender = user.gender || 'boy';
        var saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.classList.remove('btn-pink', 'btn-blue');
            saveBtn.classList.add(gender === 'girl' ? 'btn-pink' : 'btn-blue');
        }
        
        var charBtns = document.querySelectorAll('#profile-screen .char-btn');
        for (var i = 0; i < charBtns.length; i++) {
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

    saveProfile: function() {
        var nickname = document.getElementById('profile-nickname').value.trim();
        var name = document.getElementById('profile-name').value.trim();
        var age = document.getElementById('profile-age').value;
        var genderRadio = document.querySelector('input[name="profile-gender"]:checked');
        var gender = genderRadio ? genderRadio.value : 'boy';
        
        var performerBtns = document.querySelectorAll('#profile-screen .char-btn.selected');
        var performer = performerBtns.length > 0 ? performerBtns[0].dataset.performer : 'builder';
        
        var messageEl = document.getElementById('profile-message');
        
        if (!nickname) {
            messageEl.textContent = localizationManager ? localizationManager.t('enterNickname') : 'Введите псевдоним!';
            messageEl.className = 'form-message error';
            messageEl.style.display = 'block';
            return;
        }
        
        var self = this;
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
                
                var saveBtn = document.getElementById('save-profile-btn');
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
                var errMsg = localizationManager ? localizationManager.t('saveError') : 'Ошибка сохранения';
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
        var langNames = {
            ru: 'Русский',
            en: 'English',
            es: 'Español',
            tg: 'Тоҷикӣ',
            uz: "O'zbekcha"
        };
        var langFlags = {
            ru: '/flags/ru.png',
            en: '/flags/us.png',
            es: '/flags/es.png',
            tg: '/flags/tg.png',
            uz: '/flags/uz.png'
        };
        
        var dropdownBtns = document.querySelectorAll('.lang-dropdown-btn');
        for (var i = 0; i < dropdownBtns.length; i++) {
            var btn = dropdownBtns[i];
            var flagImg = btn.querySelector('.flag-icon');
            var nameSpan = btn.querySelector('span:not(.dropdown-arrow)');
            if (flagImg) flagImg.src = langFlags[lang] || langFlags.ru;
            if (nameSpan) nameSpan.textContent = langNames[lang] || langNames.ru;
        }
        
        var langBtns = document.querySelectorAll('.language-bar .lang-btn');
        for (var i = 0; i < langBtns.length; i++) {
            langBtns[i].classList.remove('selected');
            if (langBtns[i].dataset.lang === lang) langBtns[i].classList.add('selected');
        }
    },

    startLevel: function(level) {
        this.currentLevel = level;
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
        this.currentUser = auth.user;
        themeManager.apply(this.currentUser.gender);
        
        var gender = this.currentUser.gender || 'boy';
        var saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            saveBtn.classList.remove('btn-pink', 'btn-blue');
            saveBtn.classList.add(gender === 'girl' ? 'btn-pink' : 'btn-blue');
        }
        
        if (typeof localizationManager !== 'undefined') {
            localizationManager.setGender(gender);
        }
        
        this.connectWebSocket(auth.token);
        this.showMenu();
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
        var actualToken = auth.getToken();
        
        if (!actualToken) {
            console.error('[WS] NO TOKEN!');
            return;
        }
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }
        
        var self = this;
        var wsUrl = window.location.origin.replace(/^http:/i, 'ws:') + '/ws?token=' + encodeURIComponent(actualToken);
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onmessage = function(event) {
            var data = JSON.parse(event.data);
            
            if (data.type === 'score_update') {
                leaderboardManager.load();
                var user = auth.getUser();
                if (user && data.userId === user.id) {
                    var scoreEl = document.getElementById('total-score');
                    if (scoreEl) {
                        scoreEl.textContent = parseInt(scoreEl.textContent) + data.score;
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
    
    var modals = document.querySelectorAll('.modal');
    for (var i = 0; i < modals.length; i++) {
        modals[i].addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
});