const leaderboardManager = {
    API_URL: window.location.origin,
    entries: [],

    init() {},

    async load(genderFilter = 'all') {
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
            
            div.innerHTML = `
                <span class="rank ${rankClass}">${entry.rank}</span>
                <span class="name">${entry.username} ${charEmoji}</span>
                <span class="score">${entry.score}</span>
            `;
            
            list.appendChild(div);
        });
    },

    async getUserRank(userId) {
        try {
            const res = await fetch(`${this.API_URL}/api/leaderboard`);
            const data = await res.json();
            
            const user = data.leaderboard?.find(e => e.userId === userId);
            return user?.rank || null;
        } catch (err) {
            console.error('Error getting user rank:', err);
            return null;
        }
    },

    formatScore(score) {
        if (score >= 1000) {
            return (score / 1000).toFixed(1) + 'k';
        }
        return score.toString();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = leaderboardManager;
}