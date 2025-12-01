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
    ping: number
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

// Generar eventos mock basados en el score (temporal hasta tener datos reales)
function generateMockEvents(score: { home: number; away: number }, minute: number): MatchEvent[] {
    const events: MatchEvent[] = []
    const totalGoals = score.home + score.away

    // Distribuir goles a lo largo del partido
    for (let i = 0; i < totalGoals; i++) {
        const isHome = i < score.home
        const eventMinute = Math.floor((minute / totalGoals) * (i + 1))

        events.push({
            minute: eventMinute,
            type: 'goal',
            team: isHome ? 'home' : 'away',
            player: isHome ? 'Jugador Local' : 'Jugador Visitante',
            description: `Gol ${isHome ? 'local' : 'visitante'}`
        })
    }

    return events.sort((a, b) => a.minute - b.minute)
}

// Generar stats mock (temporal hasta tener datos reales)
function generateMockStats(score: { home: number; away: number }): MatchStats {
    const homeAdvantage = score.home > score.away ? 10 : score.home < score.away ? -10 : 0

    return {
        possession: {
            home: 50 + homeAdvantage,
            away: 50 - homeAdvantage
        },
        shots: {
            home: score.home * 3 + Math.floor(Math.random() * 3),
            away: score.away * 3 + Math.floor(Math.random() * 3)
        },
        fouls: {
            home: Math.floor(Math.random() * 10) + 5,
            away: Math.floor(Math.random() * 10) + 5
        },
        corners: {
            home: Math.floor(Math.random() * 8) + 2,
            away: Math.floor(Math.random() * 8) + 2
        },
        offsides: {
            home: Math.floor(Math.random() * 5),
            away: Math.floor(Math.random() * 5)
        }
    }
}

/**
 * Transforma datos de /api/stats a formato Match[]
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
                    events: generateMockEvents(score, minute),
                    stats: generateMockStats(score)
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
        ping: Math.floor(Math.random() * 80) + 20 // Mock ping, calcular real en el futuro
    }))
}
