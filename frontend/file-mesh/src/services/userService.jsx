import { API_BASE_URL } from "./authService"

export const getUserByEmail = async (email) => {
    const token = localStorage.getItem("token")

    if (!token) {
        throw new Error("Authentication required")
    }

    const response = await fetch(`${API_BASE_URL}/user/email?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to fetch user by email")
    }

    return await response.json()
}