package levels

import (
	"testing"
)

func hasLevelsDir() bool {
	_, err := getLevelsDir()
	return err == nil
}

func TestGetChapterLevels(t *testing.T) {
	if !hasLevelsDir() {
		t.Skip("Levels directory not found")
	}

	levels := GetChapterLevels(1, "girl")
	if len(levels) != 10 {
		t.Errorf("Expected 10 girl levels, got %d", len(levels))
	}

	levels = GetChapterLevels(1, "boy")
	if len(levels) != 10 {
		t.Errorf("Expected 10 boy levels, got %d", len(levels))
	}
}

func TestLoadChapterFromJSON(t *testing.T) {
	if !hasLevelsDir() {
		t.Skip("Levels directory not found")
	}

	data, err := LoadChapterFromJSON(1)
	if err != nil {
		t.Fatalf("Failed to load chapter 1: %v", err)
	}

	if data.Chapter != 1 {
		t.Errorf("Expected chapter 1, got %d", data.Chapter)
	}

	if len(data.Girl) == 0 {
		t.Error("Chapter 1 should have girl levels")
	}

	if len(data.Boy) == 0 {
		t.Error("Chapter 1 should have boy levels")
	}
}

func TestChapter1GirlStructure(t *testing.T) {
	if !hasLevelsDir() {
		t.Skip("Levels directory not found")
	}

	data, err := LoadChapterFromJSON(1)
	if err != nil {
		t.Fatalf("Failed to load chapter 1: %v", err)
	}

	levels := data.Girl
	if len(levels) != 10 {
		t.Fatalf("Chapter 1 should have 10 girl levels, got %d", len(levels))
	}

	for i, lvl := range levels {
		if lvl.Name == "" {
			t.Errorf("Girl level[%d].Name is empty", i)
		}
		if lvl.Desc == "" {
			t.Errorf("Girl level[%d].Desc is empty", i)
		}
		if lvl.Goal == "" {
			t.Errorf("Girl level[%d].Goal is empty", i)
		}
		if len(lvl.Grid) == 0 {
			t.Errorf("Girl level[%d].Grid is empty", i)
		}
		if lvl.Par <= 0 {
			t.Errorf("Girl level[%d].Par should be > 0, got %d", i, lvl.Par)
		}
		if lvl.Difficulty <= 0 || lvl.Difficulty > 3 {
			t.Errorf("Girl level[%d].Difficulty should be 1-3, got %d", i, lvl.Difficulty)
		}
	}
}

func TestChapter1BoyStructure(t *testing.T) {
	if !hasLevelsDir() {
		t.Skip("Levels directory not found")
	}

	data, err := LoadChapterFromJSON(1)
	if err != nil {
		t.Fatalf("Failed to load chapter 1: %v", err)
	}

	levels := data.Boy
	if len(levels) != 10 {
		t.Fatalf("Chapter 1 should have 10 boy levels, got %d", len(levels))
	}

	for i, lvl := range levels {
		if lvl.Name == "" {
			t.Errorf("Boy level[%d].Name is empty", i)
		}
		if lvl.Desc == "" {
			t.Errorf("Boy level[%d].Desc is empty", i)
		}
		if lvl.Goal == "" {
			t.Errorf("Boy level[%d].Goal is empty", i)
		}
		if len(lvl.Grid) == 0 {
			t.Errorf("Boy level[%d].Grid is empty", i)
		}
		if lvl.Par <= 0 {
			t.Errorf("Boy level[%d].Par should be > 0, got %d", i, lvl.Par)
		}
	}
}

func TestLevelGridDimensions(t *testing.T) {
	if !hasLevelsDir() {
		t.Skip("Levels directory not found")
	}

	for chapter := 1; chapter <= 2; chapter++ {
		for _, gender := range []string{"girl", "boy"} {
			levels := GetChapterLevels(chapter, gender)
			if len(levels) == 0 {
				continue
			}
			for i, lvl := range levels {
				if len(lvl.Grid) == 0 {
					t.Errorf("Chapter %d (%s) level %d has empty grid", chapter, gender, i)
					continue
				}
				rows := len(lvl.Grid)
				cols := len(lvl.Grid[0])
				if cols == 0 {
					t.Errorf("Chapter %d (%s) level %d has 0 cols", chapter, gender, i)
				}

				if lvl.Player.X < 0 || lvl.Player.X >= cols {
					t.Errorf("Chapter %d (%s) level %d: Player.X out of bounds", chapter, gender, i)
				}
				if lvl.Player.Y < 0 || lvl.Player.Y >= rows {
					t.Errorf("Chapter %d (%s) level %d: Player.Y out of bounds", chapter, gender, i)
				}
			}
		}
	}
}

func TestLevelStartEndPositions(t *testing.T) {
	if !hasLevelsDir() {
		t.Skip("Levels directory not found")
	}

	for chapter := 1; chapter <= 2; chapter++ {
		for _, gender := range []string{"girl", "boy"} {
			levels := GetChapterLevels(chapter, gender)
			if len(levels) == 0 {
				continue
			}
			for i, lvl := range levels {
				hasStart := false
				hasEnd := false

				for y := 0; y < len(lvl.Grid); y++ {
					for x := 0; x < len(lvl.Grid[y]); x++ {
						if lvl.Grid[y][x] == 2 {
							hasStart = true
						}
						if lvl.Grid[y][x] == 3 {
							hasEnd = true
						}
					}
				}

				if !hasStart {
					t.Errorf("Chapter %d (%s) level %d (%s) has no start position (2)", chapter, gender, i, lvl.Name)
				}
				if !hasEnd {
					t.Errorf("Chapter %d (%s) level %d (%s) has no end position (3)", chapter, gender, i, lvl.Name)
				}
			}
		}
	}
}

func TestLevelItems(t *testing.T) {
	if !hasLevelsDir() {
		t.Skip("Levels directory not found")
	}

	data, err := LoadChapterFromJSON(1)
	if err != nil {
		t.Fatalf("Failed to load chapter 1: %v", err)
	}

	level3Girl := data.Girl[2]
	if len(level3Girl.Items) == 0 {
		t.Error("Level 3 (girl) should have items")
	}
}

func TestChapterCache(t *testing.T) {
	if !hasLevelsDir() {
		t.Skip("Levels directory not found")
	}

	levels1 := GetChapterLevels(1, "girl")
	levels2 := GetChapterLevels(1, "girl")

	if levels1 == nil || levels2 == nil {
		t.Fatal("GetChapterLevels should return non-nil")
	}

	if len(levels1) == 0 || len(levels2) == 0 {
		t.Fatal("Chapter levels should not be empty")
	}

	if &levels1[0] != &levels2[0] {
		t.Error("Chapter cache should return the same slice")
	}
}

func TestGetLevels(t *testing.T) {
	levels := GetLevelsWithGender("girl")
	if len(levels) != 20 {
		t.Errorf("Expected 20 levels, got %d", len(levels))
	}

	if levels[0].Name == "" {
		t.Error("Level name should not be empty")
	}

	if levels[0].Grid == nil {
		t.Error("Level grid should not be nil")
	}
}

func TestGetLevelByID(t *testing.T) {
	level, err := GetLevelByIDWithGender(1, "girl")
	if err != nil {
		t.Fatalf("Failed to get level: %v", err)
	}

	if level.ID != 1 {
		t.Errorf("Expected level ID 1, got %d", level.ID)
	}

	level2, err := GetLevelByIDWithGender(5, "girl")
	if err != nil {
		t.Fatalf("Failed to get level: %v", err)
	}

	if len(level2.AvailableCommands) == 0 {
		t.Error("Level 5 should have available commands")
	}
}

func TestGetLevelByID_Invalid(t *testing.T) {
	_, err := GetLevelByIDWithGender(0, "girl")
	if err == nil {
		t.Error("Should return error for invalid ID")
	}

	_, err = GetLevelByIDWithGender(21, "girl")
	if err == nil {
		t.Error("Should return error for ID > 20")
	}
}