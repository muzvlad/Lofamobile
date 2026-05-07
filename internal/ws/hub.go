package ws

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	userID   int
	username string
}

type Hub struct {
	clients    map[int]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	database   *sql.DB
}

type ScoreUpdateMessage struct {
	Type     string `json:"type"`
	UserID   int    `json:"userId"`
	Username string `json:"username"`
	Score    int    `json:"score"`
}

type AchievementMessage struct {
	Type    string `json:"type"`
	UserID  int    `json:"userId"`
	Details string `json:"details"`
}

func NewHub(database *sql.DB) *Hub {
	return &Hub{
		clients:    make(map[int]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte),
		database:   database,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client.userID] = client

		case client := <-h.unregister:
			if c, ok := h.clients[client.userID]; ok {
				delete(h.clients, c.userID)
				close(c.send)
			}

		case message := <-h.broadcast:
			for _, client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client.userID)
				}
			}
		}
	}
}

func (h *Hub) Shutdown() {
	log.Printf("[WS] Shutting down hub...")
	for _, client := range h.clients {
		close(client.send)
	}
	h.clients = make(map[int]*Client)
	log.Printf("[WS] Hub shutdown complete")
}

func (h *Hub) BroadcastScoreUpdate(userID int, newScore int) {
	var username string
	err := h.database.QueryRow("SELECT nickname FROM users WHERE id = ?", userID).Scan(&username)
	if err != nil {
		username = "Unknown"
	}

	msg := ScoreUpdateMessage{
		Type:     "score_update",
		UserID:   userID,
		Username: username,
		Score:    newScore,
	}
	data, _ := json.Marshal(msg)
	h.broadcast <- data
}

func (h *Hub) BroadcastAchievement(userID int, achievementType string) {
	msg := AchievementMessage{
		Type:    "new_achievement",
		UserID:  userID,
		Details: achievementType,
	}
	data, _ := json.Marshal(msg)
	h.broadcast <- data
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request, userID int, username string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WS] Upgrade error: %v", err)
		return
	}

	client := &Client{
		hub:      hub,
		conn:     conn,
		send:     make(chan []byte, 256),
		userID:   userID,
		username: username,
	}

	hub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WS] Client %d disconnected: %v", c.userID, err)
			}
			break
		}

		var msg map[string]string
		if err := json.Unmarshal(message, &msg); err == nil {
			if msg["type"] == "ping" {
				c.send <- []byte(`{"type":"pong"}`)
			}
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
