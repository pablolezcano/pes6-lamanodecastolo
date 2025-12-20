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
    }>
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
        status: lobby.matchesInProgress > 0 ? 'in-game' : 'waiting',
        players: lobby.playerCount,
        maxPlayers: 16, // Valor por defecto, ajustar según configuración real
        // ping no está disponible desde el backend
    }))
}
