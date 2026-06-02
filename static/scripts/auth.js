const auth = {
    token: null,
    user: null,

    init() {
        this.token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        try {
            this.user = userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            this.user = null;
            this.token = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    isAuthenticated() {
        return this.token && this.user;
    },

    async fetchWithAuth(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            this.forceLogout();
            return null;
        }

        try {
            const res = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                this.forceLogout();
                return null;
            }

            return res;
        } catch (err) {
            console.error('Fetch error:', err);
            return null;
        }
    },

    forceLogout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof app !== 'undefined') {
            app.showScreen('start-screen');
        }
    },

    async checkAuth() {
        if (!this.token || !this.user) {
            return false;
        }

        try {
            const res = await fetch(`${window.location.origin}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (res.status === 401) {
                this.forceLogout();
                return false;
            }
            
            return res.ok;
        } catch (err) {
            return false;
        }
    },

    showMessage(elementId, message, isError = true) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = message;
            el.className = 'form-message ' + (isError ? 'error' : 'success');
        }
    },

    clearMessage(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = '';
            el.className = 'form-message';
        }
    },

    async login(phone, password) {
        this.clearMessage('login-message');
        
        if (!phone || !password) {
            throw new Error('auth_login_empty_fields');
        }

        const res = await fetch(`${window.location.origin}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });

        const data = await res.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        this.setAuth(data);
        return data;
    },

    async register(phone, nickname, name, password, gender, performer, age, language) {
        this.clearMessage('register-message');
        
        if (!phone || !nickname || !password) {
            throw new Error('auth_register_empty_fields');
        }
        
        const res = await fetch(`${window.location.origin}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, nickname, name, password, gender, performer, age, language })
        });

        const data = await res.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        this.setAuth(data);
        return data;
    },

    setAuth(data) {
        this.token = data.token;
        this.user = data;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
    },

    logout() {
        this.forceLogout();
    },

    getUser() {
        return this.user;
    },

    getToken() {
        return this.token;
    },

    initUI() {
        const registerBtn = document.getElementById('register-btn');
        const loginBtn = document.getElementById('login-btn');
        const t = (key, fallback) => { const m = getL10n(); return m ? m.t(key, fallback) : fallback; };
        
        if (registerBtn) {
            registerBtn.addEventListener('click', async () => {
                const phone = document.getElementById('reg-phone').value.trim();
                const nickname = document.getElementById('reg-nickname').value.trim();
                const name = document.getElementById('reg-name').value.trim();
                const password = document.getElementById('reg-password').value.trim();
                const gender = document.querySelector('#register-screen .gender-btn.selected')?.dataset.gender || 'boy';
                const performer = document.querySelector('#register-screen .char-btn.selected')?.dataset.performer || (gender === 'girl' ? 'cook' : 'builder');
                const ageInput = document.getElementById('reg-age').value;
                const age = ageInput ? parseInt(ageInput) : null;
                const language = localStorage.getItem('language') || 'ru';

                registerBtn.disabled = true;
                registerBtn.textContent = t('creating', 'Создание...');

                try {
                    await this.register(phone, nickname, name, password, gender, performer, age, language);
                    app.onLoginSuccess();
                } catch (err) {
                    this.showMessage('register-message', t(err.message, err.message));
                }
                
                registerBtn.disabled = false;
                registerBtn.textContent = t('registerBtn', 'Начать приключение!');
            });
        }

        if (loginBtn) {
            loginBtn.addEventListener('click', async () => {
                const phone = document.getElementById('login-phone').value.trim();
                const password = document.getElementById('login-password').value.trim();

                loginBtn.disabled = true;
                loginBtn.textContent = t('loggingIn', 'Вход...');

                try {
                    await this.login(phone, password);
                    app.onLoginSuccess();
                } catch (err) {
                    this.showMessage('login-message', t(err.message, err.message));
                }
                
                loginBtn.disabled = false;
                loginBtn.textContent = t('loginBtn', 'Войти');
            });
        }

        const showRegister = document.getElementById('show-register');
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                app.showScreen('register-screen');
            });
        }

        const showLogin = document.getElementById('show-login');
        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                app.showScreen('start-screen');
            });
        }
    }
};

auth.init();