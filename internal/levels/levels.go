package levels

import (
	"codequest/internal/types"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

type Awards struct {
	Stars       int    `json:"stars"`
	XP          int    `json:"xp"`
	Achievement string `json:"achievement,omitempty"`
}

type LevelTemplate struct {
	ID                 int            `json:"id"`
	Name               string         `json:"name"`
	Desc               string         `json:"description"`
	Grid               [][]int        `json:"grid"`
	Player             types.Player   `json:"player"`
	Goal               string         `json:"goal"`
	Items              []types.Item   `json:"items"`
	Par                int            `json:"par"`
	Optimal            int            `json:"optimal"`
	Difficulty         int            `json:"difficulty"`
	Background         string         `json:"background,omitempty"`
	Awards             Awards         `json:"awards,omitempty"`
	AvailableCommands []string        `json:"availableCommands,omitempty"`
}

type ChapterData struct {
	Chapter int              `json:"chapter"`
	Boy     []LevelTemplate `json:"boy"`
	Girl    []LevelTemplate `json:"girl"`
}

var (
	chapterCache = make(map[int]*ChapterData)
	chapterMu    sync.RWMutex
)

func GetChapterLevels(chapter int, gender string) []LevelTemplate {
	chapterMu.RLock()
	data, ok := chapterCache[chapter]
	chapterMu.RUnlock()

	if ok {
		if gender == "boy" {
			return data.Boy
		}
		return data.Girl
	}

	chapterMu.Lock()
	defer chapterMu.Unlock()

	if data, ok := chapterCache[chapter]; ok {
		if gender == "boy" {
			return data.Boy
		}
		return data.Girl
	}

	loaded, err := LoadChapterFromJSON(chapter)
	if err != nil {
		fmt.Printf("[LEVELS] Error loading chapter %d: %v\n", chapter, err)
		return getDefaultChapter()
	}

	chapterCache[chapter] = &loaded

	if gender == "boy" {
		return loaded.Boy
	}
	return loaded.Girl
}

func LoadChapterFromJSON(chapter int) (ChapterData, error) {
	dir, err := getLevelsDir()
	if err != nil {
		return ChapterData{}, err
	}

	filename := filepath.Join(dir, fmt.Sprintf("chapter_%d.json", chapter))
	data, err := os.ReadFile(filename)
	if err != nil {
		return ChapterData{}, err
	}

	var chapterData ChapterData
	if err := json.Unmarshal(data, &chapterData); err != nil {
		return ChapterData{}, err
	}

	return chapterData, nil
}

func getLevelsDir() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for i := 0; i < 20; i++ {
		testPath := cwd
		for j := 0; j < i; j++ {
			testPath = filepath.Join(testPath, "..")
		}
		levelsPath := filepath.Join(testPath, "internal", "levels")
		if _, err := os.Stat(levelsPath); err == nil {
			return levelsPath, nil
		}
	}

	return "", fmt.Errorf("levels directory not found")
}

func getDefaultChapter() []LevelTemplate {
	return []LevelTemplate{}
}

