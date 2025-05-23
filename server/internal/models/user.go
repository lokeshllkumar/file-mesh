package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// user model
type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"` // MongoDB object ID
	Email     string             `bson:"email" json:"email"`
	Password  string             `bson:"password" json:"-"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}
