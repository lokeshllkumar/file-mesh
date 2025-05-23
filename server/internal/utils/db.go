package utils

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var mongoClient *mongo.Client

func InitMongo() {
	uri := cfg.MongoURI
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB database: %v", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("Failed to ping MongoDB database: %v", err)
	}

	mongoClient = client
	log.Println("Connected to MongoDB database")
}

func GetMongoCollection(collectionName string) *mongo.Collection {
	dbName := cfg.MongoDBName
	if dbName == "" {
		dbName = "filemesh"
	}

	collection := mongoClient.Database(dbName).Collection(collectionName)

	log.Printf("Connected to collection %s in database %s", collection.Name(), dbName)

	return collection
}
