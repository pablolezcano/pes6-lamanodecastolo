import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import axios from 'axios'

interface Stats {
    playerCount: number
    lobbies: Array<{
        name: string
        playerCount: number
        matchesInProgress: number
        matches?: Array<{
            roomName: string
            score: string
            homeProfile?: string
            awayProfile?: string
            homeTeam?: string[]
            awayTeam?: string[]
        }>
    }>
}

function Home() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsRes = await axios.get('/api/stats', { headers: { 'Accept': 'application/json' } })
                setStats(statsRes.data)
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    const activeLobbies = stats?.lobbies.filter(l => l.playerCount > 0).length || 0
    const totalMatches = stats?.lobbies.reduce((sum, l) => sum + l.matchesInProgress, 0) || 0

    return (
        <div>
            {/* Hero Section */}
            <div
                className="relative min-h-[600px] flex items-center justify-center"
                style={{
                    backgroundImage: 'url(/football-bg.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>

                {/* Content */}
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
                        ¡Revive la Leyenda!
                    </h1>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">
                        Juega <span className="text-orange-500">PES6 Online</span>
                    </h2>
                    <p className="text-gray-300 text-lg md:text-xl mb-8">
                        Servidor Dedicado con Estadísticas, Rankings y Comunidad Activa.
                    </p>


                    <div className="flex flex-col items-center gap-4 mb-12">
                        <Link
                            to="/server"
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg w-full md:w-auto"
                        >
                            🏆 Acceder al Vestuario
                        </Link>
                        <Link
                            to="/guide"
                            className="bg-gray-800/80 hover:bg-gray-700 text-white font-bold py-3 px-10 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg border border-gray-600 hover:border-gray-500 w-full md:w-auto"
                        >
                            📘 ¿Cómo Jugar?
                        </Link>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="bg-gradient-to-b from-green-900/30 to-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <h3 className="text-3xl font-bold text-white mb-4">Sobre Nosotros</h3>
                    <p className="text-gray-300 max-w-3xl">
                        Los más competitivos se reúnen cada día en nuestro servidor online en un ambiente único para encontrar a los demás
                        entusiastas de este gran juego y competir en todos los ámbitos de manera simultánea a sus carreras.
                    </p>
                </div>
            </div>

            {/* Server Status */}
            <div className="bg-gray-900 py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-3xl font-bold text-white">Estado del Servidor</h3>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-500 font-semibold">ONLINE</span>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-2 border-orange-500 rounded-2xl p-8 bg-gray-800/50">
                        <div className="text-center">
                            <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                                {stats?.playerCount || 0}
                            </div>
                            <div className="text-gray-400 text-sm md:text-base">Jugadores Online</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl md:text-6xl font-bold text-orange-500 mb-2">
                                {activeLobbies}
                            </div>
                            <div className="text-gray-400 text-sm md:text-base">Lobbies Activos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl md:text-6xl font-bold text-green-500 mb-2">
                                {totalMatches}
                            </div>
                            <div className="text-gray-400 text-sm md:text-base">Partidos en Curso</div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl md:text-6xl font-bold text-blue-500 mb-2">
                                {stats?.lobbies.length || 0}
                            </div>
                            <div className="text-gray-400 text-sm md:text-base">Total Lobbies</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Discord Community Section */}
            <div className="bg-gray-900 py-8">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="bg-[#0a0a1f] rounded-3xl p-10 md:p-16 border border-indigo-900/30 text-center relative overflow-hidden group">
                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900/20 to-transparent pointer-events-none"></div>
                        <div className="absolute -right-10 -bottom-10 opacity-10 transform rotate-12">
                            <MessageSquare size={200} fill="white" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-3xl md:text-5xl font-black italic text-white mb-4 uppercase leading-tight">
                                Únete al <span className="text-[#5865F2]">Vestuario</span> en Discord
                            </h3>
                            <p className="text-indigo-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                                Organiza partidos, participa en sorteos semanales y mantente al día con los parches oficiales. ¡La comunidad te espera!
                            </p>

                            <a
                                href="https://discord.gg/f4ErZ4YBCw"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/30"
                            >
                                ENTRAR A LA COMUNIDAD <MessageSquare size={20} fill="currentColor" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-orange-900/30 to-gray-900 py-16">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h3 className="text-4xl font-bold text-white mb-4">¿Listo para Jugar?</h3>
                    <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                        Únete a nuestra comunidad y demuestra tus habilidades en el mejor servidor de PES6.
                    </p>
                    <Link
                        to="/auth"
                        className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all transform hover:scale-105"
                    >
                        Registrarse Gratis
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Home
