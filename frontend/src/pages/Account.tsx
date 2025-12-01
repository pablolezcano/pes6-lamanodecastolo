import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Copy, Download, Shield, Trophy, Flame, Clock, User } from 'lucide-react'

// Lista temporal de admins
const ADMIN_USERNAMES = ['admin', 'juce', 'reddwarf']

function Account() {
    const { isUserAuthenticated, user, isLoading } = useAuth()
    const [activeTab, setActiveTab] = useState<'general' | 'stats'>('general')
    const [showSerial, setShowSerial] = useState(false)
    const [serialCopied, setSerialCopied] = useState(false)
    const [selectedProfileIndex, setSelectedProfileIndex] = useState(0)

    // Show loading while fetching user data
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando datos de usuario...</p>
                </div>
            </div>
        )
    }

    // Redirect si no está autenticado
    if (!isUserAuthenticated || !user) {
        return <Navigate to="/auth" replace />
    }

    // Determinar si es admin
    const isAdmin = ADMIN_USERNAMES.includes(user.username.toLowerCase())

    const email = `${user.username}@fiveserver.com`

    // Obtener perfiles disponibles
    const profiles = user.profiles || []
    const hasProfiles = profiles.length > 0

    // Obtener datos del perfil seleccionado
    const currentProfile = hasProfiles ? profiles[selectedProfileIndex] : null

    // Stats del perfil actual
    const stats = currentProfile?.stats || { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0 }
    const streaks = currentProfile?.streaks || { current: 0, best: 0 }

    const totalMatches = stats.played
    const winRate = totalMatches > 0 ? Math.round((stats.won / totalMatches) * 100) : 0
    const avgGoalsPerMatch = totalMatches > 0 ? (stats.goals_for / totalMatches).toFixed(2) : '0.00'
    const hoursPlayed = Math.floor((currentProfile?.seconds_played || 0) / 3600)

    const copySerial = () => {
        navigator.clipboard.writeText(user.serial)
        setSerialCopied(true)
        setTimeout(() => setSerialCopied(false), 2000)
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Hero Section - Tarjeta de Jugador */}
                <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl p-8 mb-8 border-2 border-gray-700 shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Avatar y Info Principal */}
                        <div className="lg:col-span-2 flex flex-col md:flex-row gap-6">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-bold text-5xl ${isAdmin
                                    ? 'bg-gradient-to-br from-red-500 to-red-700 ring-4 ring-red-400 shadow-lg shadow-red-500/50'
                                    : 'bg-gradient-to-br from-orange-500 to-orange-700 ring-4 ring-orange-400'
                                    }`}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-4xl font-bold text-white">{user.username}</h1>
                                    {isAdmin && (
                                        <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
                                            <Shield size={16} className="text-white" />
                                            <span className="text-white text-sm font-bold">ADMIN</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-400 mb-6">{email}</p>

                                {/* Serial del Juego */}
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-400 font-semibold">🔑 Serial del Juego</span>
                                        <button
                                            onClick={() => setShowSerial(!showSerial)}
                                            className="text-orange-400 hover:text-orange-300 transition-colors"
                                        >
                                            {showSerial ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-white font-mono text-sm">
                                            {showSerial ? user.serial : '••••-••••-••••-••••'}
                                        </code>
                                        {showSerial && (
                                            <button
                                                onClick={copySerial}
                                                className="bg-orange-500 hover:bg-orange-600 p-2 rounded transition-colors"
                                                title="Copiar serial"
                                            >
                                                <Copy size={18} className="text-white" />
                                            </button>
                                        )}
                                    </div>
                                    {serialCopied && (
                                        <p className="text-green-400 text-xs mt-2">✓ Serial copiado al portapapeles</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Highlights (Globales o del perfil seleccionado) */}
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-4 border border-blue-500/30">
                                <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-1">
                                    <Trophy size={16} />
                                    <span>Puntos</span>
                                </div>
                                <div className="text-3xl font-bold text-white">{currentProfile?.points || 0}</div>
                            </div>
                            <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 rounded-lg p-4 border border-orange-500/30">
                                <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold mb-1">
                                    <Flame size={16} />
                                    <span>Racha Actual</span>
                                </div>
                                <div className="text-3xl font-bold text-white">{streaks.current} <span className="text-sm text-gray-400 font-normal">(Mejor: {streaks.best})</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Selector */}
                {hasProfiles && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <User className="text-orange-500" />
                            Perfiles de Juego
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {profiles.map((profile: any, index: number) => (
                                <button
                                    key={profile.id}
                                    onClick={() => setSelectedProfileIndex(index)}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all min-w-[200px] ${selectedProfileIndex === index
                                        ? 'bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-500/20'
                                        : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${selectedProfileIndex === index ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'
                                        }`}>
                                        {profile.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <div className={`font-bold ${selectedProfileIndex === index ? 'text-white' : 'text-gray-300'}`}>
                                            {profile.name}
                                        </div>
                                        <div className="text-xs text-gray-400">Rank #{profile.rank}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {!hasProfiles && (
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-8 text-center">
                        <h3 className="text-xl font-bold text-yellow-500 mb-2">No tienes perfiles creados</h3>
                        <p className="text-gray-400">Entra al juego (PES6) y crea un perfil para ver tus estadísticas aquí.</p>
                    </div>
                )}

                {hasProfiles && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content - Tabs */}
                        <div className="lg:col-span-2">
                            {/* Tabs Navigation */}
                            <div className="bg-gray-800 rounded-t-lg border border-gray-700 border-b-0">
                                <div className="flex gap-1 p-1">
                                    <button
                                        onClick={() => setActiveTab('general')}
                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'general'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-700'
                                            }`}
                                    >
                                        General
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('stats')}
                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'stats'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-700'
                                            }`}
                                    >
                                        Estadísticas
                                    </button>
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="bg-gray-800 rounded-b-lg border border-gray-700 p-6">
                                {activeTab === 'general' && (
                                    <div className="space-y-6">
                                        {/* Win Rate */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-lg font-bold text-white">Win Rate</h3>
                                                <span className="text-2xl font-bold text-orange-500">{winRate}%</span>
                                            </div>
                                            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all"
                                                    style={{ width: `${winRate}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                                                <div className="text-green-400 text-sm font-semibold mb-1">Victorias</div>
                                                <div className="text-3xl font-bold text-white">{stats.won}</div>
                                            </div>
                                            <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                                                <div className="text-gray-400 text-sm font-semibold mb-1">Empates</div>
                                                <div className="text-3xl font-bold text-white">{stats.drawn}</div>
                                            </div>
                                            <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                                                <div className="text-red-400 text-sm font-semibold mb-1">Derrotas</div>
                                                <div className="text-3xl font-bold text-white">{stats.lost}</div>
                                            </div>
                                        </div>

                                        {/* Time Played */}
                                        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 text-gray-400 text-sm font-semibold mb-1">
                                                    <Clock size={16} />
                                                    <span>Tiempo Jugado</span>
                                                </div>
                                                <div className="text-2xl font-bold text-white">{hoursPlayed} horas</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-gray-400 text-sm font-semibold mb-1">Total Partidos</div>
                                                <div className="text-2xl font-bold text-white">{totalMatches}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'stats' && (
                                    <div className="space-y-6">
                                        {/* Goles */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                                                <div className="text-blue-400 text-sm font-semibold mb-1">⚽ Goles a Favor</div>
                                                <div className="text-3xl font-bold text-white">{stats.goals_for}</div>
                                            </div>
                                            <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                                                <div className="text-red-400 text-sm font-semibold mb-1">🥅 Goles en Contra</div>
                                                <div className="text-3xl font-bold text-white">{stats.goals_against}</div>
                                            </div>
                                        </div>

                                        {/* Diferencia de Goles */}
                                        <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                                            <div className="text-gray-400 text-sm font-semibold mb-1">Diferencia de Goles</div>
                                            <div className={`text-2xl font-bold ${stats.goals_for - stats.goals_against > 0 ? 'text-green-400' : 'text-red-400'
                                                }`}>
                                                {stats.goals_for - stats.goals_against > 0 ? '+' : ''}
                                                {stats.goals_for - stats.goals_against}
                                            </div>
                                        </div>

                                        {/* Promedio */}
                                        <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-500/30">
                                            <div className="text-orange-400 text-sm font-semibold mb-1">📊 Promedio de Gol por Partido</div>
                                            <div className="text-3xl font-bold text-white">{avgGoalsPerMatch}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Estado de Cuenta */}
                            {isAdmin && (
                                <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-lg p-6 border-2 border-red-500/50">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Shield size={32} className="text-red-400" />
                                        <div>
                                            <h3 className="text-lg font-bold text-white">ADMINISTRADOR</h3>
                                            <p className="text-red-400 text-sm">DEL SISTEMA</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 text-sm">
                                        Tienes acceso completo al panel de administración y todas las funciones del servidor.
                                    </p>
                                </div>
                            )}

                            {/* Accesos Rápidos */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-lg font-bold text-white mb-4">Accesos Rápidos</h3>
                                <div className="space-y-3">
                                    <Link
                                        to="/downloads"
                                        className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                                    >
                                        <Download size={20} className="text-orange-400" />
                                        <span className="text-white font-medium">Cliente del Juego</span>
                                    </Link>
                                    <Link
                                        to="/downloads"
                                        className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                                    >
                                        <Download size={20} className="text-blue-400" />
                                        <span className="text-white font-medium">Archivo Hosts</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Account
