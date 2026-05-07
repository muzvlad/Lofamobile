const achievementsManager = {
    API_URL: window.location.origin,
    achievements: {
        'first_login': {
            id: 'first_login',
            name: 'Первое посещение',
            description: 'Впервые вошел в игру',
            icon: '👋'
        },
        'first_level': {
            id: 'first_level',
            name: 'Первые шаги',
            description: 'Прошел первый уровень',
            icon: '🌟'
        },
        'level_5': {
            id: 'level_5',
            name: 'Начинающий герой',
            description: 'Прошел 5 уровней',
            icon: '⭐⭐⭐'
        },
        'chapter_1_complete': {
            id: 'chapter_1_complete',
            name: 'Первая глава пройдена',
            description: 'Прошел все 10 уровней первой главы',
            icon: '📖'
        },
        'all_levels': {
            id: 'all_levels',
            name: 'Мастер программирования',
            description: 'Прошел все 20 уровней',
            icon: '👑'
        },
        'perfect_level': {
            id: 'perfect_level',
            name: 'Идеальное решение',
            description: 'Прошел уровень с 3 звездами',
            icon: '💯'
        }
    },

    async load() {
        try {
            const res = await fetch(`${this.API_URL}/api/achievements`, {
                headers: { 'Authorization': `Bearer ${auth.getToken()}` }
            });
            const data = await res.json();
            return data.achievements || [];
        } catch (err) {
            console.error('Error loading achievements:', err);
            return [];
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
                body: JSON.stringify({
                    level_id: levelId,
                    achievement_type: 'level_completed'
                })
            });
        } catch (err) {
            console.error('Error saving achievement:', err);
        }
    },

    getAll() {
        return Object.values(this.achievements);
    },

    get(id) {
        return this.achievements[id];
    },

    render(earned) {
        const container = document.getElementById('achievements-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        const all = this.getAll();
        all.forEach(achievement => {
            const isEarned = earned && earned.some(e => e.type === achievement.id);
            const div = document.createElement('div');
            div.className = `achievement-item ${isEarned ? 'earned' : 'locked'}`;
            div.innerHTML = `
                <span class="achievement-icon">${achievement.icon}</span>
                <span class="achievement-name">${achievement.name}</span>
                <span class="achievement-desc">${achievement.description}</span>
            `;
            container.appendChild(div);
        });
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = achievementsManager;
}