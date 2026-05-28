const achievementsData = {
    achievements: [
        { id: 'first_login', nameKey: 'achFirstLogin', descKey: 'achFirstLoginDesc', icon: '👋', triggerType: 'login', progressMax: 1 },
        { id: 'first_level', nameKey: 'achFirstLevel', descKey: 'achFirstLevelDesc', icon: '🌟', triggerType: 'level_complete', progressMax: 1 },
        { id: 'levels_5', nameKey: 'achLevels5', descKey: 'achLevels5Desc', icon: '⭐', triggerType: 'levels_completed', progressMax: 5 },
        { id: 'levels_10', nameKey: 'achLevels10', descKey: 'achLevels10Desc', icon: '🌟', triggerType: 'levels_completed', progressMax: 10 },
        { id: 'levels_15', nameKey: 'achLevels15', descKey: 'achLevels15Desc', icon: '🌟', triggerType: 'levels_completed', progressMax: 15 },
        { id: 'levels_25', nameKey: 'achLevels25', descKey: 'achLevels25Desc', icon: '🌟', triggerType: 'levels_completed', progressMax: 25 },
        { id: 'chapter_1', nameKey: 'achChapter1', descKey: 'achChapter1Desc', icon: '📖', triggerType: 'chapter_complete', progressMax: 10 },
        { id: 'chapter_2', nameKey: 'achChapter2', descKey: 'achChapter2Desc', icon: '📚', triggerType: 'chapter_complete', progressMax: 10 },
        { id: 'chapter_3', nameKey: 'achChapter3', descKey: 'achChapter3Desc', icon: '📕', triggerType: 'chapter_complete', progressMax: 10 },
        { id: 'chapter_4', nameKey: 'achChapter4', descKey: 'achChapter4Desc', icon: '📗', triggerType: 'chapter_complete', progressMax: 10 },
        { id: 'chapter_5', nameKey: 'achChapter5', descKey: 'achChapter5Desc', icon: '📘', triggerType: 'chapter_complete', progressMax: 10 },
        { id: 'perfect_1', nameKey: 'achPerfect1', descKey: 'achPerfect1Desc', icon: '💯', triggerType: 'perfect_run', progressMax: 1 },
        { id: 'perfect_5', nameKey: 'achPerfect5', descKey: 'achPerfect5Desc', icon: '💎', triggerType: 'perfect_run', progressMax: 5 },
        { id: 'perfect_10', nameKey: 'achPerfect10', descKey: 'achPerfect10Desc', icon: '🏆', triggerType: 'perfect_run', progressMax: 10 },
        { id: 'no_mistakes_5', nameKey: 'achNoMistakes5', descKey: 'achNoMistakes5Desc', icon: '🎯', triggerType: 'no_mistakes', progressMax: 5 },
        { id: 'no_mistakes_10', nameKey: 'achNoMistakes10', descKey: 'achNoMistakes10Desc', icon: '🎯', triggerType: 'no_mistakes', progressMax: 10 },
        { id: 'streak_3', nameKey: 'achStreak3', descKey: 'achStreak3Desc', icon: '🔥', triggerType: 'streak', progressMax: 3 },
        { id: 'streak_5', nameKey: 'achStreak5', descKey: 'achStreak5Desc', icon: '🔥', triggerType: 'streak', progressMax: 5 },
        { id: 'streak_10', nameKey: 'achStreak10', descKey: 'achStreak10Desc', icon: '⚡', triggerType: 'streak', progressMax: 10 },
        { id: 'commands_20', nameKey: 'achCommands20', descKey: 'achCommands20Desc', icon: '⌨️', triggerType: 'commands_used', progressMax: 20 },
        { id: 'commands_50', nameKey: 'achCommands50', descKey: 'achCommands50Desc', icon: '⌨️', triggerType: 'commands_used', progressMax: 50 },
        { id: 'commands_100', nameKey: 'achCommands100', descKey: 'achCommands100Desc', icon: '🎮', triggerType: 'commands_used', progressMax: 100 },
        { id: 'speed_5', nameKey: 'achSpeed5', descKey: 'achSpeed5Desc', icon: '⚡', triggerType: 'speed_level', progressMax: 5 },
        { id: 'speed_10', nameKey: 'achSpeed10', descKey: 'achSpeed10Desc', icon: '⚡', triggerType: 'speed_level', progressMax: 10 },
        { id: 'jump_10', nameKey: 'achJump10', descKey: 'achJump10Desc', icon: '🦘', triggerType: 'jump_used', progressMax: 10 },
        { id: 'turn_10', nameKey: 'achTurn10', descKey: 'achTurn10Desc', icon: '↩️', triggerType: 'turn_used', progressMax: 10 },
        { id: 'collect_10', nameKey: 'achCollect10', descKey: 'achCollect10Desc', icon: '✋', triggerType: 'collect_used', progressMax: 10 },
        { id: 'all_chapters', nameKey: 'achAllChapters', descKey: 'achAllChaptersDesc', icon: '👑', triggerType: 'all_chapters', progressMax: 50 }
    ],

    getById(id) {
        return this.achievements.find(a => a.id === id) || null;
    },

    getAll() {
        return this.achievements;
    },

    getCount() {
        return this.achievements.length;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = achievementsData;
}