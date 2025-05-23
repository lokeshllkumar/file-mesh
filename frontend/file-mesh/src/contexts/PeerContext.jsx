"use client"

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { getUserByEmail } from "../services/userService";
import { decryptFile, encryptFile, exportKey, generateEncryptionKey, importKey } from "../services/cryptoService";
import { useAuth } from "./AuthContext";
import { setupWebSocket } from "../services/websocketService"

const PeerContext = createContext()

export const usePeer = () => useContext(PeerContext)

export const PeerProvider = ({ children }) => {
    const { currentUser } = useAuth()
    const [connectionStatus, setConnectionStatus] = useState("disconnected")
    const [statusMessage, setStatusMessage] = useState("")
    const [connectedPeerId, setConnectedPeerId] = useState("")
    const [connectedPeerEmail, setConnectedPeerEmail] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [activeTransfers, setActiveTransfers] = useState({})
    const [receivedFiles, setReceivedFiles] = useState([])
    const [isLookingUpUser, setIsLookingUpUser] = useState(false)

    const socketRef = useRef(null)
    const peerConnectionRef = useRef(null)
    const dataChannelRef = useRef(null)
    const fileReaderRef = useRef(null)
    const receivedBuffersRef = useRef({})
    const encryptionKeysRef = useRef({})
    const cancelledTransfersRef = useRef(new Set())

    useEffect(() => {
        if (currentUser && currentUser.id) {
            connectToSignallingServer(currentUser.id)
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close()
            }
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close()
            }
        }
    }, [currentUser])

    const connectToSignallingServer = (userId) => {
        if (socketRef.current) {
            socketRef.current.close()
        }

        setStatusMessage("Connecting to signalling server...")
        setConnectionStatus("connecting")

        let retryCount = 0
        const maxRetries = 5

        const attemptConnection = () => {
            try {
                const { socket, handleMessage } = setupWebSocket(
                    userId,
                    handleSignallingMessage,
                    () => {
                        setStatusMessage("Connected to signalling server")
                        setConnectionStatus("connected_to_server")
                    },
                    () => {
                        setStatusMessage("Disconnected from signalling server")
                        setConnectionStatus("disconnected")
                        
                        if (retryCount < maxRetries) {
                            retryCount++
                            setTimeout(attemptConnection, 2000)
                        }
                    },
                    (error) => {
                        setStatusMessage(`WebSocket error: ${error.message}`)
                        setConnectionStatus("error")
                    },
                )

                socketRef.current = socket
            } catch (error) {
                console.error("Error connecting to signalling server:", error)
                if (retryCount < maxRetries) {
                    retryCount++
                    setTimeout(attemptConnection, 2000)
                }
            }
        }

        attemptConnection()
    }

    const handleSignallingMessage = (message) => {
        const { from, type, data } = message

        console.log("Received signalling message:", type, from)

        if (type === "offer") {
            handleOffer(from, data)
        } else if (type === "answer") {
            handleAnswer(data)
        } else if (type === "candidate") {
            handleCandidate(data)
        } else if (type === "encryption-key") {
            handleEncryptionKey(from, data)
        } else if (type === "cancel-transfer") {
            handleCancelTransfer(data.transferId)
        }
    }

    const handleEncryptionKey = (from, data) => {
        const { transferId, key } = data

        encryptionKeysRef.current[transferId] = key
        console.log(`Received encryption key for transfer: ${transferId}`)
    }

    const initPeerConnection = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
        }

        const configuration = {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
            ]
        }

        const peerConnection = new RTCPeerConnection(configuration)

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignallingMessage(connectedPeerId, "candidate", {
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                })
            }
        }

        peerConnection.onconnectionstatechange = () => {
            setStatusMessage(`WebRTC connection state: ${peerConnection.connectionState}`)
            if (peerConnection.connectionState === "connected") {
                setIsConnected(true)
                setConnectionStatus("connected_to_peer")
            } else if (["disconnected", "failed", "closed"].includes(peerConnection.connectionState)) {
                setIsConnected(false)
                setConnectionStatus("connected_to_server")
            }
        }

        peerConnection.ondatachannel = (event) => {
            setupDataChannel(event.channel)
        }

        peerConnectionRef.current = peerConnection
        return peerConnection
    }

    const setupDataChannel = (dataChannel) => {
        dataChannel.binaryType = "arraybuffer"

        dataChannel.onopen = () => {
            setStatusMessage(`Data channel opened: ${dataChannel.label}`)
            setIsConnected(true)
            setConnectionStatus("connected_to_peer")
        }

        dataChannel.onclose = () => {
            setStatusMessage("Data channel closed")
            setIsConnected(false)
        }
        
        dataChannel.onerror = (error) => {
            setStatusMessage(`Data channel error: ${error.message}`)
        }

        dataChannel.onmessage = (event) => {
            handleDataChannelMessage(event)
        }

        dataChannelRef.current = dataChannel
    }

    const createDataChannel = (peerConnection) => {
        const dataChannel = peerConnection.createDataChannel("file-transfer", {
            ordered: true,
        })

        setupDataChannel(dataChannel)
        return dataChannel
    }
        
    const connectToPeerByEmail = async (email) => {
        if (!email) {
            setStatusMessage("Please enter a peer email")
            return
        }

        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            setStatusMessage("Not connected to signalling server")
            return 
        }

        setStatusMessage(`Looking up user with email: ${email}...`)
        setIsLookingUpUser(true)

        try {
            // getting user ID with email
            const userData = await getUserByEmail(email)
            const peerId = userData.id

            if (!peerId) {
                setStatusMessage(`User with email ${email} not found`)
                setIsLookingUpUser(false)
                return
            }

            setConnectedPeerEmail(email)
            setIsLookingUpUser(false)

            await connectToPeer(peerId)
        } catch (error) {
            setStatusMessage(`Error looking up user: ${error.message}`)
            setIsLookingUpUser(false)
        }
    }
    
    const connectToPeer = async (peerId) => {
        if (!peerId) {
            setStatusMessage("Please enter a valid peer ID")
            return
        }

        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            setStatusMessage("Not connected to signalling server")
            return
        }

        setStatusMessage(`Connecting to peer: ${peerId}`)
        setConnectedPeerId(peerId)

        const peerConnection = initPeerConnection()
        createDataChannel(peerConnection)

        try {
            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)

            sendSignallingMessage(peerId, "offer", {
                type: offer.type,
                sdp: offer.sdp,
            })
        } catch (error) {
            setStatusMessage(`Error creating offer: ${error.message}`)
        }
    }

    const handleOffer = async (fromPeerId, offerData) => {
        setConnectedPeerId(fromPeerId)
        setStatusMessage(`Received offer from: ${fromPeerId}`)

        const peerConnection = initPeerConnection()

        try {
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription({
                    type: offerData.type,
                    sdp: offerData.sdp,
                }),
            )

            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)

            sendSignallingMessage(fromPeerId, "answer", {
                type: answer.type,
                sdp: answer.sdp,
            })
        } catch (error) {
            setStatusMessage(`Error handling offer: ${error.message}`)
        }
    }

    const handleAnswer = async (answerData) => {
        setStatusMessage("Received answer")

        if (!peerConnectionRef.current) {
            setStatusMessage("No peer connection")
            return
        }

        try {
            await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription({
                    type: answerData.type,
                    sdp: answerData.sdp,
                }),
            )
        } catch (error) {
            setStatusMessage(`Error handling answer: ${error.message}`)
        }
    }

    const handleCandidate = async (candidateData) => {
        if (!peerConnectionRef.current) {
            setStatusMessage("No peer connection")
            return
        }

        try {
            const candidate = new RTCIceCandidate({
                candidate: candidateData.candidate,
                sdpMid: candidateData.sdpMid,
                sdpMLineIndex: candidateData.sdpMLineIndex,
            })

            await peerConnectionRef.current.addIceCandidate(candidate)
        } catch (error) {
            setStatusMessage(`Error handling ICE candidate: ${error.message}`)
        }
    }

    const sendSignallingMessage = (to, type, data) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            setStatusMessage("Not connected to signalling server")
            return
        }

        const message = {
            to,
            type,
            data,
        }

        socketRef.current.send(JSON.stringify(message))
    }

    const cancelFileTransfer = (transferId) => {
        console.log(`Cancelling transfer: ${transferId}`)
        
        cancelledTransfersRef.current.add(transferId)
        
        setActiveTransfers((prev) => {
            if (prev[transferId]) {
                return {
                    ...prev,
                    [transferId]: {
                        ...prev[transferId],
                        status: "cancelled",
                        progress: 0,
                    },
                }
            }
            return prev
        })

        if (fileReaderRef.current) {
            try {
                fileReaderRef.current.abort()
            } catch (error) {
                console.error("Error aborting file reader:", error)
            }
        }

        delete receivedBuffersRef.current[transferId]
        delete encryptionKeysRef.current[transferId]

        if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
            dataChannelRef.current.send(
                JSON.stringify({
                    type: "cancel-transfer",
                    transferId,
                })
            )
        }

        sendSignallingMessage(connectedPeerId, "cancel-transfer", {
            transferId,
        })

        setStatusMessage(`Transfer cancelled: ${transferId}`)
    }

    const handleCancelTransfer = (transferId) => {
        console.log(`Handling cancel for transfer: ${transferId}`)
        
        cancelledTransfersRef.current.add(transferId)
        
        setActiveTransfers((prev) => {
            if (prev[transferId]) {
                return {
                    ...prev,
                    [transferId]: {
                        ...prev[transferId],
                        status: "cancelled",
                        progress: 0,
                    },
                }
            }
            return prev
        })

        delete receivedBuffersRef.current[transferId]
        delete encryptionKeysRef.current[transferId]

        setStatusMessage(`Transfer cancelled by peer: ${transferId}`)
    }

    const sendFile = async (file) => {
        if (!file) {
            setStatusMessage("No file selected")
            return
        }

        if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
            setStatusMessage("Data channel not open")
            return
        }

        setStatusMessage(`Preparing to send file: ${file.name}`)

        // generating a unique ID for the file transfer
        const transferId = `${Date.now()}-${file.name}`

        try {
            const encKey = await generateEncryptionKey()

            const exportedKey = await exportKey(encKey)

            sendSignallingMessage(connectedPeerId, "encryption-key", {
                transferId,
                key: exportedKey,
            })
            setStatusMessage(`Encrypting file: ${file.name}...`)
            const encryptedFile = await encryptFile(file, encKey)
            setStatusMessage(`File encrypted, sending: ${file.name}`)

            const metadata = {
                type: "file-metadata",
                transferId,
                name: file.name,
                size: encryptedFile.size,
                fileType: file.type,
                encrypted: true,
            }

            dataChannelRef.current.send(JSON.stringify(metadata))

            // updating active transfers
            setActiveTransfers((prev) => ({
                ...prev,
                [transferId]: {
                    id: transferId,
                    file: file,
                    progress: 0,
                    status: "sending",
                    startTime: Date.now(),
                },
            }))

            const chunkSize = 16384 // 16KB
            const fileReader = new FileReader()
            let offset = 0

            fileReaderRef.current = fileReader

            const readSlice = (o) => {
                // Check if transfer has been cancelled
                if (cancelledTransfersRef.current.has(transferId)) {
                    console.log(`Transfer ${transferId} was cancelled, stopping read`)
                    return
                }
                
                const slice = encryptedFile.slice(o, o + chunkSize)
                fileReader.readAsArrayBuffer(slice)
            }

            fileReader.onload = (e) => {
                if (cancelledTransfersRef.current.has(transferId)) {
                    console.log(`Transfer ${transferId} was cancelled, stopping send`)
                    return
                }
                
                if (dataChannelRef.current.readyState === "open") {
                    dataChannelRef.current.send(e.target.result)
                    offset += e.target.result.byteLength

                    // updating progress
                    const progress = Math.min(100, Math.floor((offset / encryptedFile.size) * 100))

                    // updating active transfers
                    setActiveTransfers((prev) => ({
                        ...prev,
                        [transferId]: {
                            ...prev[transferId],
                            progress,
                            status: progress < 100 ? "sending" : "sent"
                        },
                    }))

                    if (offset < encryptedFile.size) {
                        readSlice(offset)
                    } else {
                        // sending end of file marker for when the transfer is complete
                        dataChannelRef.current.send(
                            JSON.stringify({
                                type: "file-complete",
                                transferId,
                            }),
                        )

                        setStatusMessage(`File sent: ${file.name}`)
                        
                        cancelledTransfersRef.current.delete(transferId)
                    }
                }
            }
            
            fileReader.onerror = (error) => {
                if (error.target.error && error.target.error.name === 'AbortError') {
                    console.log(`File reading aborted for transfer: ${transferId}`)
                    return
                }
                
                setStatusMessage(`Error reading file: ${error.message || 'Unknown error'}`)
            }

            readSlice(0)
        } catch (error) {
            setStatusMessage(`Error sending file: ${error.message}`)
            console.error("File sending error:", error)
        }
    }

    const handleDataChannelMessage = async (event) => {
        const { data } = event

        if (typeof data === "string") {
            try {
                const message = JSON.parse(data)

                if (message.type === "file-metadata") {
                    const transferId = message.transferId
                    
                    receivedBuffersRef.current[transferId] = {
                        buffer: [],
                        size: 0,
                        totalSize: message.size,
                        name: message.name,
                        type: message.fileType,
                        progress: 0,
                        encrypted: message.encrypted,
                    }

                    setStatusMessage(`Receiving file: ${message.name}`)

                    setActiveTransfers((prev) => ({
                        ...prev,
                        [transferId]: {
                            id: transferId,
                            fileName: message.name,
                            fileSize: message.size,
                            progress: 0,
                            status: "receiving",
                            startTime: Date.now(),
                        },
                    }))
                } else if (message.type === "file-complete") {
                    const transferId = message.transferId
                    
                    // checking if transfer has been cancelled
                    if (cancelledTransfersRef.current.has(transferId)) {
                        console.log(`Transfer ${transferId} was cancelled, skipping completion`)
                        return
                    }
                    
                    const fileData = receivedBuffersRef.current[transferId]

                    if (fileData) {
                        try {
                            // aggregate the chunks into a blob
                            const fileBlob = new Blob(fileData.buffer, { type: fileData.type || "application/octet-stream" })

                            // create a file out of the blob
                            let receivedFile = new File([fileBlob], fileData.name, { type: fileData.type })

                            // decrypt file if encrypted
                            if (fileData.encrypted && encryptionKeysRef.current[transferId]) {
                                setStatusMessage(`Decrypting file: ${fileData.name}...`)

                                const encKey = await importKey(encryptionKeysRef.current[transferId])

                                receivedFile = await decryptFile(receivedFile, encKey)

                                setStatusMessage(`File decrypted: ${fileData.name}`)

                                delete encryptionKeysRef.current[transferId]
                            }

                            const fileUrl = URL.createObjectURL(new Blob([receivedFile], { type: fileData.type }))

                            setReceivedFiles((prev) => [
                                ...prev,
                                {
                                    id: transferId,
                                    name: fileData.name,
                                    size: receivedFile.size,
                                    type: fileData.type,
                                    url: fileUrl,
                                    timestamp: new Date().toISOString(),
                                },
                            ])

                            setActiveTransfers((prev) => ({
                                ...prev,
                                [transferId]: {
                                    ...prev[transferId],
                                    progress: 100,
                                    status: "received",
                                },
                            }))

                            setStatusMessage(`File received: ${fileData.name}`)

                            delete receivedBuffersRef.current[transferId]
                            cancelledTransfersRef.current.delete(transferId)
                        } catch (error) {
                            setStatusMessage(`Error processing received file: ${error.message}`)
                            console.error("File processing error:", error)
                        }
                    }
                } else if (message.type === "cancel-transfer") {
                    // Handle cancellation message from data channel
                    handleCancelTransfer(message.transferId)
                }
            } catch (error) {
                console.error("Error parsing message:", error)
            }
        } else if (data instanceof ArrayBuffer) {
            // finding active transfer
            const transferId = Object.keys(receivedBuffersRef.current).find(
                (id) => receivedBuffersRef.current[id].status !== "complete",
            )

            if (transferId && cancelledTransfersRef.current.has(transferId)) {
                console.log(`Transfer ${transferId} was cancelled, ignoring chunk`)
                return
            }

            if (transferId && receivedBuffersRef.current[transferId]) {
                const fileData = receivedBuffersRef.current[transferId]

                // adding chunk to buffer
                fileData.buffer.push(data)
                fileData.size += data.byteLength

                const progress = Math.min(100, Math.floor((fileData.size / fileData.totalSize) * 100))
                fileData.progress = progress

                // update active transfers
                setActiveTransfers((prev) => ({
                    ...prev,
                    [transferId]: {
                        ...prev[transferId],
                        progress,
                    },
                }))
            }
        }
    }

    const disconnectPeer = () => {
        if (dataChannelRef.current) {
            dataChannelRef.current.close()
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
        }

        setIsConnected(false)
        setConnectionStatus("connected_to_server")
        setConnectedPeerId("")
        setConnectedPeerEmail("")
        setStatusMessage("Disconnected from peer")
    }

    const value = {
        connectionStatus,
        statusMessage,
        connectedPeerId,
        connectedPeerEmail,
        isConnected,
        activeTransfers,
        receivedFiles,
        isLookingUpUser,
        connectToPeer,
        connectToPeerByEmail,
        disconnectPeer,
        sendFile,
        setReceivedFiles,
        cancelFileTransfer,
    }

    return <PeerContext.Provider value={value}>{children}</PeerContext.Provider>
}