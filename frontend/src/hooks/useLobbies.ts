import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { transformStatsToLobbies, transformStatsToWaitingRooms, type Lobby, type WaitingRoom } from '../utils/dataTransformers'
import { useWebSocket } from './useWebSocket'

interface UseLobbiesReturn {
    lobbies: Lobby[]
    waitingRooms: WaitingRoom[]
    loading: boolean
    error: string | null
    refetch: () => void
    isConnected: boolean
}

export function useLobbies(): UseLobbiesReturn {
    const [lobbies, setLobbies] = useState<Lobby[]>([])
    const [waitingRooms, setWaitingRooms] = useState<WaitingRoom[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLobbies = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get('/api/stats', {
                headers: { 'Accept': 'application/json' }
            })
            const transformedLobbies = transformStatsToLobbies(response.data)
            const transformedRooms = transformStatsToWaitingRooms(response.data)
            setLobbies(transformedLobbies)
            setWaitingRooms(transformedRooms)
        } catch (err) {
            console.error('Error fetching lobbies:', err)
            setError('Error al cargar los lobbies')
        } finally {
            setLoading(false)
        }
    }, [])

    // WebSocket para actualizaciones en tiempo real
    const { isConnected } = useWebSocket({
        url: `${window.location.protocol}//${window.location.host}/api/ws/stats`,
        onMessage: (message) => {
            if (message.type === 'stats_update' && message.data) {
                const transformedLobbies = transformStatsToLobbies(message.data)
                const transformedRooms = transformStatsToWaitingRooms(message.data)
                setLobbies(transformedLobbies)
                setWaitingRooms(transformedRooms)
            }
        },
        onConnect: () => {
            console.log('WebSocket connected for lobbies')
        },
        onDisconnect: () => {
            console.log('WebSocket disconnected for lobbies')
        }
    })

    // Fetch inicial
    useEffect(() => {
        fetchLobbies()
    }, [fetchLobbies])

    // Polling de respaldo si WebSocket no está disponible
    useEffect(() => {
        if (!isConnected) {
            const interval = setInterval(fetchLobbies, 5000)
            return () => clearInterval(interval)
        }
    }, [isConnected, fetchLobbies])

    return {
        lobbies,
        waitingRooms,
        loading,
        error,
        refetch: fetchLobbies,
        isConnected
    }
}
