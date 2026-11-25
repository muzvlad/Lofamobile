package scoring

import (
	"codequest/internal/levels"
	"codequest/internal/types"
	"database/sql"
	"errors"
	"log"
)

type LevelResult struct {
	Success  bool
	Par      int
	Stars    int
	Moves    int
	Improved bool
}

func CompleteLevel(database *sql.DB, userID, levelID int, req types.CompleteRequest, gender string) LevelResult {
	level, err := levels.GetLevelByIDWithGender(levelID, gender)
	if err != nil {
		log.Printf("[COMPLETE] Level %d not found: %v", levelID, err)
		return LevelResult{Success: false, Par: 0, Stars: 0, Improved: false}
	}

	goals := level.Goals
	if len(goals) == 0 {
		goals = []types.Goal{{Type: "reach_finish"}}
	}

	success := validateGoals(goals, level.Grid, req, len(level.Items))

	var stars int
	var improved bool

	if success {
		stars = 1

		var oldStars int
		firstAttempt := false
		err := database.QueryRow(
			"SELECT stars FROM progress WHERE user_id = ? AND level_id = ? AND gender = ?",
			userID, levelID, gender,
		).Scan(&oldStars)
		if errors.Is(err, sql.ErrNoRows) {
			firstAttempt = true
		}

		if req.Moves <= level.Optimal {
			stars++
		}
		if firstAttempt {
			stars++
		}

		_, err = database.Exec(
			`INSERT INTO progress (user_id, level_id, stars, moves, code, attempts, gender) 
			 VALUES (?, ?, ?, ?, ?, 1, ?)
			 ON CONFLICT(user_id, level_id, gender) DO UPDATE SET
			   stars = MAX(progress.stars, ?),
			   moves = CASE WHEN ? > progress.stars THEN ? WHEN ? = progress.stars AND ? < progress.moves THEN ? ELSE progress.moves END,
			   code = ?,
			   attempts = progress.attempts + 1,
			   completed_at = CURRENT_TIMESTAMP`,
			userID, levelID, stars, req.Moves, req.Code, gender,
			stars, stars, req.Moves, stars, req.Moves, req.Moves, req.Code,
		)
		if err != nil {
			log.Printf("[DB] UPSERT ERROR: %v", err)
			return LevelResult{Success: false, Par: level.Par, Stars: 0, Improved: false}
		}

		improved = stars > oldStars
	} else {
		stars = 0
		improved = false
	}

	return LevelResult{
		Success:  success,
		Par:      level.Par,
		Stars:    stars,
		Moves:    req.Moves,
		Improved: improved,
	}
}

func validateGoals(goals []types.Goal, grid [][]int, req types.CompleteRequest, totalItems int) bool {
	for _, g := range goals {
		if !checkGoal(g, grid, req, totalItems) {
			return false
		}
	}
	return true
}

func checkGoal(g types.Goal, grid [][]int, req types.CompleteRequest, totalItems int) bool {
	switch g.Type {
	case "reach_finish":
		return req.PlayerY >= 0 && req.PlayerY < len(grid) &&
			req.PlayerX >= 0 && req.PlayerX < len(grid[req.PlayerY]) &&
			grid[req.PlayerY][req.PlayerX] == 3
	case "collect_all":
		return req.ItemsCollected >= totalItems
	case "deliver_to_warehouse":
		return req.ItemsOnWarehouse >= g.Count
	default:
		log.Printf("[COMPLETE] Unknown goal type: %s", g.Type)
		return false
	}
}
