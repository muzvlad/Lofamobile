package types

const MaxLevels = 20

type ContextKey string

const CtxLevelID ContextKey = "level_id"

type User struct {
	ID        int    `json:"id"`
	Phone     string `json:"phone"`
	Nickname  string `json:"nickname"`
	Name      string `json:"name"`
	Gender    string `json:"gender"`
	Performer string `json:"performer"`
	Age       *int   `json:"age,omitempty"`
	Language  string `json:"language,omitempty"`
	Token     string `json:"token,omitempty"`
}

type Goal struct {
	Type  string `json:"type"`
	Count int    `json:"count,omitempty"`
}

type Level struct {
	ID                int                `json:"id"`
	Name              string             `json:"name"`
	Description       string             `json:"description"`
	Grid              [][]int            `json:"grid"`
	Player            Player             `json:"player"`
	Items             []Item             `json:"items"`
	Goal              string             `json:"goal"`
	Goals             []Goal             `json:"goals,omitempty"`
	AvailableCommands []string           `json:"availableCommands"`
	Commands          map[string]Command `json:"commands"`
	Difficulty        int                `json:"difficulty"`
	Par               int                `json:"par"`
	Optimal           int                `json:"optimal"`
	Background        string             `json:"background,omitempty"`
}

type Player struct {
	X         int `json:"x"`
	Y         int `json:"y"`
	Direction int `json:"direction"`
}

type Item struct {
	X    int    `json:"x"`
	Y    int    `json:"y"`
	Type string `json:"type"`
}

type Command struct {
	Name string `json:"name"`
	Icon string `json:"icon"`
}
