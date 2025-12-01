import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { transformStatsToMatches, type Match } from '../utils/dataTransformers'
import { useWebSocket } from './useWebSocket'

interface UseMatchesReturn {
    matches: Match[]
    loading: boolean
    error: string | null
    refetch: () => void
    isConnected: boolean
}

export function useMatches(): UseMatchesReturn {
    const [matches, setMatches] = useState<Match[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchMatches = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get('/api/stats', {
                headers: { 'Accept': 'application/json' }
            })
            const transformedMatches = transformStatsToMatches(response.data)
            setMatches(transformedMatches)
        } catch (err) {
            console.error('Error fetching matches:', err)
            setError('Error al cargar los partidos')
        } finally {
            setLoading(false)
        }
    }, [])

    // WebSocket para actualizaciones en tiempo real
    const { isConnected } = useWebSocket({
        url: `${window.location.protocol}//${window.location.host}/api/ws/stats`,
        onMessage: (message) => {
            if (message.type === 'stats_update' && message.data) {
                const transformedMatches = transformStatsToMatches(message.data)
                setMatches(transformedMatches)
            }
        },
        onConnect: () => {
            console.log('WebSocket connected for matches')
        },
        onDisconnect: () => {
            console.log('WebSocket disconnected for matches')
        }
    })

    // Fetch inicial
    useEffect(() => {
        fetchMatches()
    }, [fetchMatches])

    // Polling de respaldo si WebSocket no está disponible
    useEffect(() => {
        if (!isConnected) {
            const interval = setInterval(fetchMatches, 5000)
            return () => clearInterval(interval)
        }
    }, [isConnected, fetchMatches])

    return {
        matches,
        loading,
        error,
        refetch: fetchMatches,
        isConnected
    }
}
