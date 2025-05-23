import { useState, useRef } from "react"
import { usePeer } from "../contexts/PeerContext"
import { useAuth } from "../contexts/AuthContext"
import FileTransferStatus from "../components/FileTransferStatus"
import ConnectionStatus from "../components/ConnectionStatus"
import ReceivedFiles from "../components/ReceivedFiles"

const Dashboard = () => {
  const { currentUser } = useAuth()
  const {
    connectToPeerByEmail,
    disconnectPeer,
    sendFile,
    isConnected,
    connectedPeerEmail,
    connectionStatus,
    statusMessage,
    activeTransfers,
    isLookingUpUser,
    cancelFileTransfer,
  } = usePeer()

  const [peerEmail, setPeerEmail] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleConnectClick = () => {
    connectToPeerByEmail(peerEmail)
  }

  const handleDisconnectClick = () => {
    disconnectPeer()
  }

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSendClick = () => {
    if (selectedFile) {
      sendFile(selectedFile)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCancelTransfer = (transferId) => {
    console.log("Dashboard: Cancelling transfer:", transferId);
    if (typeof cancelFileTransfer === 'function') {
      cancelFileTransfer(transferId);
    } else {
      console.error("cancelFileTransfer is not a function", cancelFileTransfer);
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        <ConnectionStatus connectionStatus={connectionStatus} statusMessage={statusMessage} />

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Connection</h2>

          {!isConnected ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter Peer Email"
                value={peerEmail}
                onChange={(e) => setPeerEmail(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={connectionStatus !== "connected_to_server"}
              />
              <button
                onClick={handleConnectClick}
                disabled={!peerEmail || connectionStatus !== "connected_to_server" || isLookingUpUser}
                className={`px-4 py-2 rounded-md text-white ${
                  !peerEmail || connectionStatus !== "connected_to_server" || isLookingUpUser
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLookingUpUser ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Looking up...
                  </span>
                ) : (
                  "Connect"
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <p className="text-gray-700">
                  Connected to: <span className="font-medium">{connectedPeerEmail}</span>
                </p>
              </div>
              <button
                onClick={handleDisconnectClick}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {isConnected && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">File Transfer</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mr-2 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-blue-700">
                  Files are encrypted end-to-end for secure transfer. Only you and the recipient can access the file
                  contents.
                </p>
              </div>
            </div>

            <div
              className={`file-drop-area ${isDragging ? "active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input type="file" onChange={handleFileChange} className="hidden" ref={fileInputRef} />

              {selectedFile ? (
                <div className="text-center">
                  <p className="mb-2">
                    Selected file: <span className="font-medium">{selectedFile.name}</span>
                  </p>
                  <p className="text-sm text-gray-500 mb-4">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleSendClick}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      Send Encrypted File
                    </button>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    Drag and drop a file here, or{" "}
                    <button type="button" className="text-blue-600 hover:text-blue-500" onClick={handleBrowseClick}>
                      browse
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {Object.keys(activeTransfers).length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Active Transfers</h2>
          <FileTransferStatus 
            transfers={activeTransfers} 
            onCancelTransfer={handleCancelTransfer} 
          />
        </div>
      )}

      <ReceivedFiles />
    </div>
  )
}

export default Dashboard