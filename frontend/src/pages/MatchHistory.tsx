import { useState, useEffect } from 'react'
import axios from 'axios'
import { Calendar, Trophy, Users } from 'lucide-react'

interface MatchRecord {
    id: number
    homePlayer: string
    awayPlayer: string
    scoreHome: number
    scoreAway: number
    playedOn: string
    homeTeamId: number
    awayTeamId: number
}

interface MatchHistoryProps {
    embedded?: boolean
}

function MatchHistory({ embedded = false }: MatchHistoryProps) {
    const [matches, setMatches] = useState<MatchRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                setLoading(true)
                // Endpoint que necesitaremos crear en el backend
                const response = await axios.get('/api/matches/history', {
                    headers: { 'Accept': 'application/json' }
                })
                setMatches(response.data.matches || [])
            } catch (err: any) {
                console.error('Error fetching match history:', err)
                setError('Error al cargar el historial de partidos')
            } finally {
                setLoading(false)
            }
        }

        fetchMatches()
    }, [])

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getWinner = (match: MatchRecord) => {
        if (match.scoreHome > match.scoreAway) return 'home'
        if (match.scoreAway > match.scoreHome) return 'away'
        return 'draw'
    }

    if (loading) {
        return (
            <div className={`${embedded ? 'py-12' : 'min-h-screen bg-gray-900'} flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`${embedded ? 'py-12' : 'min-h-screen bg-gray-900'} flex items-center justify-center`}>
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <div className="text-red-500 text-xl">{error}</div>
                </div>
            </div>
        )
    }

    return (
        <div className={embedded ? '' : 'min-h-screen bg-gray-900'}>
            <div className={embedded ? '' : 'max-w-7xl mx-auto px-4 py-8'}>
                {/* Header - Only show if not embedded */}
                {!embedded && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="text-orange-500" size={32} />
                            <h1 className="text-4xl font-bold text-white">Historial de Partidos</h1>
                        </div>
                        <p className="text-gray-400">Todos los partidos jugados en el servidor</p>
                    </div>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy className="text-yellow-500" size={24} />
                            <div className="text-gray-400 text-sm">Total de Partidos</div>
                        </div>
                        <div className="text-3xl font-bold text-white">{matches.length}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="text-blue-500" size={24} />
                            <div className="text-gray-400 text-sm">Jugadores Únicos</div>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {new Set([...matches.map(m => m.homePlayer), ...matches.map(m => m.awayPlayer)]).size}
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="text-2xl">⚽</div>
                            <div className="text-gray-400 text-sm">Goles Totales</div>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {matches.reduce((sum, m) => sum + m.scoreHome + m.scoreAway, 0)}
                        </div>
                    </div>
                </div>

                {/* Matches List */}
                <div className="space-y-4">
                    {matches.length === 0 ? (
                        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="text-6xl mb-4">📋</div>
                            <div className="text-gray-400 text-lg">No hay partidos registrados aún</div>
                        </div>
                    ) : (
                        matches.map((match) => {
                            const winner = getWinner(match)
                            return (
                                <div
                                    key={match.id}
                                    className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-orange-500 transition-all"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            {/* Home Player */}
                                            <div className={`flex-1 text-right ${winner === 'home' ? 'opacity-100' : 'opacity-60'}`}>
                                                <div className="text-xl font-bold text-white mb-1">
                                                    {match.homePlayer}
                                                    {winner === 'home' && <span className="ml-2">👑</span>}
                                                </div>
                                                <div className="text-sm text-gray-400">Equipo ID: {match.homeTeamId}</div>
                                            </div>

                                            {/* Score */}
                                            <div className="px-8">
                                                <div className="text-4xl font-bold text-center">
                                                    <span className={winner === 'home' ? 'text-green-500' : 'text-gray-400'}>
                                                        {match.scoreHome}
                                                    </span>
                                                    <span className="text-gray-600 mx-2">-</span>
                                                    <span className={winner === 'away' ? 'text-green-500' : 'text-gray-400'}>
                                                        {match.scoreAway}
                                                    </span>
                                                </div>
                                                {winner === 'draw' && (
                                                    <div className="text-xs text-center text-yellow-500 mt-1">EMPATE</div>
                                                )}
                                            </div>

                                            {/* Away Player */}
                                            <div className={`flex-1 text-left ${winner === 'away' ? 'opacity-100' : 'opacity-60'}`}>
                                                <div className="text-xl font-bold text-white mb-1">
                                                    {winner === 'away' && <span className="mr-2">👑</span>}
                                                    {match.awayPlayer}
                                                </div>
                                                <div className="text-sm text-gray-400">Equipo ID: {match.awayTeamId}</div>
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                                            <div className="text-sm text-gray-500 flex items-center justify-center gap-2">
                                                <Calendar size={14} />
                                                {formatDate(match.playedOn)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

export default MatchHistory
