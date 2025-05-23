# file-mesh - Backend

## Introduction

The backend service for *FileMesh* was built using Go, with a a web server powered by [Gin](https://github.com/gin-gonic/gin).

## Components

There are endpoints defined for user authentication(login and signup), retrieving file history, retrieving the currently authenticated user's details in the API, and a WebSocket-based signalling server for the peers to exchange SDP messages and ICE candidates.

## Getting Started

- Initialize the project environment and install all necessary dependencies

```bash
cd server

go mod tidy
```

- Set up your environment variables with a .env file

```bash
MONGO_URI=      # URI to the MongoDB cluster that your DB is hosted on
SERVER_PORT=    # port number for the backend server to run on
JWT_SECRET=     # your JWT secret for token generation
MONGO_DB=       # your MongoDB database's name
```

- Run the backend server that starts listening on the port numbered ```8080```

```bash
go run main.go
```





