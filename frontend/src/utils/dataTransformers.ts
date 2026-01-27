// Transformadores de datos para convertir /api/stats a formato Vestuario

interface StatsResponse {
    playerCount: number
    lobbies: Array<{
        name: string
        playerCount: number
        matchesInProgress: number
        users?: Array<{
            profile: string
            ip?: string
        }>
        matches?: Array<{
            roomName: string
            score: string
            homeProfile?: string
            awayProfile?: string
            homeTeam?: string[]
            awayTeam?: string[]
            clock?: string
            state?: string
            matchTime?: string
        }>
        rooms?: Array<{
            id: number
            name: string
            isPrivate: boolean
            phase: number
            status: string
            players: string[]
            owner: string | null
        }>
    }>
}

export interface WaitingRoom {
    id: string
    name: string
    lobbyName: string
    players: string[]
    maxPlayers: number
    isPrivate: boolean
    status: string
    owner: string | null
}

export interface Match {
    id: string
    homeTeam: string
    awayTeam: string
    homePlayer: string
    awayPlayer: string
    score: { home: number; away: number }
    minute: number
    roomName: string
    lobbyName: string
    events: MatchEvent[]
    stats: MatchStats
}

export interface MatchEvent {
    minute: number
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution'
    team: 'home' | 'away'
    player: string
    description: string
}

export interface MatchStats {
    possession: { home: number; away: number }
    shots: { home: number; away: number }
    fouls: { home: number; away: number }
    corners: { home: number; away: number }
    offsides: { home: number; away: number }
}

export interface Lobby {
    id: string
    name: string
    region: 'AR' | 'BR' | 'CL' | 'General'
    status: 'waiting' | 'in-game'
    players: number
    maxPlayers: number
    ping?: number
}

// Función para parsear el score "2-1" a {home: 2, away: 1}
function parseScore(scoreStr: string): { home: number; away: number } {
    const parts = scoreStr.split('-')
    return {
        home: parseInt(parts[0]) || 0,
        away: parseInt(parts[1]) || 0
    }
}

// Función para parsear el clock (puede ser número o string "45'")
function parseMinute(clock?: string | number): number {
    if (typeof clock === 'number') return clock
    if (!clock) return 0
    const match = String(clock).match(/(\d+)/)
    return match ? parseInt(match[1]) : 0
}

// Detectar región basada en el nombre del lobby
function detectRegion(lobbyName: string): 'AR' | 'BR' | 'CL' | 'General' {
    const name = lobbyName.toLowerCase()
    if (name.includes('argentina') || name.includes('arg')) return 'AR'
    if (name.includes('brasil') || name.includes('bra')) return 'BR'
    if (name.includes('chile') || name.includes('chi')) return 'CL'
    return 'General'
}

/**
 * Transforma datos de /api/stats a formato WaitingRoom[]
 */
export function transformStatsToWaitingRooms(stats: StatsResponse): WaitingRoom[] {
    const rooms: WaitingRoom[] = []

    stats.lobbies.forEach(lobby => {
        if (lobby.rooms && lobby.rooms.length > 0) {
            lobby.rooms.forEach(room => {
                rooms.push({
                    id: `${lobby.name}-${room.id}`,
                    name: room.name,
                    lobbyName: lobby.name, // "Russia", "England", etc.
                    players: room.players,
                    maxPlayers: 2, // Generalmente 1v1, ajustar si es 2v2
                    isPrivate: room.isPrivate,
                    status: room.status,
                    owner: room.owner
                })
            })
        }
    })

    return rooms
}

/**
 * Transforma datos de /api/stats a formato Match[]
 * Nota: events y stats están vacíos porque el backend no provee estos datos actualmente
 */
export function transformStatsToMatches(stats: StatsResponse): Match[] {
    const matches: Match[] = []

    stats.lobbies.forEach(lobby => {
        if (lobby.matches && lobby.matches.length > 0) {
            lobby.matches.forEach((match, index) => {
                const score = parseScore(match.score || '0-0')
                const minute = parseMinute(match.clock)

                // Extraer nombres de equipos y jugadores
                // homeTeam y awayTeam son arrays de nombres de jugadores
                const homePlayerName = match.homeTeam?.[0] || match.homeProfile || 'Jugador 1'
                const awayPlayerName = match.awayTeam?.[0] || match.awayProfile || 'Jugador 2'

                // Para equipos, podríamos usar homeTeamId/awayTeamId en el futuro
                // Por ahora usamos el nombre del jugador como equipo
                const homeTeamName = match.homeProfile || homePlayerName
                const awayTeamName = match.awayProfile || awayPlayerName

                matches.push({
                    id: `${lobby.name}-${index}`,
                    homeTeam: homeTeamName,
                    awayTeam: awayTeamName,
                    homePlayer: homePlayerName,
                    awayPlayer: awayPlayerName,
                    score,
                    minute,
                    roomName: match.roomName,
                    lobbyName: lobby.name,
                    // Backend no provee eventos ni estadísticas detalladas aún
                    events: [],
                    stats: {
                        possession: { home: 0, away: 0 },
                        shots: { home: 0, away: 0 },
                        fouls: { home: 0, away: 0 },
                        corners: { home: 0, away: 0 },
                        offsides: { home: 0, away: 0 }
                    }
                })
            })
        }
    })

    return matches
}

/**
 * Transforma datos de /api/stats a formato Lobby[]
 */
export function transformStatsToLobbies(stats: StatsResponse): Lobby[] {
    return stats.lobbies.map((lobby, index) => ({
        id: `lobby-${index}`,
        name: lobby.name,
        region: detectRegion(lobby.name),
        // Si hay rooms creadas o partidos, está "activo"
        status: (lobby.playerCount > 0) ? 'in-game' : 'waiting',
        players: lobby.playerCount,
        maxPlayers: 100, // Ajustamos a algo más realista para el lobby general
        // ping no está disponible desde el backend
    }))
}
