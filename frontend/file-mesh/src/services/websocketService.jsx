export const setupWebSocket = (userId, onMessage, onOpen, onClose, onError) => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `ws://localhost:8080/ws?userId=${userId}`

    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
        console.log("WebSocket connection opened")
        if (onOpen) {
            onOpen()
        }
    }

    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data)
            if (onMessage) {
                onMessage(message)
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error)
        }
    }

    socket.onclose = () => {
        console.log("WebSocket connection closed")
        if (onClose) {
            onClose()
        }
    }

    socket.onerror = (error) => {
        console.log("WebSocket error:", error)
        if (onError) {
            onError(error)
        }
    }

    return {
        socket,
        handleMessage: onMessage,
    }
}