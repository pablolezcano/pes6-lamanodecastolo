import { useEffect, useRef, useState, useCallback } from 'react'

interface WebSocketMessage {
    type: 'match_update' | 'lobby_update' | 'stats_update'
    data: any
}

interface UseWebSocketOptions {
    url: string
    onMessage?: (message: WebSocketMessage) => void
    onConnect?: () => void
    onDisconnect?: () => void
    reconnectInterval?: number
    maxReconnectAttempts?: number
}

export function useWebSocket({
    url,
    onMessage,
    onConnect,
    onDisconnect,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10
}: UseWebSocketOptions) {
    const [isConnected, setIsConnected] = useState(false)
    const [reconnectAttempts, setReconnectAttempts] = useState(0)
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const connect = useCallback(() => {
        try {
            // Convertir http/https a ws/wss
            const wsUrl = url.replace(/^http/, 'ws')
            const ws = new WebSocket(wsUrl)

            ws.onopen = () => {
                console.log('WebSocket connected')
                setIsConnected(true)
                setReconnectAttempts(0)
                onConnect?.()
            }

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data)
                    onMessage?.(message)
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error)
                }
            }

            ws.onerror = (error) => {
                console.error('WebSocket error:', error)
            }

            ws.onclose = () => {
                console.log('WebSocket disconnected')
                setIsConnected(false)
                onDisconnect?.()

                // Intentar reconectar
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log(`Reconnecting... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
                        setReconnectAttempts(prev => prev + 1)
                        connect()
                    }, reconnectInterval)
                } else {
                    console.log('Max reconnect attempts reached')
                }
            }

            wsRef.current = ws
        } catch (error) {
            console.error('Error creating WebSocket:', error)
        }
    }, [url, onMessage, onConnect, onDisconnect, reconnectAttempts, maxReconnectAttempts, reconnectInterval])

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
        }
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
    }, [])

    const send = useCallback((data: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data))
        } else {
            console.warn('WebSocket is not connected')
        }
    }, [])

    useEffect(() => {
        connect()

        return () => {
            disconnect()
        }
    }, [connect, disconnect])

    return {
        isConnected,
        send,
        disconnect,
        reconnect: connect
    }
}
