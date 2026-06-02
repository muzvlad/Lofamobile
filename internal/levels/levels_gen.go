package levels

import (
	"codequest/internal/types"
	"fmt"
)

var defaultCommands = map[string]types.Command{
	"up":      {Name: "Вверх", Icon: "⬆️"},
	"down":    {Name: "Вниз", Icon: "⬇️"},
	"left":    {Name: "Влево", Icon: "⬅️"},
	"right":   {Name: "Вправо", Icon: "➡️"},
	"jump":    {Name: "Прыжок", Icon: "🦘"},
	"turn":    {Name: "Разворот", Icon: "🔄"},
	"collect": {Name: "Взять", Icon: "✋"},
	"drop":    {Name: "Положить", Icon: "📦"},
}

func GetLevelsWithGender(gender string) []types.Level {
	levels := make([]types.Level, types.MaxLevels)

	for i := 1; i <= types.MaxLevels; i++ {
		levels[i-1] = generateLevel(i, gender)
	}

	return levels
}

func GetLevelByIDWithGender(id int, gender string) (types.Level, error) {
	if id < 1 || id > types.MaxLevels {
		return types.Level{}, fmt.Errorf("level not found")
	}
	return generateLevel(id, gender), nil
}

func generateLevel(id int, gender string) types.Level {
	chapter := (id-1)/10 + 1
	levelIndex := (id - 1) % 10

	chapterLevels := GetChapterLevels(chapter, gender)

	var tpl LevelTemplate
	if levelIndex < len(chapterLevels) {
		tpl = chapterLevels[levelIndex]
	} else {
		tpl = LevelTemplate{
			Name:       "Уровень " + fmt.Sprint(id),
			Desc:       "Стандартное испытание",
			Grid:       [][]int{{0, 0}, {2, 3}},
			Player:     types.Player{X: 0, Y: 0, Direction: 1},
			Goal:       "Достигни цели",
			Items:      nil,
			Par:        1,
			Optimal:    1,
			Difficulty: 1,
		}
	}

	difficulty := tpl.Difficulty
	if difficulty == 0 {
		difficulty = levelIndex/3 + 1
	}

	optimal := tpl.Optimal
	if optimal == 0 {
		optimal = tpl.Par
	}

	goals := tpl.Goals
	if len(goals) == 0 {
		goals = []types.Goal{{Type: "reach_finish"}}
		if len(tpl.Items) > 0 {
			goals = append(goals, types.Goal{Type: "collect_all"})
		}
	}

	level := types.Level{
		ID:         id,
		Name:       tpl.Name,
		Grid:       tpl.Grid,
		Player:     tpl.Player,
		Goal:       tpl.Goal,
		Goals:      goals,
		Items:      tpl.Items,
		Par:        tpl.Par,
		Optimal:    optimal,
		Difficulty: difficulty,
		Background: tpl.Background,
	}

	level.Commands = defaultCommands

	switch difficulty {
	case 1:
		level.AvailableCommands = []string{"up", "down", "left", "right"}
	case 2:
		level.AvailableCommands = []string{"up", "down", "left", "right", "jump"}
	case 3:
		level.AvailableCommands = []string{"up", "down", "left", "right", "jump", "turn"}
	default:
		level.AvailableCommands = []string{"up", "down", "left", "right"}
	}

	if len(tpl.Items) > 0 {
		hasCollect := false
		hasDrop := false
		for _, cmd := range level.AvailableCommands {
			if cmd == "collect" {
				hasCollect = true
			}
			if cmd == "drop" {
				hasDrop = true
			}
		}
		if !hasCollect {
			level.AvailableCommands = append(level.AvailableCommands, "collect")
		}
		dropInTemplate := false
		if tpl.AvailableCommands != nil {
			for _, cmd := range tpl.AvailableCommands {
				if cmd == "drop" {
					dropInTemplate = true
					break
				}
			}
		}
		if !hasDrop && dropInTemplate {
			level.AvailableCommands = append(level.AvailableCommands, "drop")
		}
	}

	level.Description = tpl.Desc

	return level
}
