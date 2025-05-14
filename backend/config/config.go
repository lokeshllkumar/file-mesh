package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	ServerPort string
	MonogURI string
	JWTSecret string
}

func LoadConfig() Config {
	viper.SetConfigFile(".env")
	viper.ReadInConfig()

	return Config {
		ServerPort: viper.GetString("SERVER_PORT"),
		MonogURI: viper.GetString("MONGO_URI"),
		JWTSecret: viper.GetString("JWT_SECRET"),
	}
}