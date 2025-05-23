package models

import (
	"time"
)

// file metadata model
type FileMetadata struct {
	ID        string    `json:"id" bson:"_id,omitempty"`
	UserID    string    `json:"userId" bson:"userId"`
	Name      string    `json:"name" bson:"name"`
	Size      int64     `json:"size" bson:"size"`
	Type      string    `json:"type" bson:"type"`
	URL       string    `json:"url,omitempty" bson:"url,omitempty"` // Optional download link
	Direction string    `json:"direction" bson:"direction"`         // "sent" or "received"
	CreatedAt time.Time `json:"createdAt" bson:"createdAt"`
}
