import { useState } from 'react'
import { Eye, Users, MapPin } from 'lucide-react'
import MatchModal from '../components/MatchModal'
import { useMatches } from '../hooks/useMatches'
import { useLobbies } from '../hooks/useLobbies'
import type { Match } from '../utils/dataTransformers'

import MatchHistory from './MatchHistory'

function ServerStats() {
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
    const [regionFilter, setRegionFilter] = useState<string>('all')
    const [activeTab, setActiveTab] = useState<'live' | 'history'>('live')

    // Usar hooks reales en lugar de mock data
    const { matches } = useMatches()
    const { lobbies, waitingRooms } = useLobbies()

    const filteredLobbies = regionFilter === 'all'
        ? lobbies
        : lobbies.filter(lobby => lobby.region === regionFilter)

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Vestuario</h1>
                    <p className="text-gray-400">Centro de matchmaking - Encuentra partidos y únete a salas</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-gray-700">
                    <button
                        className={`pb-3 px-4 font-bold text-lg transition-colors border-b-2 ${activeTab === 'live' ? 'border-orange-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('live')}
                    >
                        En Vivo
                        {matches.length > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                                {matches.length}
                            </span>
                        )}
                    </button>
                    <button
                        className={`pb-3 px-4 font-bold text-lg transition-colors border-b-2 ${activeTab === 'history' ? 'border-orange-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Historial
                    </button>
                </div>

                {activeTab === 'live' ? (
                    /* Live Matches Section */
                    <div className="mb-12">
                        {/* Partidos en Juego */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <h2 className="text-2xl font-bold text-white">Partidos en Vivo</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {matches.map((match) => (
                                <div
                                    key={match.id}
                                    className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-orange-500 transition-all hover:scale-105 cursor-pointer group"
                                    onClick={() => setSelectedMatch(match)}
                                >
                                    {/* Match Header */}
                                    <div className="bg-gradient-to-r from-orange-900/30 to-gray-900 p-4 border-b border-gray-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/50">
                                                EN VIVO
                                            </span>
                                            <span className="text-sm text-orange-400 font-bold">{match.minute}'</span>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="text-white font-bold text-lg mb-1">{match.homeTeam}</div>
                                                <div className="text-xs text-gray-400">{match.homePlayer}</div>
                                            </div>

                                            <div className="px-4">
                                                <div className="text-3xl font-bold text-orange-500">
                                                    {match.score.home} - {match.score.away}
                                                </div>
                                            </div>

                                            <div className="flex-1 text-right">
                                                <div className="text-white font-bold text-lg mb-1">{match.awayTeam}</div>
                                                <div className="text-xs text-gray-400">{match.awayPlayer}</div>
                                            </div>
                                        </div>

                                        {/* Room name */}
                                        <div className="text-xs text-gray-500 text-center mb-3 pb-3 border-b border-gray-700">
                                            🎮 {match.roomName}
                                        </div>

                                        {/* Spectate Button */}
                                        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 group-hover:scale-105">
                                            <Eye size={18} />
                                            ESPECTAR
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {matches.length === 0 && (
                            <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700 mb-12">
                                <div className="text-6xl mb-4">⚽</div>
                                <div className="text-gray-400 text-lg">No hay partidos en curso</div>
                            </div>
                        )}

                        {/* Salas en Espera */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <h2 className="text-2xl font-bold text-white">Partidas en Espera</h2>
                            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                                {waitingRooms.length} SALAS
                            </span>
                        </div>

                        {waitingRooms.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                                {waitingRooms.map((room) => (
                                    <div key={room.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-green-500 transition-all hover:scale-[1.02]">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-1">{room.name}</h3>
                                                <div className="text-sm text-gray-400 flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                    {room.status}
                                                </div>
                                            </div>
                                            <div className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                                                {room.lobbyName}
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">Dueño:</span>
                                                <span className="text-white font-medium">{room.owner}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">Jugadores:</span>
                                                <span className="text-white font-medium">{room.players.length}/{room.maxPlayers}</span>
                                            </div>
                                            {/* Listado de jugadores */}
                                            <div className="flex gap-1 flex-wrap mt-2">
                                                {room.players.map(p => (
                                                    <span key={p} className="text-xs bg-gray-900 border border-gray-600 px-2 py-0.5 rounded text-gray-300">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                                            UNIRSE AL JUEGO
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-800/50 rounded-lg border border-gray-700/50 border-dashed mb-12">
                                <p className="text-gray-500">No hay salas esperando jugadores actualmente.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <MatchHistory embedded={true} />
                )}

                {/* Server List Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-white">Servidores Disponibles</h2>
                            <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-semibold">
                                {filteredLobbies.length} SALAS
                            </span>
                        </div>

                        {/* Region Filter */}
                        <div className="flex gap-2">
                            {['all', 'AR', 'BR', 'CL', 'General'].map((region) => (
                                <button
                                    key={region}
                                    onClick={() => setRegionFilter(region)}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${regionFilter === region
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                                        }`}
                                >
                                    {region === 'all' ? 'Todas' : region}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Server Table */}
                    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Estado</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Nombre</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Región</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase">Capacidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredLobbies.map((lobby) => (
                                    <tr key={lobby.id} className="hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${lobby.status === 'waiting'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                                }`}>
                                                {lobby.status === 'waiting' ? 'Esperando' : 'En Juego'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-semibold">{lobby.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-gray-400" />
                                                <span className="text-gray-300">{lobby.region}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Users size={16} className="text-gray-400" />
                                                    <span className="text-white font-semibold">{lobby.players}/{lobby.maxPlayers}</span>
                                                </div>
                                                <div className="flex-1 max-w-[100px]">
                                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-orange-500 rounded-full transition-all"
                                                            style={{ width: `${(lobby.players / lobby.maxPlayers) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredLobbies.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🏠</div>
                                <div className="text-gray-400 text-lg">No hay servidores disponibles en esta región</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Match Modal */}
            {selectedMatch && (
                <MatchModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
            )}
        </div>
    )
}

export default ServerStats
