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

- Run the backend server that starts listening on the port numbered ```8080```

```bash
go run main.go
```





