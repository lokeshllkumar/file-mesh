const ConnectionStatus = ({ connectionStatus, statusMessage }) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected_to_peer":
        return "bg-green-500"
      case "connected_to_server":
        return "bg-yellow-500"
      case "connecting":
        return "bg-blue-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected_to_peer":
        return "Connected to peer"
      case "connected_to_server":
        return "Connected to server"
      case "connecting":
        return "Connecting..."
      case "error":
        return "Connection error"
      default:
        return "Disconnected"
    }
  }

  return (
    <div className="flex items-center p-3 bg-gray-100 rounded-md">
      <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2`}></div>
      <div>
        <div className="font-medium">{getStatusText()}</div>
        <div className="text-sm text-gray-600">{statusMessage}</div>
      </div>
    </div>
  )
}

export default ConnectionStatus
