package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	ServerPort  string
	MongoURI    string
	JWTSecret   string
	MongoDBName string
}

func LoadConfig() Config {
	viper.SetConfigFile(".env")
	if err := viper.ReadInConfig(); err != nil {
		panic("Error reading .env file")
	}

	return Config{
		ServerPort:  viper.GetString("SERVER_PORT"),
		MongoURI:    viper.GetString("MONGO_URI"),
		JWTSecret:   viper.GetString("JWT_SECRET"),
		MongoDBName: viper.GetString("MONGO_DB"),
	}
}
