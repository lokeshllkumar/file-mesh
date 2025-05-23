package signalling

import (
	"log"
	"sync"
)

type Hub struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan Message
	mu         sync.RWMutex
}

var hubInstance *Hub
var once sync.Once

func GetHub() *Hub {
	once.Do(func() {
		hubInstance = &Hub{
			clients:    make(map[string]*Client), // populated with client IDs
			register:   make(chan *Client),
			unregister: make(chan *Client),
			broadcast:  make(chan Message),
		}
		go hubInstance.run()
	})
	return hubInstance
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.ID] = client
			log.Printf("Client %s registered\n", client.ID)
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			delete(h.clients, client.ID)
			close(client.Send)
			h.mu.Unlock()
		case message := <-h.broadcast:
			h.mu.RLock()
			if peer, ok := h.clients[message.To]; ok {
				peer.Send <- message
			} else {
				log.Printf("Client %s not found for message to %s", message.From, message.To)
			}
			h.mu.RUnlock()
		}
	}
}
