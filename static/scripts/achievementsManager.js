const achievementsManager = {
    API_URL: window.location.origin,
    achievements: [],

    init() {
        const closeBtn = document.getElementById('close-achievement-detail');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('achievement-detail-modal').classList.remove('active');
            });
        }

        const modal = document.getElementById('achievement-detail-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }
    },

    async save(levelId) {
        try {
            await fetch(`${this.API_URL}/api/achievements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.getToken()}`
                },
                body: JSON.stringify({ achievement_type: 'level_completed', level_id: levelId })
            });
        } catch (err) {
            console.error('Error saving achievement:', err);
        }
    },

    getLocalizedAchievement(achievement) {
        const l10n = getL10n();
        const name = l10n && l10n.t ? l10n.t(achievement.nameKey) : '';
        const desc = l10n && l10n.t ? l10n.t(achievement.descKey) : '';
        return { name, desc };
    },

    async load() {
        const container = document.getElementById('achievements-list');
        const msgEl = document.getElementById('achievements-message');
        const l10n = getL10n();
        if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }
        if (container) { container.innerHTML = '<div class="loading-text">' + (l10n && l10n.t ? l10n.t('loading') : 'Загрузка...') + '</div>'; }

        try {
            const res = await fetch(`${this.API_URL}/api/achievements`, {
                headers: { 'Authorization': `Bearer ${auth.getToken()}` }
            });
            
            if (res.status === 401) {
                auth.forceLogout();
                return;
            }
            
            const data = await res.json();
            this.achievements = data.achievements || [];
            this.render();
        } catch (err) {
            console.error('Error loading achievements:', err);
            this.achievements = [];
            if (container) { container.innerHTML = ''; }
            if (msgEl) {
                msgEl.textContent = l10n && l10n.t ? l10n.t('connectionError') : 'Ошибка соединения';
                msgEl.className = 'form-message error';
            }
        }
    },

    showDetail(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        const localized = this.getLocalizedAchievement(achievement);
        const l10n = getL10n();
        const t = (key) => l10n && l10n.t ? l10n.t(key) : key;
        
        const modal = document.getElementById('achievement-detail-modal');
        
        document.getElementById('achievement-detail-icon').textContent = achievement.icon;
        document.getElementById('achievement-detail-name').textContent = localized.name;
        document.getElementById('achievement-detail-desc').textContent = localized.desc;

        const progressFill = document.getElementById('achievement-progress-fill');
        const progressText = document.getElementById('achievement-progress-text');
        const statusEl = document.getElementById('achievement-detail-status');
        const closeBtn = document.getElementById('close-achievement-detail');

        if (achievement.progressMax > 1) {
            const percent = (achievement.progress / achievement.progressMax) * 100;
            progressFill.style.width = percent + '%';
            progressText.textContent = achievement.progress + '/' + achievement.progressMax;
            progressFill.parentElement.style.display = 'flex';
            progressText.style.display = 'block';
        } else {
            progressFill.style.width = achievement.earned ? '100%' : '0%';
            progressText.textContent = achievement.earned ? '✓' : '—';
        }

        if (achievement.earned) {
            statusEl.textContent = t('achievementEarned');
            statusEl.className = 'achievement-detail-status earned';
        } else {
            statusEl.textContent = t('achievementLocked');
            statusEl.className = 'achievement-detail-status locked';
        }

        if (closeBtn) {
            closeBtn.textContent = t('achievementClose');
        }

        modal.classList.add('active');
    },

    render() {
        const container = document.getElementById('achievements-list');
        if (!container) return;

        container.innerHTML = '';

        this.achievements.forEach(achievement => {
            const localized = this.getLocalizedAchievement(achievement);
            
            const card = document.createElement('div');
            card.className = 'achievement-card ' + (achievement.earned ? 'earned' : 'locked');
            card.innerHTML = `
                <span class="achievement-card-icon">${achievement.icon}</span>
                <div class="achievement-card-name">${localized.name}</div>
                <div class="achievement-card-status">${achievement.earned ? '✓' : (achievement.progressMax > 1 ? achievement.progress + '/' + achievement.progressMax : '🔒')}</div>
            `;
            
            card.addEventListener('click', () => {
                this.showDetail(achievement.id);
            });

            container.appendChild(card);
        });
    },

    
};

achievementsManager.init();