import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'


interface ServerStats {
    server: {
        version: string
        ip: string
        maxUsers: number
        debug: boolean
        storeSettings: boolean
    }
}

interface OnlineUsers {
    count: number
    users: Array<{
        username?: string
        key?: string
        lobby?: string
        profile?: string
        ip?: string
    }>
}

interface BannedList {
    count: number
    banned: string[]
}

interface ProcessInfo {
    pid: number
    uptime: {
        since: string
        up: string
    }
    stats: {
        cpu: number
        mem: number
    }
    cmdline: string
}

type LobbyConfig = string | {
    name: string
    type?: string | string[]
    showMatches?: boolean
    checkRosterHash?: boolean
}

interface User {
    username: string
    locked: boolean
    nonce?: string
}

interface Announcement {
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'urgent'
    createdAt: string
    active: boolean
}

interface UsersResponse {
    total: number
    offset: number
    limit: number
    users: User[]
}

function Admin() {
    const [stats, setStats] = useState<ServerStats | null>(null)
    const [onlineUsers, setOnlineUsers] = useState<OnlineUsers | null>(null)
    const [bannedList, setBannedList] = useState<BannedList | null>(null)
    const [processInfo, setProcessInfo] = useState<ProcessInfo | null>(null)
    const [logs, setLogs] = useState<string[]>([])
    const [activeSection, setActiveSection] = useState('dashboard')

    // Announcement states
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        message: '',
        type: 'info' as 'info' | 'warning' | 'urgent'
    })
    const [lobbiesConfig, setLobbiesConfig] = useState<LobbyConfig[]>([])
    const [isSavingLobbies, setIsSavingLobbies] = useState(false)
    const { token, logout } = useAuth()

    // Ban management states
    const [newBanEntry, setNewBanEntry] = useState('')
    const [banSearchTerm, setBanSearchTerm] = useState('')

    // Config states
    const [config, setConfig] = useState({
        maxUsers: 0,
        debug: false,
        storeSettings: false
    })
    const [configChanged, setConfigChanged] = useState(false)

    // User management states
    const [users, setUsers] = useState<User[]>([])
    const [totalUsers, setTotalUsers] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)
    const [searchUser, setSearchUser] = useState('')
    const USERS_PER_PAGE = 20

    // Greeting states
    const [serverName, setServerName] = useState('')
    const [greetingText, setGreetingText] = useState('')
    const [isSavingGreeting, setIsSavingGreeting] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const authConfig = {
                    headers: {
                        'Authorization': token,
                        'Accept': 'application/json'
                    }
                }

                const [statsRes, onlineRes, bannedRes, logsRes, psRes, announcementsRes, lobbiesRes, greetingRes] = await Promise.all([
                    axios.get('/api/admin', authConfig),
                    axios.get('/api/admin/users', authConfig),
                    axios.get('/api/admin/banned', authConfig),
                    axios.get('/api/admin/log', authConfig),
                    axios.get('/api/ps', { headers: { 'Accept': 'application/json' } }),
                    axios.get('/api/admin/announcements', { headers: { 'Authorization': token } }),
                    axios.get('/api/admin/lobbies', { headers: { 'Authorization': token } }),
                    axios.get('/api/admin/greeting', { headers: { 'Authorization': token } })
                ])

                setStats(statsRes.data)
                setOnlineUsers({
                    count: onlineRes.data.total,
                    users: onlineRes.data.users
                })
                setBannedList(bannedRes.data)
                setProcessInfo(psRes.data)
                setAnnouncements(announcementsRes.data)
                setLobbiesConfig(lobbiesRes.data)
                setServerName(greetingRes.data.serverName || '')
                setGreetingText(greetingRes.data.greetingText || '')

                if (typeof logsRes.data === 'string') {
                    setLogs(logsRes.data.split('\n').slice(-50).reverse())
                } else {
                    setLogs(logsRes.data.logs || [])
                }

                // Update config
                if (statsRes.data.server) {
                    setConfig({
                        maxUsers: statsRes.data.server.maxUsers,
                        debug: statsRes.data.server.debug,
                        storeSettings: statsRes.data.server.storeSettings
                    })
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    logout()
                }
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [token, logout])

    // Load users when in usuarios section
    useEffect(() => {
        if (activeSection === 'usuarios') {
            loadUsers()
        }
    }, [activeSection, currentPage, searchUser])

    const loadUsers = async () => {
        try {
            const authConfig = {
                headers: {
                    'Authorization': token,
                    'Accept': 'application/json'
                }
            }
            const offset = currentPage * USERS_PER_PAGE
            const response = await axios.get<UsersResponse>(
                `/api/admin/users?offset=${offset}&limit=${USERS_PER_PAGE}`,
                authConfig
            )
            setUsers(response.data.users)
            setTotalUsers(response.data.total)
        } catch (error) {
            console.error('Error loading users:', error)
        }
    }

    const handleAddBan = async () => {
        if (!newBanEntry.trim()) return

        try {
            const authConfig = {
                headers: {
                    'Authorization': token,
                    'Accept': 'application/json'
                }
            }
            const formData = new URLSearchParams()
            formData.append('entry', newBanEntry)

            await axios.post('/api/admin/ban-add', formData, authConfig)

            // Reload banned list
            const bannedRes = await axios.get('/api/admin/banned', authConfig)
            setBannedList(bannedRes.data)
            setNewBanEntry('')
        } catch (error) {
            console.error('Error adding ban:', error)
            alert('Error al agregar baneo')
        }
    }

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await axios.post('/api/admin/announcements', newAnnouncement, {
                headers: { 'Authorization': token }
            })
            // Refresh announcements
            const res = await axios.get('/api/admin/announcements', {
                headers: { 'Authorization': token }
            })
            setAnnouncements(res.data)
            setNewAnnouncement({ title: '', message: '', type: 'info' })
            alert('Anuncio creado correctamente')
        } catch (error) {
            console.error('Error creating announcement:', error)
            alert('Error al crear anuncio')
        }
    }

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este anuncio?')) return
        try {
            await axios.delete(`/api/admin/announcements/${id}`, {
                headers: { 'Authorization': token }
            })
            setAnnouncements(announcements.filter(a => a.id !== id))
        } catch (error) {
            console.error('Error deleting announcement:', error)
        }
    }


    const handleSaveLobbies = async () => {
        if (!confirm('¿Guardar cambios en Lobbies? Esto requerirá un reinicio del servidor para aplicar completamente.')) return
        setIsSavingLobbies(true)
        try {
            await axios.post('/api/admin/lobbies', lobbiesConfig, {
                headers: { 'Authorization': token }
            })
            alert('Configuración de lobbies guardada. Por favor reinicia el servidor.')
        } catch (error) {
            console.error('Error saving lobbies:', error)
            alert('Error al guardar lobbies')
        } finally {
            setIsSavingLobbies(false)
        }
    }

    const handleSaveGreeting = async () => {
        setIsSavingGreeting(true)
        try {
            await axios.post('/api/admin/greeting', {
                serverName,
                greetingText
            }, {
                headers: { 'Authorization': token }
            })
            alert('Mensaje de bienvenida guardado correctamente')
        } catch (error) {
            console.error('Error saving greeting:', error)
            alert('Error al guardar el mensaje de bienvenida')
        } finally {
            setIsSavingGreeting(false)
        }
    }


    const handleDeleteLobby = (index: number) => {
        if (confirm('¿Eliminar este lobby?')) {
            const newLobbies = [...lobbiesConfig]
            newLobbies.splice(index, 1)
            setLobbiesConfig(newLobbies)
        }
    }

    const handleRemoveBan = async (entry: string) => {
        if (!confirm(`¿Remover baneo de "${entry}"?`)) return

        try {
            const authConfig = {
                headers: {
                    'Authorization': token,
                    'Accept': 'application/json'
                }
            }
            const formData = new URLSearchParams()
            formData.append('entry', entry)

            await axios.post('/api/admin/ban-remove', formData, authConfig)

            // Reload banned list
            const bannedRes = await axios.get('/api/admin/banned', authConfig)
            setBannedList(bannedRes.data)
        } catch (error) {
            console.error('Error removing ban:', error)
            alert('Error al remover baneo')
        }
    }

    const handleSaveConfig = async () => {
        try {
            const authConfig = {
                headers: {
                    'Authorization': token,
                    'Accept': 'application/json'
                }
            }

            // Save maxUsers
            const maxUsersForm = new URLSearchParams()
            maxUsersForm.append('maxusers', config.maxUsers.toString())
            await axios.post('/api/admin/maxusers', maxUsersForm, authConfig)

            // Save debug
            const debugForm = new URLSearchParams()
            debugForm.append('debug', config.debug ? '1' : '0')
            await axios.post('/api/admin/debug', debugForm, authConfig)

            // Save storeSettings
            const storeForm = new URLSearchParams()
            storeForm.append('store', config.storeSettings ? '1' : '0')
            await axios.post('/api/admin/settings', storeForm, authConfig)

            setConfigChanged(false)
            alert('Configuración guardada exitosamente')
        } catch (error) {
            console.error('Error saving config:', error)
            alert('Error al guardar configuración')
        }
    }

    const handleLockUser = async (username: string) => {
        if (!confirm(`¿Bloquear usuario "${username}"?`)) return

        try {
            const authConfig = {
                headers: {
                    'Authorization': token,
                    'Accept': 'application/json'
                }
            }
            const formData = new URLSearchParams()
            formData.append('username', username)

            await axios.post('/api/admin/userlock', formData, authConfig)
            alert('Usuario bloqueado exitosamente')
            loadUsers()
        } catch (error) {
            console.error('Error locking user:', error)
            alert('Error al bloquear usuario')
        }
    }

    const handleDeleteUser = async (username: string) => {
        if (!confirm(`⚠️ ¿ELIMINAR usuario "${username}"? Esta acción puede ser irreversible.`)) return
        if (!confirm('¿Estás completamente seguro?')) return

        try {
            const authConfig = {
                headers: {
                    'Authorization': token,
                    'Accept': 'application/json'
                }
            }
            const formData = new URLSearchParams()
            formData.append('username', username)

            await axios.post('/api/admin/userkill', formData, authConfig)
            alert('Usuario eliminado')
            loadUsers()
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Error al eliminar usuario')
        }
    }

    const filteredBanned = bannedList?.banned.filter(entry =>
        entry.toLowerCase().includes(banSearchTerm.toLowerCase())
    ) || []

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchUser.toLowerCase())
    )

    const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE)

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'anuncios', label: 'Anuncios', icon: '📢' },
        { id: 'lobbies', label: 'Lobbies', icon: '🏠' },
        { id: 'usuarios', label: 'Usuarios', icon: '👥' },
        { id: 'baneos', label: 'Baneos', icon: '🚫' },
        { id: 'configuracion', label: 'Configuración', icon: '⚙️' },
        { id: 'logs', label: 'Logs', icon: '📝' }
    ]

    return (
        <div className="flex min-h-screen bg-gray-900">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="text-3xl">⚽</div>
                        <div>
                            <div className="text-white font-bold">La Mano de Castolo</div>
                            <div className="text-gray-400 text-sm">Admin Panel</div>
                        </div>
                    </div>
                </div>

                <nav className="p-4 flex-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${activeSection === item.id
                                ? 'bg-orange-500 text-white'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-700 space-y-2">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <span>🚪</span>
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                    <a
                        href="/"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        <span>🏠</span>
                        <span className="font-medium">Volver a la Web</span>
                    </a>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto h-screen">
                <h1 className="text-4xl font-bold text-white mb-8 capitalize">{activeSection}</h1>

                {/* DASHBOARD */}
                {activeSection === 'dashboard' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <div className="bg-gray-800 border-2 border-orange-500 rounded-xl p-6">
                                <h3 className="text-gray-400 text-sm font-medium mb-4">Estado del Servidor</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-500 font-semibold">Online</span>
                                </div>
                                <div className="text-gray-400 text-sm">Versión: {stats?.server.version || '...'}</div>
                            </div>

                            <div className="bg-gray-800 border-2 border-orange-500 rounded-xl p-6">
                                <h3 className="text-gray-400 text-sm font-medium mb-4">IP del Servidor</h3>
                                <div className="text-2xl font-bold text-white">{stats?.server.ip || '...'}</div>
                            </div>

                            <div className="bg-gray-800 border-2 border-orange-500 rounded-xl p-6">
                                <h3 className="text-gray-400 text-sm font-medium mb-4">Usuarios Online</h3>
                                <div className="text-4xl font-bold text-white mb-1">{onlineUsers?.count || 0}</div>
                                <div className="text-gray-400 text-sm">Jugadores Activos</div>
                            </div>

                            <div className="bg-gray-800 border-2 border-orange-500 rounded-xl p-6">
                                <h3 className="text-gray-400 text-sm font-medium mb-4">Límite de Usuarios</h3>
                                <div className="text-4xl font-bold text-white mb-1">{stats?.server.maxUsers || 0}</div>
                                <div className="text-gray-400 text-sm">Capacidad Máxima</div>
                            </div>

                            <div className="bg-gray-800 border-2 border-orange-500 rounded-xl p-6">
                                <h3 className="text-gray-400 text-sm font-medium mb-4">Usuarios Baneados</h3>
                                <div className="text-4xl font-bold text-white mb-1">{bannedList?.count || 0}</div>
                                <div className="text-gray-400 text-sm">Total Baneos</div>
                            </div>
                        </div>

                        {/* PANEL DE ALERTAS */}
                        <div className="mb-8">
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-white font-bold flex items-center gap-2">
                                        <span>🔔</span> Alertas del Sistema
                                    </h3>
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                        {logs.filter(l => l.includes('ERROR') || l.includes('WARN')).length} Activas
                                    </span>
                                </div>
                                <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                    {logs.filter(l => l.includes('ERROR') || l.includes('WARN')).length === 0 ? (
                                        <div className="text-center text-gray-500 py-8">
                                            <div className="text-4xl mb-2">✅</div>
                                            <p>Todo funciona correctamente</p>
                                        </div>
                                    ) : (
                                        logs.filter(l => l.includes('ERROR') || l.includes('WARN')).slice(0, 10).map((log, idx) => {
                                            const isError = log.includes('ERROR');
                                            return (
                                                <div key={idx} className={`${isError ? 'bg-red-500/10 border-red-500' : 'bg-yellow-500/10 border-yellow-500'} border-l-4 p-3 rounded-r-lg transition-all hover:translate-x-1`}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`${isError ? 'text-red-400' : 'text-yellow-400'} font-bold text-xs uppercase`}>
                                                            {isError ? 'Error Crítico' : 'Advertencia'}
                                                        </span>
                                                        <span className="text-gray-500 text-[10px]">Reciente</span>
                                                    </div>
                                                    <p className="text-gray-300 text-xs line-clamp-2" title={log}>
                                                        {log.replace(/.*\[.*\]\s*/, '')}
                                                    </p>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Server Health Card */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 mb-8 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">💚</span>
                                    Salud del Servidor
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Sistema Operativo
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                {/* Uptime */}
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-green-500/50 transition-colors group">
                                    <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider group-hover:text-green-400 transition-colors">⏰ Tiempo Activo</div>
                                    <div className="text-2xl font-bold text-white mb-1 font-mono">
                                        {processInfo?.uptime.up.split('.')[0] || '0:00:00'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Inicio: {processInfo?.uptime.since ? new Date(processInfo.uptime.since).toLocaleTimeString() : '--:--'}
                                    </div>
                                </div>

                                {/* CPU */}
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-colors group">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider group-hover:text-blue-400 transition-colors">🖥️ CPU</div>
                                        <div className="text-xs font-bold text-blue-400">{processInfo?.stats.cpu.toFixed(1) || '0.0'}%</div>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${(processInfo?.stats.cpu || 0) > 80 ? 'bg-red-500' :
                                                (processInfo?.stats.cpu || 0) > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${Math.min(processInfo?.stats.cpu || 0, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">Carga del sistema</div>
                                </div>

                                {/* Memory */}
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-colors group">
                                    <div className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wider group-hover:text-purple-400 transition-colors">💾 Memoria RAM</div>
                                    <div className="text-2xl font-bold text-white mb-1 font-mono">
                                        {processInfo?.stats.mem.toFixed(1) || '0.0'} <span className="text-sm text-gray-500">MB</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        PID: {processInfo?.pid || '...'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span>📝</span> Live Logs
                                </h3>
                                <span className="text-xs text-gray-500 font-mono">tail -f sixserver.log</span>
                            </div>
                            <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-xs h-80 overflow-y-auto border border-gray-700 custom-scrollbar">
                                {logs.map((log, idx) => {
                                    let colorClass = 'text-gray-400';
                                    if (log.includes('ERROR')) colorClass = 'text-red-400 font-bold';
                                    else if (log.includes('WARN')) colorClass = 'text-yellow-400';
                                    else if (log.includes('INFO')) colorClass = 'text-blue-300';
                                    else if (log.includes('MATCH')) colorClass = 'text-green-400 font-bold';
                                    else if (log.includes('GOAL')) colorClass = 'text-orange-400 font-bold';

                                    return (
                                        <div key={idx} className={`border-b border-gray-800/50 py-1 px-2 hover:bg-white/5 transition-colors flex gap-2 ${colorClass}`}>
                                            <span className="opacity-50 select-none w-6 text-right">{idx + 1}</span>
                                            <span className="break-all">{log}</span>
                                        </div>
                                    )
                                })}
                                <div className="animate-pulse text-orange-500 mt-2">_</div>
                            </div>
                        </div>
                    </>
                )}

                {/* GESTIÓN DE ANUNCIOS */}
                {activeSection === 'anuncios' && (
                    <div className="space-y-8">
                        {/* Crear Anuncio */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-bold text-white mb-4">Crear Nuevo Anuncio</h2>
                            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Título</label>
                                        <input
                                            type="text"
                                            value={newAnnouncement.title}
                                            onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                                            placeholder="Ej: Mantenimiento Programado"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Tipo</label>
                                        <select
                                            value={newAnnouncement.type}
                                            onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                                        >
                                            <option value="info">ℹ️ Información</option>
                                            <option value="warning">⚠️ Advertencia</option>
                                            <option value="urgent">🚨 Urgente</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Mensaje</label>
                                    <textarea
                                        value={newAnnouncement.message}
                                        onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none h-24"
                                        placeholder="Escribe el contenido del anuncio..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                                >
                                    Publicar Anuncio
                                </button>
                            </form>
                        </div>

                        {/* Lista de Anuncios Activos */}
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                            <h2 className="text-xl font-bold text-white mb-4">Anuncios Activos</h2>
                            <div className="space-y-4">
                                {announcements.length === 0 ? (
                                    <div className="text-gray-500 text-center py-8">No hay anuncios activos</div>
                                ) : (
                                    announcements.map(announcement => (
                                        <div key={announcement.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`text-2xl p-2 rounded-lg ${announcement.type === 'urgent' ? 'bg-red-500/20 text-red-500' :
                                                    announcement.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                                                        'bg-blue-500/20 text-blue-500'
                                                    }`}>
                                                    {announcement.type === 'urgent' ? '🚨' :
                                                        announcement.type === 'warning' ? '⚠️' : 'ℹ️'}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold">{announcement.title}</h3>
                                                    <p className="text-gray-400 text-sm">{announcement.message}</p>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Publicado: {new Date(announcement.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                                className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                                title="Eliminar anuncio"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* GESTIÓN DE LOBBIES */}
                {activeSection === 'lobbies' && (
                    <div className="space-y-6">
                        {/* Header con Info */}
                        <div className="bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Gestión de Lobbies</h2>
                                    <p className="text-gray-400 text-sm mb-2">Configura las salas de juego del servidor. Los cambios se aplican inmediatamente.</p>
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <p>💡 <strong>Tipo Open:</strong> Cualquier jugador puede entrar</p>
                                        <p>💡 <strong>Tipo noStats:</strong> Los partidos no cuentan para estadísticas</p>
                                        <p>💡 <strong>Divisiones (A, 3B, 3A, 2, 1):</strong> Solo jugadores de esas divisiones pueden entrar</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setLobbiesConfig([...lobbiesConfig, { name: 'Nuevo Lobby', type: 'open', showMatches: true, checkRosterHash: true }])
                                        }}
                                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <span>➕</span> Agregar Lobby
                                    </button>
                                    <button
                                        onClick={handleSaveLobbies}
                                        disabled={isSavingLobbies}
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
                                    >
                                        <span>💾</span> {isSavingLobbies ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Lobbies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lobbiesConfig.map((lobby, index) => {
                                // Normalizar a objeto para la UI
                                const lobbyObj = typeof lobby === 'string'
                                    ? { name: lobby, type: 'open', showMatches: true, checkRosterHash: true }
                                    : { type: 'open', showMatches: true, checkRosterHash: true, ...lobby }

                                const updateLobby = (updates: any) => {
                                    const newLobbies = [...lobbiesConfig]
                                    const current = typeof newLobbies[index] === 'string'
                                        ? { name: newLobbies[index] as string, type: 'open', showMatches: true, checkRosterHash: true }
                                        : newLobbies[index] as any

                                    newLobbies[index] = { ...current, ...updates }
                                    setLobbiesConfig(newLobbies)
                                }

                                // Determinar el tipo para el select
                                const typeValue = Array.isArray(lobbyObj.type)
                                    ? 'divisions'
                                    : lobbyObj.type

                                return (
                                    <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative group shadow-lg hover:border-orange-500/50 transition-all">
                                        {/* Botón Eliminar */}
                                        <button
                                            onClick={() => handleDeleteLobby(index)}
                                            className="absolute top-3 right-3 text-red-400 hover:bg-red-500/20 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg"
                                            title="Eliminar este lobby"
                                        >
                                            <span className="text-lg">🗑️</span>
                                        </button>

                                        <div className="space-y-4 pr-8">
                                            {/* Nombre del Lobby */}
                                            <div>
                                                <label className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2">
                                                    <span>🏠</span>
                                                    <span>Nombre del Lobby</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={lobbyObj.name}
                                                    onChange={(e) => updateLobby({ name: e.target.value })}
                                                    className="bg-gray-900/70 text-lg font-bold text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none w-full transition-colors"
                                                    placeholder="Ej: Russia, Spain, Training..."
                                                />
                                            </div>

                                            {/* Tipo de Lobby */}
                                            <div>
                                                <label className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider mb-2">
                                                    <span>🎯</span>
                                                    <span>Tipo de Acceso</span>
                                                </label>
                                                <select
                                                    value={typeValue}
                                                    onChange={(e) => {
                                                        const val = e.target.value
                                                        if (val === 'divisions') {
                                                            updateLobby({ type: ['A'] })
                                                        } else {
                                                            updateLobby({ type: val })
                                                        }
                                                    }}
                                                    className="bg-gray-900/70 text-sm text-white border border-gray-600 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none w-full transition-colors"
                                                >
                                                    <option value="open">🌍 Open - Abierto para todos</option>
                                                    <option value="noStats">🎮 NoStats - Sin estadísticas</option>
                                                    <option value="divisions">🏆 Por Divisiones - Solo ciertos rangos</option>
                                                </select>

                                                {/* Input para divisiones si está seleccionado */}
                                                {typeValue === 'divisions' && (
                                                    <div className="mt-2">
                                                        <input
                                                            type="text"
                                                            value={Array.isArray(lobbyObj.type) ? lobbyObj.type.join(', ') : 'A'}
                                                            onChange={(e) => {
                                                                const val = e.target.value.trim()
                                                                const divisions = val.split(',').map(s => s.trim()).filter(s => s)
                                                                updateLobby({ type: divisions.length > 0 ? divisions : ['A'] })
                                                            }}
                                                            className="bg-gray-900/70 text-xs text-gray-300 border border-gray-600 rounded px-2 py-1.5 focus:border-orange-500 outline-none w-full font-mono"
                                                            placeholder="A, 3B, 3A, 2, 1"
                                                        />
                                                        <p className="text-[10px] text-gray-500 mt-1">Divisiones permitidas (separadas por comas)</p>
                                                    </div>
                                                )}

                                                {/* Descripción del tipo seleccionado */}
                                                <div className="mt-2 text-[11px] text-gray-500 bg-gray-900/50 p-2 rounded">
                                                    {typeValue === 'open' && '✓ Cualquier jugador puede entrar sin restricciones'}
                                                    {typeValue === 'noStats' && '✓ Ideal para práctica - Los partidos no afectan el ranking'}
                                                    {typeValue === 'divisions' && '✓ Solo jugadores de las divisiones especificadas pueden entrar'}
                                                </div>
                                            </div>

                                            {/* Opciones Avanzadas */}
                                            <div className="pt-3 border-t border-gray-700/50 space-y-3">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">⚙️ Opciones Avanzadas</p>

                                                <label className="flex items-start gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors group/option">
                                                    <input
                                                        type="checkbox"
                                                        checked={lobbyObj.showMatches !== false}
                                                        onChange={(e) => updateLobby({ showMatches: e.target.checked })}
                                                        className="mt-0.5 rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-800"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="text-sm text-gray-300 font-medium block">Mostrar Partidos</span>
                                                        <span className="text-xs text-gray-500">Los partidos aparecen en la lista pública del servidor</span>
                                                    </div>
                                                </label>

                                                <label className="flex items-start gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors group/option">
                                                    <input
                                                        type="checkbox"
                                                        checked={lobbyObj.checkRosterHash !== false}
                                                        onChange={(e) => updateLobby({ checkRosterHash: e.target.checked })}
                                                        className="mt-0.5 rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-800"
                                                    />
                                                    <div className="flex-1">
                                                        <span className="text-sm text-gray-300 font-medium block">Verificar Roster</span>
                                                        <span className="text-xs text-gray-500">Todos deben tener el mismo option file para jugar</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Mensaje si no hay lobbies */}
                        {lobbiesConfig.length === 0 && (
                            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
                                <div className="text-6xl mb-4">🏠</div>
                                <h3 className="text-xl font-bold text-white mb-2">No hay lobbies configurados</h3>
                                <p className="text-gray-400 mb-4">Agrega tu primer lobby para que los jugadores puedan conectarse</p>
                                <button
                                    onClick={() => {
                                        setLobbiesConfig([{ name: 'Lobby Principal', type: 'open', showMatches: true, checkRosterHash: true }])
                                    }}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg inline-flex items-center gap-2"
                                >
                                    <span>➕</span> Crear Primer Lobby
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* GESTIÓN DE USUARIOS */}
                {activeSection === 'usuarios' && (
                    <div>
                        <div className="mb-6 flex gap-4">
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Buscar usuario..."
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                    className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-orange-500 outline-none"
                                />
                            </div>
                            <select className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 outline-none focus:border-orange-500">
                                <option value="username">Username</option>
                                <option value="serial">Serial</option>
                                <option value="ip">IP</option>
                            </select>
                        </div>

                        <div className="bg-gray-800 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuario</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.username} className="hover:bg-white/5">
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{user.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${user.locked ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                                    }`}>
                                                    {user.locked ? '🔒 Bloqueado' : '✓ Activo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                                {!user.locked && (
                                                    <button
                                                        onClick={() => handleLockUser(user.username)}
                                                        className="text-yellow-400 hover:text-yellow-300 text-sm"
                                                    >
                                                        Bloquear
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteUser(user.username)}
                                                    className="text-red-400 hover:text-red-300 text-sm ml-2"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex justify-between items-center text-white">
                            <div>
                                Mostrando {currentPage * USERS_PER_PAGE + 1} - {Math.min((currentPage + 1) * USERS_PER_PAGE, totalUsers)} de {totalUsers} usuarios
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                    disabled={currentPage === 0}
                                    className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={currentPage >= totalPages - 1}
                                    className="px-4 py-2 bg-gray-800 rounded disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* GESTIÓN DE BANEOS */}
                {activeSection === 'baneos' && (
                    <div>
                        <div className="bg-gray-800 rounded-xl p-6 mb-6">
                            <h3 className="text-xl font-bold text-white mb-4">Agregar Baneo</h3>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={newBanEntry}
                                    onChange={(e) => setNewBanEntry(e.target.value)}
                                    placeholder="IP, rango CIDR o prefijo (ej: 192.168.1.1 o 192.168.)"
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                                />
                                <button
                                    onClick={handleAddBan}
                                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    Agregar
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm mt-2">
                                Ejemplos: 192.168.1.100 (IP específica) | 192.168.1.0/24 (rango CIDR) | 192.168. (prefijo)
                            </p>
                        </div>

                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Buscar en baneos..."
                                value={banSearchTerm}
                                onChange={(e) => setBanSearchTerm(e.target.value)}
                                className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                            />
                        </div>

                        <div className="bg-gray-800 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4">Lista de Baneados ({filteredBanned.length})</h3>
                            <div className="space-y-2">
                                {filteredBanned.map((entry, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                                        <span className="text-white font-mono">{entry}</span>
                                        <button
                                            onClick={() => handleRemoveBan(entry)}
                                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                                {filteredBanned.length === 0 && <p className="text-gray-400">No hay usuarios baneados.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* CONFIGURACIÓN */}
                {activeSection === 'configuracion' && (
                    <div className="bg-gray-800 rounded-xl p-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-white font-medium mb-2">
                                    Límite de Usuarios (1-1000)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={config.maxUsers}
                                    onChange={(e) => {
                                        setConfig({ ...config, maxUsers: parseInt(e.target.value) || 0 })
                                        setConfigChanged(true)
                                    }}
                                    className="w-full max-w-xs bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.debug}
                                        onChange={(e) => {
                                            setConfig({ ...config, debug: e.target.checked })
                                            setConfigChanged(true)
                                        }}
                                        className="w-5 h-5"
                                    />
                                    <div>
                                        <div className="text-white font-medium">Modo Debug</div>
                                        <div className="text-gray-400 text-sm">Activa logs detallados del servidor</div>
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.storeSettings}
                                        onChange={(e) => {
                                            setConfig({ ...config, storeSettings: e.target.checked })
                                            setConfigChanged(true)
                                        }}
                                        className="w-5 h-5"
                                    />
                                    <div>
                                        <div className="text-white font-medium">Store Settings</div>
                                        <div className="text-gray-400 text-sm">Permite a los jugadores guardar sus configuraciones</div>
                                    </div>
                                </label>
                            </div>

                            <div className="border-t border-gray-700 pt-6 mt-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span>👋</span> Mensaje de Bienvenida
                                </h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Nombre del Servidor</label>
                                        <input
                                            type="text"
                                            value={serverName}
                                            onChange={e => setServerName(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                                            placeholder="Ej: Fiveserver"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Mensaje de Bienvenida</label>
                                        <textarea
                                            rows={4}
                                            value={greetingText}
                                            onChange={e => setGreetingText(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none resize-none"
                                            placeholder="Ej: Bienvenido al servidor..."
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Usa \n para saltos de línea.
                                        </p>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveGreeting}
                                            disabled={isSavingGreeting}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
                                        >
                                            {isSavingGreeting ? 'Guardando...' : 'Guardar Mensaje'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-700">
                                <button
                                    onClick={handleSaveConfig}
                                    disabled={!configChanged}
                                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {configChanged ? 'Guardar Cambios' : 'Sin Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* LOGS */}
                {activeSection === 'logs' && (
                    <div className="bg-gray-800 rounded-xl p-6">
                        <div className="bg-black/50 rounded-lg p-4 font-mono text-sm h-[80vh] overflow-y-auto border border-gray-700">
                            {logs.map((log, idx) => (
                                <div key={idx} className="text-gray-300 border-b border-gray-800 py-1 hover:bg-white/5 px-2">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Admin
