"use client"

import { createContext, useContext, useState, useEffect, use } from "react"
import { login, signup, getUser } from "../services/authService"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (token) {
            fetchUserData(token)
        } else {
            setLoading(false)
        }
    }, [])

    const fetchUserData = async (token) => {
        try {
            const userData = await getUser(token)
            setCurrentUser(userData)
            setIsAuthenticated(true)
        } catch (err) {
            console.error("Failed to fetch user data:", err)
            localStorage.removeItem("token")
        } finally {
            setLoading(false)
        }
    }

    const loginUser = async (email, password) => {
        setError(null)
        try {
            const { token } = await login(email, password)
            localStorage.setItem("token", token)
            await fetchUserData(token)
            return true
        } catch (err) {
            setError(err.message || "Failed to login")
            return false
        }
    }

    const signupUser = async (email, password) => {
        setError(null)
        try {
            await signup(email, password)
            return true
        } catch (err) {
            setError(err.message || "Failed to signup")
            return false
        }
    }
    
    const logoutUser = () => {
        localStorage.removeItem("token")
        setCurrentUser(null)
        setIsAuthenticated(false)
    }

    const value = {
        currentUser,
        isAuthenticated,
        loading,
        error,
        login: loginUser,
        signup: signupUser,
        logout: logoutUser,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
