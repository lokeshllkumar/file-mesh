package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Session struct {
	ID               primitive.ObjectID `bson:"_id,omitempty" json:"id"` // MongoDB object ID
	PeerA            primitive.ObjectID `bson:"peer_a" json:"peer_a"`    // first client
	PeerB            primitive.ObjectID `bson:"peer_b" json:"peer_b"`    // second client
	FileID           primitive.ObjectID `bson:"file_id,omitempty" json:"file_id,omitempty"`
	CreatedAt        time.Time          `bson:"created_at" json:"created_at"`               
	ConnectionStatus string             `bson:"connection_status" json:"connection_status"`

}
