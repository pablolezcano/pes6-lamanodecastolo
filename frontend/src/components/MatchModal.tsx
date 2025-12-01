import { X } from 'lucide-react'

interface MatchEvent {
    minute: number
    type: 'goal' | 'yellow_card' | 'red_card' | 'substitution'
    team: 'home' | 'away'
    player: string
    description: string
}

interface MatchStats {
    possession: { home: number; away: number }
    shots: { home: number; away: number }
    fouls: { home: number; away: number }
    corners: { home: number; away: number }
    offsides: { home: number; away: number }
}

interface Match {
    id: string
    homeTeam: string
    awayTeam: string
    homePlayer: string
    awayPlayer: string
    score: { home: number; away: number }
    minute: number
    roomName: string
    events: MatchEvent[]
    stats: MatchStats
}

interface MatchModalProps {
    match: Match
    onClose: () => void
}

function MatchModal({ match, onClose }: MatchModalProps) {
    const getEventIcon = (type: string) => {
        switch (type) {
            case 'goal':
                return '⚽'
            case 'yellow_card':
                return '🟨'
            case 'red_card':
                return '🟥'
            case 'substitution':
                return '↔️'
            default:
                return '•'
        }
    }

    const getEventColor = (type: string) => {
        switch (type) {
            case 'goal':
                return 'bg-green-500'
            case 'yellow_card':
                return 'bg-yellow-400'
            case 'red_card':
                return 'bg-red-500'
            case 'substitution':
                return 'bg-blue-500'
            default:
                return 'bg-gray-500'
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-900/30 to-gray-800 border-b border-gray-700 p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Score Header */}
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex-1 text-right">
                            <div className="text-2xl font-bold text-white mb-1">{match.homeTeam}</div>
                            <div className="text-sm text-gray-400">{match.homePlayer}</div>
                        </div>

                        <div className="px-8">
                            <div className="text-6xl font-bold text-orange-500">
                                {match.score.home} - {match.score.away}
                            </div>
                            <div className="text-center text-sm text-gray-400 mt-2">
                                {match.minute}'
                            </div>
                        </div>

                        <div className="flex-1 text-left">
                            <div className="text-2xl font-bold text-white mb-1">{match.awayTeam}</div>
                            <div className="text-sm text-gray-400">{match.awayPlayer}</div>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Main Content - Timeline and Stats */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Timeline */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-bold text-white mb-6">Timeline del Partido</h3>

                                <div className="relative">
                                    {/* Timeline bar */}
                                    <div className="relative h-32">
                                        {/* Central line */}
                                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-700 -translate-y-1/2"></div>

                                        {/* Minute markers */}
                                        <div className="absolute top-1/2 left-0 right-0 flex justify-between -translate-y-1/2">
                                            {[0, 15, 30, 45, 60, 75, 90].map((min) => (
                                                <div key={min} className="flex flex-col items-center">
                                                    <div className="w-0.5 h-3 bg-gray-600"></div>
                                                    <span className="text-xs text-gray-500 mt-8">{min}'</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Events */}
                                        {match.events.map((event, idx) => {
                                            const position = (event.minute / 90) * 100
                                            const isHome = event.team === 'home'

                                            return (
                                                <div
                                                    key={idx}
                                                    className="absolute group"
                                                    style={{
                                                        left: `${position}%`,
                                                        top: isHome ? '10%' : '60%',
                                                    }}
                                                >
                                                    <div className={`${getEventColor(event.type)} w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer hover:scale-125 transition-transform`}>
                                                        {getEventIcon(event.type)}
                                                    </div>

                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                                                        <div className="bg-gray-950 text-white text-xs rounded px-3 py-2 whitespace-nowrap border border-gray-700">
                                                            <div className="font-bold">{event.minute}' - {event.player}</div>
                                                            <div className="text-gray-400">{event.description}</div>
                                                        </div>
                                                    </div>

                                                    {/* Connecting line */}
                                                    <div className={`absolute left-1/2 w-0.5 ${getEventColor(event.type)} -translate-x-1/2`}
                                                        style={{
                                                            height: isHome ? '20px' : '20px',
                                                            top: isHome ? '100%' : '-20px'
                                                        }}
                                                    ></div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Comparative Stats */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-bold text-white mb-6">Estadísticas Comparativas</h3>

                                <div className="space-y-4">
                                    {/* Possession */}
                                    <div>
                                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                                            <span>{match.stats.possession.home}%</span>
                                            <span>Posesión</span>
                                            <span>{match.stats.possession.away}%</span>
                                        </div>
                                        <div className="flex gap-1 h-3">
                                            <div className="bg-orange-500 rounded-l" style={{ width: `${match.stats.possession.home}%` }}></div>
                                            <div className="bg-blue-500 rounded-r" style={{ width: `${match.stats.possession.away}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Shots */}
                                    <div>
                                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                                            <span>{match.stats.shots.home}</span>
                                            <span>Tiros al Arco</span>
                                            <span>{match.stats.shots.away}</span>
                                        </div>
                                        <div className="flex gap-1 h-3">
                                            <div className="bg-orange-500 rounded-l" style={{ width: `${(match.stats.shots.home / (match.stats.shots.home + match.stats.shots.away)) * 100}%` }}></div>
                                            <div className="bg-blue-500 rounded-r" style={{ width: `${(match.stats.shots.away / (match.stats.shots.home + match.stats.shots.away)) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Fouls */}
                                    <div>
                                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                                            <span>{match.stats.fouls.home}</span>
                                            <span>Faltas</span>
                                            <span>{match.stats.fouls.away}</span>
                                        </div>
                                        <div className="flex gap-1 h-3">
                                            <div className="bg-orange-500 rounded-l" style={{ width: `${(match.stats.fouls.home / (match.stats.fouls.home + match.stats.fouls.away)) * 100}%` }}></div>
                                            <div className="bg-blue-500 rounded-r" style={{ width: `${(match.stats.fouls.away / (match.stats.fouls.home + match.stats.fouls.away)) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Corners */}
                                    <div>
                                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                                            <span>{match.stats.corners.home}</span>
                                            <span>Córners</span>
                                            <span>{match.stats.corners.away}</span>
                                        </div>
                                        <div className="flex gap-1 h-3">
                                            <div className="bg-orange-500 rounded-l" style={{ width: `${(match.stats.corners.home / (match.stats.corners.home + match.stats.corners.away)) * 100}%` }}></div>
                                            <div className="bg-blue-500 rounded-r" style={{ width: `${(match.stats.corners.away / (match.stats.corners.home + match.stats.corners.away)) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Offsides */}
                                    <div>
                                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                                            <span>{match.stats.offsides.home}</span>
                                            <span>Fuera de Juego</span>
                                            <span>{match.stats.offsides.away}</span>
                                        </div>
                                        <div className="flex gap-1 h-3">
                                            <div className="bg-orange-500 rounded-l" style={{ width: `${(match.stats.offsides.home / (match.stats.offsides.home + match.stats.offsides.away)) * 100}%` }}></div>
                                            <div className="bg-blue-500 rounded-r" style={{ width: `${(match.stats.offsides.away / (match.stats.offsides.home + match.stats.offsides.away)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Events Feed */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 sticky top-6">
                                <h3 className="text-lg font-bold text-white mb-4">Feed de Eventos</h3>

                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {match.events.sort((a, b) => b.minute - a.minute).map((event, idx) => (
                                        <div key={idx} className="flex gap-3 text-sm">
                                            <div className={`${getEventColor(event.type)} w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs`}>
                                                {getEventIcon(event.type)}
                                            </div>
                                            <div>
                                                <div className="text-white font-semibold">{event.minute}'</div>
                                                <div className="text-gray-400 text-xs">{event.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MatchModal
