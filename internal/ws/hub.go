package ws

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
)

var Upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true
		}
		parsed, err := url.Parse(origin)
		if err != nil {
			return false
		}
		return parsed.Host == r.Host
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
	clients      map[int]*Client
	register     chan *Client
	unregister   chan *Client
	broadcast    chan []byte
	database     *sql.DB
	quit         chan struct{}
	shutdownDone chan struct{}
}

type ScoreUpdateMessage struct {
	Type     string `json:"type"`
	UserID   int    `json:"userId"`
	Username string `json:"username"`
	Score    int    `json:"score"`
}

func NewHub(database *sql.DB) *Hub {
	return &Hub{
		clients:      make(map[int]*Client),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		broadcast:    make(chan []byte),
		database:     database,
		quit:         make(chan struct{}),
		shutdownDone: make(chan struct{}),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case <-h.quit:
			for _, client := range h.clients {
				close(client.send)
			}
			h.clients = make(map[int]*Client)
			close(h.shutdownDone)
			return

		case client := <-h.register:
			h.clients[client.userID] = client

		case client := <-h.unregister:
			if c, ok := h.clients[client.userID]; ok {
				delete(h.clients, c.userID)
				close(c.send)
			}

		case message := <-h.broadcast:
			for userID, client := range h.clients {
				select {
				case client.send <- message:
				default:
					delete(h.clients, userID)
					close(client.send)
				}
			}
		}
	}
}

func (h *Hub) Shutdown() {
	log.Printf("[WS] Shutting down hub...")
	select {
	case <-h.quit:
	default:
		close(h.quit)
	}
	select {
	case <-h.shutdownDone:
	default:
		for _, client := range h.clients {
			close(client.send)
		}
		h.clients = make(map[int]*Client)
	}
	log.Printf("[WS] Hub shutdown complete")
}

func (h *Hub) BroadcastScoreUpdate(userID int, username string, newScore int) {
	msg := ScoreUpdateMessage{
		Type:     "score_update",
		UserID:   userID,
		Username: username,
		Score:    newScore,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("[WS] Marshal error: %v", err)
		return
	}
	h.broadcast <- data
}

func ServeWsFromConn(hub *Hub, conn *websocket.Conn, userID int, username string) {
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

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request, userID int, username string) {
	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WS] Upgrade error: %v", err)
		return
	}
	ServeWsFromConn(hub, conn, userID, username)
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
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		var msg map[string]string
		if err := json.Unmarshal(message, &msg); err == nil {
			if msg["type"] == "ping" {
				select {
				case c.send <- []byte(`{"type":"pong"}`):
				default:
				}
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
