package signalling

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Message struct {
	From string          `json:"from"`
	To   string          `json:"to"`
	Type string          `json:"type"` // offer, answer, candidates
	Data json.RawMessage `json:"data"`
}

type Client struct {
	ID   string
	Conn *websocket.Conn
	Send chan Message
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

const (
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
	writeWait  = 10 * time.Second
)

func ServerWS(c *gin.Context) {
	userID := c.Query("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userID is required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("Error upgrading connection", err)
		return
	}

	client := &Client{
		ID:   userID,
		Conn: conn,
		Send: make(chan Message, 256),
	}

	hub := GetHub()
	hub.register <- client

	go client.readPump()
	go client.writePump()
}

// read from client's browser
func (c *Client) readPump() {
	defer func() {
		GetHub().unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(65536) // 1MB; prevent large payloads
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		var msg Message
		if err := c.Conn.ReadJSON(&msg); err != nil {
			log.Println("Read error:", err)
			break
		}
		msg.From = c.ID
		GetHub().broadcast <- msg
	}
}

// write to client's browser
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case msg, ok := <- c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteJSON(msg); err != nil {
				log.Printf("Client %s write error: %v", c.ID, err)
				return
			}

		case <- ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("Client %s ping error: %v\n", c.ID, err)
				return
			}
		}
	}
}
