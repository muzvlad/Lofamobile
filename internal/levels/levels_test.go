package levels

import (
	"testing"
)

func TestGetChapterLevels(t *testing.T) {
	tests := []struct {
		chapter  int
		gender   string
		wantLen  int
		wantName string
	}{
		{1, "girl", 10, "Первый шаг"},
		{1, "boy", 10, "Первый шаг"},
		{2, "girl", 10, "Цикл"},
		{2, "boy", 10, "Цикл"},
		{3, "girl", 10, "Первый шаг"},
		{0, "girl", 10, "Первый шаг"},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := GetChapterLevels(tt.chapter, tt.gender)
			if len(result) != tt.wantLen {
				t.Errorf("GetChapterLevels(%d, %s) = %d levels, want %d", tt.chapter, tt.gender, len(result), tt.wantLen)
			}
			if len(result) > 0 && result[0].Name != tt.wantName {
				t.Errorf("GetChapterLevels(%d, %s)[0].Name = %s, want %s", tt.chapter, tt.gender, result[0].Name, tt.wantName)
			}
		})
	}
}

func TestChapter1GirlStructure(t *testing.T) {
	levels := Chapter1Girl

	if len(levels) != 10 {
		t.Fatalf("Chapter1Girl should have 10 levels, got %d", len(levels))
	}

	for i, lvl := range levels {
		if lvl.Name == "" {
			t.Errorf("Chapter1Girl[%d].Name is empty", i)
		}
		if lvl.Desc == "" {
			t.Errorf("Chapter1Girl[%d].Desc is empty", i)
		}
		if lvl.Goal == "" {
			t.Errorf("Chapter1Girl[%d].Goal is empty", i)
		}
		if len(lvl.Grid) == 0 {
			t.Errorf("Chapter1Girl[%d].Grid is empty", i)
		}
		if lvl.Par <= 0 {
			t.Errorf("Chapter1Girl[%d].Par should be > 0, got %d", i, lvl.Par)
		}
		if lvl.Difficulty <= 0 || lvl.Difficulty > 3 {
			t.Errorf("Chapter1Girl[%d].Difficulty should be 1-3, got %d", i, lvl.Difficulty)
		}
	}
}

func TestChapter1BoyStructure(t *testing.T) {
	levels := Chapter1Boy

	if len(levels) != 10 {
		t.Fatalf("Chapter1Boy should have 10 levels, got %d", len(levels))
	}

	for i, lvl := range levels {
		if lvl.Name == "" {
			t.Errorf("Chapter1Boy[%d].Name is empty", i)
		}
		if lvl.Desc == "" {
			t.Errorf("Chapter1Boy[%d].Desc is empty", i)
		}
		if lvl.Goal == "" {
			t.Errorf("Chapter1Boy[%d].Goal is empty", i)
		}
		if len(lvl.Grid) == 0 {
			t.Errorf("Chapter1Boy[%d].Grid is empty", i)
		}
		if lvl.Par <= 0 {
			t.Errorf("Chapter1Boy[%d].Par should be > 0, got %d", i, lvl.Par)
		}
	}
}

func TestChapter2Structure(t *testing.T) {
	levels := Chapter2

	if len(levels) != 10 {
		t.Fatalf("Chapter2 should have 10 levels, got %d", len(levels))
	}

	for i, lvl := range levels {
		if lvl.Name == "" {
			t.Errorf("Chapter2[%d].Name is empty", i)
		}
		if lvl.Par <= 0 {
			t.Errorf("Chapter2[%d].Par should be > 0, got %d", i, lvl.Par)
		}
	}
}

func TestChapterDifficultyProgression(t *testing.T) {
	chapter1Diffs := make(map[int]int)
	for _, lvl := range Chapter1Girl {
		chapter1Diffs[lvl.Difficulty]++
	}

	if chapter1Diffs[1] == 0 {
		t.Error("Chapter1Girl should have at least one level with difficulty 1")
	}
}

func TestLevelGridDimensions(t *testing.T) {
	for chapter := 1; chapter <= 2; chapter++ {
		for _, gender := range []string{"girl", "boy"} {
			levels := GetChapterLevels(chapter, gender)
			for i, lvl := range levels {
				if len(lvl.Grid) == 0 {
					t.Errorf("Chapter %d (%s) level %d has empty grid", chapter, gender, i)
					continue
				}
				rows := len(lvl.Grid)
				if rows == 0 {
					t.Errorf("Chapter %d (%s) level %d has 0 rows", chapter, gender, i)
					continue
				}
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
	for chapter := 1; chapter <= 2; chapter++ {
		for _, gender := range []string{"girl", "boy"} {
			levels := GetChapterLevels(chapter, gender)
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
