const leaderboardManager = {
    API_URL: window.location.origin,
    entries: [],

    async load(genderFilter = 'all') {
        const list = document.getElementById('leaderboard-list');
        const msgEl = document.getElementById('leaderboard-message');
        const l10n = getL10n();
        if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }
        if (list) { list.innerHTML = '<div class="loading-text">' + (l10n && l10n.t ? l10n.t('loading') : 'Загрузка...') + '</div>'; }

        try {
            const url = genderFilter !== 'all' 
                ? `${this.API_URL}/api/leaderboard?gender=${genderFilter}`
                : `${this.API_URL}/api/leaderboard`;
            
            const res = await fetch(url);
            const data = await res.json();
            this.entries = data.leaderboard || [];
            this.render();
        } catch (err) {
            console.error('Error loading leaderboard:', err);
            if (list) { list.innerHTML = ''; }
            if (msgEl) {
                msgEl.textContent = l10n && l10n.t ? l10n.t('connectionError') : 'Ошибка соединения';
                msgEl.className = 'form-message error';
            }
        }
    },

    render() {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        const themeData = themeManager.getTheme(auth.getUser()?.gender || null);

        this.entries.forEach((entry, i) => {
            const div = document.createElement('div');
            div.className = 'leaderboard-item';
            
            let rankClass = '';
            if (i === 0) rankClass = 'gold';
            else if (i === 1) rankClass = 'silver';
            else if (i === 2) rankClass = 'bronze';

            const gender = entry.gender || 'boy';
            const charEmoji = themeData.characters && themeData.characters[gender] ? (themeData.characters[gender].emoji || '') : '';

            const rankSpan = document.createElement('span');
            rankSpan.className = 'rank ' + rankClass;
            rankSpan.textContent = entry.rank;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'name';
            nameSpan.textContent = entry.username + ' ' + charEmoji;

            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'score';
            scoreSpan.textContent = entry.score;

            div.appendChild(rankSpan);
            div.appendChild(nameSpan);
            div.appendChild(scoreSpan);
            
            list.appendChild(div);
        });
    }
};
