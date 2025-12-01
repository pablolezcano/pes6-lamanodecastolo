import { createContext, useContext, useState, type ReactNode, useEffect } from 'react'
import axios from 'axios'

interface UserData {
    username: string
    serial: string
    profiles: any[]
    stats?: any
}

interface AuthContextType {
    // Admin auth
    isAuthenticated: boolean
    login: (username: string, password: string) => Promise<boolean>

    // User auth
    isUserAuthenticated: boolean
    user: UserData | null
    userCountry: string | null
    loginUser: (username: string, password: string) => Promise<boolean>
    isLoading: boolean

    logout: () => void
    token: string | null
    userToken: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    // Admin state
    const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'))

    // User state
    const [userToken, setUserToken] = useState<string | null>(localStorage.getItem('user_token'))
    const [user, setUser] = useState<UserData | null>(null)
    const [userCountry, setUserCountry] = useState<string | null>(localStorage.getItem('user_country'))
    const [isLoading, setIsLoading] = useState<boolean>(!!localStorage.getItem('user_token'))

    // Restore user session on load
    useEffect(() => {
        if (userToken) {
            setIsLoading(true)
            // Fetch user data again to ensure validity
            axios.get('/api/my-account', {
                headers: { 'Authorization': userToken }
            }).then(res => {
                setUser(res.data)
                setIsLoading(false)
            }).catch(() => {
                // If fails, logout user
                logoutUser()
                setIsLoading(false)
            })
        } else {
            setIsLoading(false)
        }
    }, [userToken])

    const login = async (username: string, password: string) => {
        const credentials = btoa(`${username}:${password}`)
        const basicAuth = `Basic ${credentials}`

        try {
            await axios.get('/api/admin/home', {
                headers: {
                    'Authorization': basicAuth,
                    'Accept': 'application/json'
                }
            })

            localStorage.setItem('auth_token', basicAuth)
            setToken(basicAuth)
            return true
        } catch (error) {
            console.error('Admin login failed:', error)
            return false
        }
    }

    const loginUser = async (username: string, password: string) => {
        const credentials = btoa(`${username}:${password}`)
        const basicAuth = `Basic ${credentials}`

        try {
            // 1. Authenticate with backend
            const response = await axios.get('/api/my-account', {
                headers: {
                    'Authorization': basicAuth,
                    'Accept': 'application/json'
                }
            })

            // 2. Save session
            localStorage.setItem('user_token', basicAuth)
            setUserToken(basicAuth)
            setUser(response.data)

            // 3. Get Country (fire and forget)
            fetchCountry()

            return true
        } catch (error) {
            console.error('User login failed:', error)
            return false
        }
    }

    const fetchCountry = async () => {
        try {
            const res = await axios.get('https://ipapi.co/json/')
            if (res.data && res.data.country_code) {
                const code = res.data.country_code
                setUserCountry(code)
                localStorage.setItem('user_country', code)
            }
        } catch (e) {
            console.warn('Failed to fetch country:', e)
        }
    }

    const logoutUser = () => {
        localStorage.removeItem('user_token')
        localStorage.removeItem('user_country')
        setUserToken(null)
        setUser(null)
        setUserCountry(null)
    }

    const logout = () => {
        // Logout both
        localStorage.removeItem('auth_token')
        setToken(null)
        logoutUser()
    }

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!token,
            login,
            logout,
            token,
            isUserAuthenticated: !!userToken,
            user,
            userCountry,
            loginUser,
            userToken,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
