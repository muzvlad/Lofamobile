package achievements

import (
	"database/sql"
	"log"
	"time"
)

type EarnedAchievement struct {
	Type      string    `json:"type"`
	EarnedAt  time.Time `json:"earnedAt"`
	Progress  int       `json:"progress"`
	MaxProgress int    `json:"maxProgress"`
}

func GetEarned(db *sql.DB, userID int) ([]EarnedAchievement, error) {
	rows, err := db.Query(
		"SELECT achievement_type, earned_at FROM achievements WHERE user_id = ? ORDER BY earned_at DESC",
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	earned := make([]EarnedAchievement, 0)
	for rows.Next() {
		var e EarnedAchievement
		if err := rows.Scan(&e.Type, &e.EarnedAt); err != nil {
			continue
		}
		if a := GetByID(e.Type); a.ID != "" {
			e.MaxProgress = a.ProgressMax
			e.Progress = a.ProgressMax
		}
		earned = append(earned, e)
	}
	return earned, nil
}

func AddEarned(db *sql.DB, userID int, achievementType string) bool {
	var exists int
	err := db.QueryRow(
		"SELECT COUNT(*) FROM achievements WHERE user_id = ? AND achievement_type = ?",
		userID, achievementType,
	).Scan(&exists)
	if err == nil && exists > 0 {
		return false
	}

	_, err = db.Exec(
		"INSERT INTO achievements (user_id, achievement_type) VALUES (?, ?)",
		userID, achievementType,
	)
	if err != nil {
		log.Printf("[ACHIEVEMENTS] Add error: %v", err)
		return false
	}
	log.Printf("[ACHIEVEMENTS] Added: %s for user %d", achievementType, userID)
	return true
}

type AchievementStatus struct {
	ID          string `json:"id"`
	NameKey     string `json:"nameKey"`
	DescKey     string `json:"descKey"`
	Icon        string `json:"icon"`
	Earned      bool   `json:"earned"`
	EarnedAt    string `json:"earnedAt,omitempty"`
	Progress    int    `json:"progress"`
	ProgressMax int    `json:"progressMax"`
}

func GetAllWithProgress(db *sql.DB, userID int) []AchievementStatus {
	earned, err := GetEarned(db, userID)
	if err != nil {
		earned = []EarnedAchievement{}
	}

	earnedMap := make(map[string]EarnedAchievement)
	for _, e := range earned {
		earnedMap[e.Type] = e
	}

	progress := GetUserProgress(db, userID)

	result := make([]AchievementStatus, len(All))
	for i, a := range All {
		result[i] = AchievementStatus{
			ID:          a.ID,
			NameKey:     a.NameKey,
			DescKey:     a.DescKey,
			Icon:        a.Icon,
			ProgressMax: a.ProgressMax,
			Progress:    0,
		}

		if e, ok := earnedMap[a.ID]; ok {
			result[i].Earned = true
			result[i].EarnedAt = e.EarnedAt.Format("2006-01-02T15:04:05Z")
			result[i].Progress = e.Progress
		} else {
			result[i].Progress = calculateProgress(a.ID, progress)
		}
	}

	return result
}

type UserProgress struct {
	LevelsCompleted   int
	Chapters          map[int]int
	ChaptersCompleted int
	PerfectLevels     int
	NoMistakesStreak  int
	StreakDays        int
	CommandsUsed      int
	SpeedLevels       int
	JumpsUsed         int
	TurnsUsed         int
	CollectsUsed      int
}

func GetUserProgress(db *sql.DB, userID int) UserProgress {
	p := UserProgress{
		Chapters: make(map[int]int),
	}

	rows, err := db.Query("SELECT level_id, stars FROM progress WHERE user_id = ?", userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var levelID, stars int
			if rows.Scan(&levelID, &stars) == nil {
				p.LevelsCompleted++
				if stars == 3 {
					p.PerfectLevels++
				}
				chapter := (levelID - 1) / 10
				p.Chapters[chapter]++
				if p.Chapters[chapter] >= 10 {
					p.ChaptersCompleted++
				}
			}
		}
	}

	return p
}

func calculateProgress(achievementID string, progress UserProgress) int {
	switch achievementID {
	case "first_login":
		return 0
	case "first_level":
		if progress.LevelsCompleted >= 1 {
			return 1
		}
		return 0
	case "levels_5":
		return min(progress.LevelsCompleted, 5)
	case "levels_10":
		return min(progress.LevelsCompleted, 10)
	case "levels_15":
		return min(progress.LevelsCompleted, 15)
	case "levels_25":
		return min(progress.LevelsCompleted, 25)
	case "chapter_1":
		return progress.Chapters[0]
	case "chapter_2":
		return progress.Chapters[1]
	case "chapter_3":
		return progress.Chapters[2]
	case "chapter_4":
		return progress.Chapters[3]
	case "chapter_5":
		return progress.Chapters[4]
	case "perfect_1":
		return progress.PerfectLevels
	case "perfect_5":
		return min(progress.PerfectLevels, 5)
	case "perfect_10":
		return min(progress.PerfectLevels, 10)
	case "no_mistakes_5":
		return progress.NoMistakesStreak
	case "no_mistakes_10":
		return min(progress.NoMistakesStreak, 10)
	case "streak_3":
		return progress.StreakDays
	case "streak_5":
		return min(progress.StreakDays, 5)
	case "streak_10":
		return min(progress.StreakDays, 10)
	case "commands_20":
		return min(progress.CommandsUsed, 20)
	case "commands_50":
		return min(progress.CommandsUsed, 50)
	case "commands_100":
		return min(progress.CommandsUsed, 100)
	case "speed_5":
		return progress.SpeedLevels
	case "speed_10":
		return min(progress.SpeedLevels, 10)
	case "jump_10":
		return min(progress.JumpsUsed, 10)
	case "turn_10":
		return min(progress.TurnsUsed, 10)
	case "collect_10":
		return min(progress.CollectsUsed, 10)
	case "all_chapters":
		return progress.ChaptersCompleted
	}
	return 0
}

func CheckAndAward(db *sql.DB, userID int, trigger string, value int) []string {
	awarded := []string{}

	progress := GetUserProgress(db, userID)

	for _, a := range All {
		if a.TriggerType != trigger {
			continue
		}

		current := calculateProgress(a.ID, progress)
		if trigger == "level_complete" || trigger == "perfect_run" {
			if current > 0 && AddEarned(db, userID, a.ID) {
				awarded = append(awarded, a.ID)
			}
			continue
		}

		if current >= a.ProgressMax {
			if AddEarned(db, userID, a.ID) {
				awarded = append(awarded, a.ID)
			}
		}
	}

	return awarded
}