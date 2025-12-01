interface Match {
    roomName: string
    score: string
    homeProfile?: string
    awayProfile?: string
    homeTeam?: string[]
    awayTeam?: string[]
    lobbyName?: string
}

interface MatchCardProps {
    match: Match
}

function MatchCard({ match }: MatchCardProps) {
    const homeTeam = match.homeProfile || match.homeTeam?.[0] || 'Team 1'
    const awayTeam = match.awayProfile || match.awayTeam?.[0] || 'Team 2'

    return (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-white/10 hover:border-purple-400/30 transition-all">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-white font-semibold">{homeTeam}</p>
                    <p className="text-gray-400 text-sm">{match.lobbyName}</p>
                </div>
                <div className="px-4">
                    <p className="text-2xl font-bold text-purple-400">{match.score}</p>
                </div>
                <div className="flex-1 text-right">
                    <p className="text-white font-semibold">{awayTeam}</p>
                    <p className="text-gray-400 text-sm">{match.roomName}</p>
                </div>
            </div>
        </div>
    )
}

export default MatchCard
