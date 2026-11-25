package achievements

type Achievement struct {
	ID          string `json:"id"`
	NameKey     string `json:"nameKey"`
	DescKey     string `json:"descKey"`
	Icon        string `json:"icon"`
	TriggerType string `json:"triggerType"`
	ProgressMax int    `json:"progressMax"`
}

var All = []Achievement{
	{ID: "first_login", NameKey: "achFirstLogin", DescKey: "achFirstLoginDesc", Icon: "👋", TriggerType: "login", ProgressMax: 1},
	{ID: "first_level", NameKey: "achFirstLevel", DescKey: "achFirstLevelDesc", Icon: "🌟", TriggerType: "level_complete", ProgressMax: 1},
	{ID: "levels_5", NameKey: "achLevels5", DescKey: "achLevels5Desc", Icon: "⭐", TriggerType: "levels_completed", ProgressMax: 5},
	{ID: "levels_10", NameKey: "achLevels10", DescKey: "achLevels10Desc", Icon: "🌟", TriggerType: "levels_completed", ProgressMax: 10},
	{ID: "levels_15", NameKey: "achLevels15", DescKey: "achLevels15Desc", Icon: "🌟", TriggerType: "levels_completed", ProgressMax: 15},
	{ID: "levels_25", NameKey: "achLevels25", DescKey: "achLevels25Desc", Icon: "🌟", TriggerType: "levels_completed", ProgressMax: 25},
	{ID: "chapter_1", NameKey: "achChapter1", DescKey: "achChapter1Desc", Icon: "📖", TriggerType: "chapter_complete", ProgressMax: 10},
	{ID: "chapter_2", NameKey: "achChapter2", DescKey: "achChapter2Desc", Icon: "📚", TriggerType: "chapter_complete", ProgressMax: 10},
	{ID: "chapter_3", NameKey: "achChapter3", DescKey: "achChapter3Desc", Icon: "📕", TriggerType: "chapter_complete", ProgressMax: 10},
	{ID: "chapter_4", NameKey: "achChapter4", DescKey: "achChapter4Desc", Icon: "📗", TriggerType: "chapter_complete", ProgressMax: 10},
	{ID: "chapter_5", NameKey: "achChapter5", DescKey: "achChapter5Desc", Icon: "📘", TriggerType: "chapter_complete", ProgressMax: 10},
	{ID: "perfect_1", NameKey: "achPerfect1", DescKey: "achPerfect1Desc", Icon: "💯", TriggerType: "perfect_run", ProgressMax: 1},
	{ID: "perfect_5", NameKey: "achPerfect5", DescKey: "achPerfect5Desc", Icon: "💎", TriggerType: "perfect_run", ProgressMax: 5},
	{ID: "perfect_10", NameKey: "achPerfect10", DescKey: "achPerfect10Desc", Icon: "🏆", TriggerType: "perfect_run", ProgressMax: 10},
	{ID: "no_mistakes_5", NameKey: "achNoMistakes5", DescKey: "achNoMistakes5Desc", Icon: "🎯", TriggerType: "no_mistakes", ProgressMax: 5},
	{ID: "no_mistakes_10", NameKey: "achNoMistakes10", DescKey: "achNoMistakes10Desc", Icon: "🎯", TriggerType: "no_mistakes", ProgressMax: 10},
	{ID: "streak_3", NameKey: "achStreak3", DescKey: "achStreak3Desc", Icon: "🔥", TriggerType: "streak", ProgressMax: 3},
	{ID: "streak_5", NameKey: "achStreak5", DescKey: "achStreak5Desc", Icon: "🔥", TriggerType: "streak", ProgressMax: 5},
	{ID: "streak_10", NameKey: "achStreak10", DescKey: "achStreak10Desc", Icon: "⚡", TriggerType: "streak", ProgressMax: 10},
	{ID: "commands_20", NameKey: "achCommands20", DescKey: "achCommands20Desc", Icon: "⌨️", TriggerType: "commands_used", ProgressMax: 20},
	{ID: "commands_50", NameKey: "achCommands50", DescKey: "achCommands50Desc", Icon: "⌨️", TriggerType: "commands_used", ProgressMax: 50},
	{ID: "commands_100", NameKey: "achCommands100", DescKey: "achCommands100Desc", Icon: "🎮", TriggerType: "commands_used", ProgressMax: 100},
	{ID: "speed_5", NameKey: "achSpeed5", DescKey: "achSpeed5Desc", Icon: "⚡", TriggerType: "speed_level", ProgressMax: 5},
	{ID: "speed_10", NameKey: "achSpeed10", DescKey: "achSpeed10Desc", Icon: "⚡", TriggerType: "speed_level", ProgressMax: 10},
	{ID: "jump_10", NameKey: "achJump10", DescKey: "achJump10Desc", Icon: "🦘", TriggerType: "jump_used", ProgressMax: 10},
	{ID: "turn_10", NameKey: "achTurn10", DescKey: "achTurn10Desc", Icon: "↩️", TriggerType: "turn_used", ProgressMax: 10},
	{ID: "collect_10", NameKey: "achCollect10", DescKey: "achCollect10Desc", Icon: "✋", TriggerType: "collect_used", ProgressMax: 10},
	{ID: "all_chapters", NameKey: "achAllChapters", DescKey: "achAllChaptersDesc", Icon: "👑", TriggerType: "all_chapters", ProgressMax: 2},
}

func GetByID(id string) Achievement {
	for i := range All {
		if All[i].ID == id {
			return All[i]
		}
	}
	return Achievement{}
}

func GetAll() []Achievement {
	result := make([]Achievement, len(All))
	copy(result, All)
	return result
}