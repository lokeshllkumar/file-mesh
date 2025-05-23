export const generateEncryptionKey = async () => {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"],
    )
}

export const exportKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey("raw", key)
    return arrayBufferToBase64(exported)
}

export const importKey = async (keyData) => {
    const keyBuffer = base64ToArrayBuffer(keyData)
    return await window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"],
    )
}

export const encryptFile = async (file, key) => {
    // initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    const fileBuffer = await readFileAsArrayBuffer(file)

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv,
        },
        key,
        fileBuffer,
    )

    // IV + encrypted data
    const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combinedBuffer.set(iv, 0)
    combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length)

    return new File([combinedBuffer], file.name, { type: file.type })
}

export const decryptFile = async (encryptedFile, key) => {
    const encryptedBuffer = await readFileAsArrayBuffer(encryptedFile)

    // extracting IV and encrypted data
    const iv = encryptedBuffer.slice(0, 12)
    const data = encryptedBuffer.slice(12)

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(iv),
        },
        key,
        data,
    )

    return new File([decryptedBuffer], encryptedFile.name, { type: encryptedFile.type })
}

const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(e.target.error)
        reader.readAsArrayBuffer(file)
    })
}

const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
}

const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
}