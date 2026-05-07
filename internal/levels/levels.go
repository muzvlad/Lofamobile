package levels

import "codequest/internal/types"

type Awards struct {
	Stars       int    `json:"stars"`
	XP          int    `json:"xp"`
	Achievement string `json:"achievement,omitempty"`
}

type LevelTemplate struct {
	Name               string
	Desc               string
	Grid               [][]int
	Player             types.Player
	Goal               string
	Items              []types.Item
	Par                int
	Optimal            int
	Difficulty         int
	Background         string
	Awards             Awards `json:"awards,omitempty"`
	AvailableCommands []string
}

func GetChapterLevels(chapter int, gender string) []LevelTemplate {
	switch chapter {
	case 1:
		if gender == "boy" {
			return Chapter1Boy
		}
		return Chapter1Girl
	case 2:
		return Chapter2
	default:
		return Chapter1Girl
	}
}

// Глава 1 - Девочка (Кухня)
var Chapter1Girl = []LevelTemplate{
	{
		Name:       "Первый шаг",
		Desc:       "Бабушка ушла в гости, оставив на столе рецепт. Ты стоишь у входа на кухню.",
		Grid:       [][]int{{2, 0, 0, 3}, {0, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 0, 0}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "Дойди до холодильника",
		Par:        3,
		Optimal:    3,
		Difficulty: 1,
		Awards:     Awards{Stars: 1, XP: 10},
	},
	{
		Name:       "Обход препятствия",
		Desc:       "Путь к разделочному столу преграждает спящий кот.",
		Grid:       [][]int{{3, 0, 0, 0}, {1, 0, 1, 0}, {0, 2, 1, 0}, {0, 0, 0, 0}},
		Player:     types.Player{X: 1, Y: 2, Direction: 0},
		Goal:       "Обойди кота и дойди до цели",
		Par:        4,
		Optimal:    4,
		Difficulty: 1,
		Awards:     Awards{Stars: 1, XP: 15},
	},
	{
		Name:       "Сбор ингредиентов",
		Desc:       "Пакет с мукой остался в углу.",
		Grid:       [][]int{{0, 0, 0, 4}, {0, 0, 4, 0}, {2, 0, 0, 0}, {3, 0, 0, 0}},
		Player:     types.Player{X: 0, Y: 2, Direction: 1},
		Goal:       "Дойди до муки, возьми её и вернись",
		Items:      []types.Item{{X: 3, Y: 1, Type: "flour"}},
		Par:        6,
		Optimal:    10,
		Difficulty: 1,
		Awards:     Awards{Stars: 2, XP: 20},
	},
	{
		Name:       "level_4_name",
		Desc:       "level_4_desc",
		Grid:       [][]int{{2, 0, 1, 0}, {0, 0, 1, 0}, {0, 0, 1, 0}, {0, 0, 1, 3}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_4_goal",
		Par:        6,
		Optimal:    5,
		Difficulty: 2,
		Awards:     Awards{Stars: 1, XP: 15},
	},
	{
		Name:       "level_5_name",
		Desc:       "level_5_desc",
		Grid:       [][]int{{0, 1, 0, 0}, {0, 1, 0, 0}, {1, 1, 1, 1}, {0, 0, 1, 3}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_5_goal",
		Par:        6,
		Optimal:    5,
		Difficulty: 2,
		Awards:     Awards{Stars: 2, XP: 25},
	},
	{
		Name:       "level_6_name",
		Desc:       "level_6_desc",
		Grid:       [][]int{{2, 5, 3, 5}, {0, 0, 1, 0}, {0, 1, 0, 0}, {1, 0, 0, 0}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_6_goal",
		Items:      []types.Item{{X: 3, Y: 3, Type: "flour"}},
		AvailableCommands: []string{"up", "down", "left", "right", "collect"},
		Par:        9,
		Optimal:    9,
		Difficulty: 2,
		Awards:     Awards{Stars: 2, XP: 30},
	},
	{
		Name:       "level_7_name",
		Desc:       "level_7_desc",
		Grid:       [][]int{{2, 5, 0, 0}, {0, 0, 0, 5}, {5, 0, 7, 5}, {3, 0, 0, 0}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_7_goal",
		Items:      []types.Item{{X: 3, Y: 3, Type: "apple"}},
		Par:        7,
		Optimal:    7,
		Difficulty: 3,
		Awards:     Awards{Stars: 2, XP: 35},
	},
	{
		Name:       "level_8_name",
		Desc:       "level_8_desc",
		Grid:       [][]int{{2, 0, 0, 0}, {0, 0, 0, 8}, {9, 9, 9, 5}, {0, 0, 1, 3}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_8_goal",
		Items:      []types.Item{{X: 2, Y: 0, Type: "broom"}, {X: 0, Y: 3, Type: "trash_bag"}},
		Par:        8,
		Optimal:    8,
		Difficulty: 3,
		Awards:     Awards{Stars: 3, XP: 40},
	},
	{
		Name:       "level_9_name",
		Desc:       "level_9_desc",
		Grid:       [][]int{{0, 0, 0, 0}, {9, 9, 0, 9}, {0, 0, 0, 9}, {2, 0, 0, 3}},
		Player:     types.Player{X: 0, Y: 3, Direction: 1},
		Goal:       "level_9_goal",
		Items:      []types.Item{{X: 0, Y: 0, Type: "flag"}, {X: 3, Y: 0, Type: "box_tools"}},
		Par:        10,
		Optimal:    10,
		Difficulty: 3,
		Awards:     Awards{Stars: 3, XP: 45},
	},
	{
		Name:       "level_10_name",
		Desc:       "level_10_desc",
		Grid:       [][]int{{0, 0, 1, 5, 7}, {2, 0, 0, 6, 0}, {1, 1, 0, 0, 0}, {1, 6, 0, 6, 0}, {3, 0, 0, 0, 8}},
		Player:     types.Player{X: 0, Y: 1, Direction: 1},
		Goal:       "level_10_goal",
		Items:      []types.Item{{X: 4, Y: 3, Type: "wood_boards"}},
		AvailableCommands: []string{"up", "down", "left", "right", "jump", "turn", "collect", "drop"},
		Par:        14,
		Optimal:    10,
		Difficulty: 3,
		Awards:     Awards{Stars: 3, XP: 50, Achievement: "chapter_1_complete"},
	},
}

// Глава 1 - Мальчик (Стройка)
var Chapter1Boy = []LevelTemplate{
	{
		Name:       "level_1_name",
		Desc:       "level_1_desc",
		Grid:       [][]int{{2, 0, 0, 3}, {0, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 0, 0}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_1_goal",
		Par:        3,
		Optimal:    3,
		Difficulty: 1,
		Awards:     Awards{Stars: 1, XP: 10},
	},
	{
		Name:       "level_2_name",
		Desc:       "level_2_desc",
		Grid:       [][]int{{3, 0, 0, 0}, {1, 0, 1, 0}, {0, 2, 1, 0}, {0, 0, 0, 0}},
		Player:     types.Player{X: 1, Y: 2, Direction: 0},
		Goal:       "level_2_goal",
		Par:        4,
		Optimal:    4,
		Difficulty: 1,
		Awards:     Awards{Stars: 1, XP: 15},
	},
	{
		Name:       "level_3_name",
		Desc:       "level_3_desc",
		Grid:       [][]int{{0, 0, 0, 4}, {0, 0, 4, 0}, {2, 0, 0, 0}, {3, 0, 0, 0}},
		Player:     types.Player{X: 0, Y: 2, Direction: 1},
		Goal:       "level_3_goal",
		Items:      []types.Item{{X: 2, Y: 1, Type: "nails"}, {X: 3, Y: 0, Type: "flag_box"}},
		AvailableCommands: []string{"up", "down", "left", "right", "collect"},
		Par:        6,
		Optimal:    10,
		Difficulty: 1,
		Awards:     Awards{Stars: 2, XP: 20},
	},
	{
		Name:       "level_4_name",
		Desc:       "level_4_desc",
		Grid:       [][]int{{2, 0, 1, 0}, {0, 0, 1, 0}, {0, 0, 1, 0}, {0, 0, 1, 3}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_4_goal",
		Par:        6,
		Optimal:    5,
		Difficulty: 2,
		Awards:     Awards{Stars: 1, XP: 15},
	},
	{
		Name:       "level_5_name",
		Desc:       "level_5_desc",
		Grid:       [][]int{{0, 1, 0, 0}, {0, 1, 0, 0}, {1, 1, 1, 1}, {0, 0, 0, 3}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_5_goal",
		Par:        6,
		Optimal:    5,
		Difficulty: 2,
		Awards:     Awards{Stars: 2, XP: 25},
	},
	{
		Name:       "level_6_name",
		Desc:       "level_6_desc",
		Grid:       [][]int{{2, 5, 3, 5}, {0, 0, 1, 0}, {0, 1, 0, 0}, {1, 0, 0, 0}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_6_goal",
		Items:      []types.Item{{X: 3, Y: 3, Type: "box_tools"}},
		AvailableCommands: []string{"up", "down", "left", "right", "collect"},
		Par:        9,
		Optimal:    9,
		Difficulty: 2,
		Awards:     Awards{Stars: 2, XP: 30},
	},
	{
		Name:       "level_7_name",
		Desc:       "level_7_desc",
		Grid:       [][]int{{2, 5, 0, 0}, {0, 0, 0, 5}, {5, 0, 7, 5}, {3, 0, 0, 0}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_7_goal",
		Items:      []types.Item{{X: 3, Y: 3, Type: "wood_boards"}},
		Par:        7,
		Optimal:    7,
		Difficulty: 3,
		Awards:     Awards{Stars: 2, XP: 35},
	},
	{
		Name:       "level_8_name",
		Desc:       "level_8_desc",
		Grid:       [][]int{{2, 0, 0, 0}, {0, 0, 0, 8}, {9, 9, 9, 5}, {0, 0, 1, 3}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "level_8_goal",
		Items:      []types.Item{{X: 2, Y: 0, Type: "wood_boards"}, {X: 0, Y: 3, Type: "wood_boards"}},
		Par:        8,
		Optimal:    8,
		Difficulty: 3,
		Awards:     Awards{Stars: 3, XP: 40},
	},
	{
		Name:       "level_9_name",
		Desc:       "level_9_desc",
		Grid:       [][]int{{0, 0, 0, 0}, {9, 9, 0, 9}, {0, 0, 0, 9}, {2, 0, 0, 3}},
		Player:     types.Player{X: 0, Y: 3, Direction: 1},
		Goal:       "level_9_goal",
		Items:      []types.Item{{X: 0, Y: 0, Type: "flag"}, {X: 3, Y: 0, Type: "box_tools"}},
		Par:        10,
		Optimal:    10,
		Difficulty: 3,
		Awards:     Awards{Stars: 3, XP: 45},
	},
	{
		Name:       "level_10_name",
		Desc:       "level_10_desc",
		Grid:       [][]int{{0, 0, 1, 5, 7}, {2, 0, 0, 6, 0}, {1, 1, 0, 0, 0}, {1, 6, 0, 6, 0}, {3, 0, 0, 0, 8}},
		Player:     types.Player{X: 0, Y: 1, Direction: 1},
		Goal:       "level_10_goal",
		Items:      []types.Item{{X: 4, Y: 3, Type: "wood_boards"}},
		AvailableCommands: []string{"up", "down", "left", "right", "jump", "turn", "collect", "drop"},
		Par:        14,
		Optimal:    10,
		Difficulty: 3,
		Awards:     Awards{Stars: 3, XP: 50, Achievement: "chapter_1_complete"},
	},
}

// Глава 2 - placeholder
var Chapter2 = []LevelTemplate{
	{
		Name:       "Цикл",
		Desc:       "Теперь ты изучил основы. Впереди - циклы!",
		Grid:       [][]int{{2, 0, 0, 0, 0, 3}},
		Player:     types.Player{X: 0, Y: 0, Direction: 1},
		Goal:       "Достигни флага",
		Par:        3,
		Optimal:    3,
		Difficulty: 1,
		Awards:     Awards{Stars: 1, XP: 20},
	},
}