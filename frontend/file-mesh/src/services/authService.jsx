export const API_BASE_URL = "http://localhost:8080/api"

const handleResponse = async (response) => {
    const data = await response.json()

    if (!response.ok) {
        const error = (data && data.error) || response.statusText
        throw new Error(error)
    }

    return data
}

export const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    })

    return handleResponse(response)
}

export const signup = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    })

    return handleResponse(response)
}

export const getUser = async (token) => {
    const response = await fetch(`${API_BASE_URL}/user`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    return handleResponse(response)
}

export const getFileHistory = async (userId) => {
    const token = localStorage.getItem("token")

    if (!token) {
        throw new Error("No token found")
    }

    const response = await fetch(`${API_BASE_URL}/file-history?userId=${userId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        }
    })

    return handleResponse(response)
}