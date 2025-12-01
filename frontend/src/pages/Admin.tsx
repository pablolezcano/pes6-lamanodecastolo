import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const authConfig = {
                    headers: {
                        'Authorization': token,
                        'Accept': 'application/json'
                    }
                }

                const [statsRes, onlineRes, bannedRes, logsRes, psRes, announcementsRes, lobbiesRes] = await Promise.all([
                    axios.get('/api/admin', authConfig),
                    axios.get('/api/admin/users', authConfig),
                    axios.get('/api/admin/banned', authConfig),
                    axios.get('/api/admin/log', authConfig),
                    axios.get('/api/ps', { headers: { 'Accept': 'application/json' } }),
                    axios.get('/api/admin/announcements', { headers: { 'Authorization': token } }),
                    axios.get('/api/admin/lobbies', { headers: { 'Authorization': token } })
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

    const handleAddLobby = () => {
        const name = prompt('Nombre del nuevo Lobby:')
        if (name) {
            setLobbiesConfig([...lobbiesConfig, name])
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

                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <span>🚪</span>
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
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

                        {/* GRÁFICOS Y ALERTAS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Gráfico de Actividad */}
                            <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
                                <h3 className="text-white font-bold mb-6">Actividad de Jugadores (24h)</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={[
                                            { time: '00:00', users: 12 }, { time: '04:00', users: 5 },
                                            { time: '08:00', users: 8 }, { time: '12:00', users: 45 },
                                            { time: '16:00', users: 89 }, { time: '20:00', users: 120 },
                                            { time: '23:59', users: 65 }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="time" stroke="#9CA3AF" />
                                            <YAxis stroke="#9CA3AF" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }}
                                                itemStyle={{ color: '#F97316' }}
                                            />
                                            <Line type="monotone" dataKey="users" stroke="#F97316" strokeWidth={3} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Panel de Alertas */}
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-white font-bold">Alertas del Sistema</h3>
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">3 Nuevas</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-red-400 font-bold text-sm">CPU Crítico</span>
                                            <span className="text-gray-500 text-xs">Hace 5m</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">Uso de CPU superó el 90%</p>
                                    </div>
                                    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 rounded-r-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-yellow-400 font-bold text-sm">Latencia Alta</span>
                                            <span className="text-gray-500 text-xs">Hace 15m</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">Ping promedio &gt; 150ms</p>
                                    </div>
                                    <div className="bg-blue-500/10 border-l-4 border-blue-500 p-3 rounded-r-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-blue-400 font-bold text-sm">Nuevo Admin</span>
                                            <span className="text-gray-500 text-xs">Hace 1h</span>
                                        </div>
                                        <p className="text-gray-300 text-sm">Usuario 'admin2' registrado</p>
                                    </div>
                                </div>
                                <button className="w-full mt-4 text-center text-gray-400 text-sm hover:text-white transition-colors">
                                    Ver todas las alertas
                                </button>
                            </div>
                        </div>

                        {/* Server Health Card */}
                        <div className="bg-gradient-to-br from-green-900/30 to-gray-800 border border-green-500/30 rounded-xl p-6 mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl">💚</span>
                                    Salud del Servidor
                                </h3>
                                <div className="text-xs text-green-400">
                                    Actualizado en tiempo real
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Uptime */}
                                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                    <div className="text-gray-400 text-xs font-medium mb-2">⏰ UPTIME</div>
                                    <div className="text-2xl font-bold text-green-400 mb-1">
                                        {processInfo?.uptime.up || '...'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Desde: {processInfo?.uptime.since ? new Date(processInfo.uptime.since).toLocaleString('es-AR') : '...'}
                                    </div>
                                </div>

                                {/* CPU */}
                                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                    <div className="text-gray-400 text-xs font-medium mb-2">🖥️ CPU</div>
                                    <div className="text-2xl font-bold text-blue-400 mb-1">
                                        {processInfo?.stats.cpu.toFixed(1) || '0.0'}%
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(processInfo?.stats.cpu || 0, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Memory */}
                                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                    <div className="text-gray-400 text-xs font-medium mb-2">💾 MEMORIA</div>
                                    <div className="text-2xl font-bold text-purple-400 mb-1">
                                        {processInfo?.stats.mem.toFixed(1) || '0.0'} MB
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        PID: {processInfo?.pid || '...'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4">Actividad Reciente (Logs)</h3>
                            <div className="bg-black/50 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto border border-gray-700">
                                {logs.map((log, idx) => (
                                    <div key={idx} className="text-gray-300 border-b border-gray-800 py-1 hover:bg-white/5 px-2">
                                        {log}
                                    </div>
                                ))}
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
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Gestión de Lobbies</h2>
                                <p className="text-gray-400 text-sm">Edita la configuración de salas. Requiere reinicio.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddLobby}
                                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                                >
                                    <span>➕</span> Agregar
                                </button>
                                <button
                                    onClick={handleSaveLobbies}
                                    disabled={isSavingLobbies}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    <span>💾</span> {isSavingLobbies ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lobbiesConfig.map((lobby, index) => {
                                const isSimple = typeof lobby === 'string'
                                const name = isSimple ? (lobby as string) : (lobby as any).name
                                const type = isSimple ? 'open' : ((lobby as any).type || 'open')

                                return (
                                    <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 relative group">
                                        <button
                                            onClick={() => handleDeleteLobby(index)}
                                            className="absolute top-4 right-4 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            🗑️
                                        </button>

                                        <div className="mb-4">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nombre</div>
                                            {isSimple ? (
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => {
                                                        const newLobbies = [...lobbiesConfig]
                                                        newLobbies[index] = e.target.value
                                                        setLobbiesConfig(newLobbies)
                                                    }}
                                                    className="bg-transparent text-xl font-bold text-white border-b border-gray-700 focus:border-orange-500 outline-none w-full"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => {
                                                        const newLobbies = [...lobbiesConfig]
                                                        newLobbies[index] = { ...(lobby as any), name: e.target.value }
                                                        setLobbiesConfig(newLobbies)
                                                    }}
                                                    className="bg-transparent text-xl font-bold text-white border-b border-gray-700 focus:border-orange-500 outline-none w-full"
                                                />
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tipo</div>
                                                <div className="text-gray-300 bg-gray-900/50 px-3 py-1 rounded text-sm font-mono">
                                                    {JSON.stringify(type)}
                                                </div>
                                            </div>
                                            {!isSimple && (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={(lobby as any).showMatches !== false}
                                                        onChange={(e) => {
                                                            const newLobbies = [...lobbiesConfig]
                                                            newLobbies[index] = { ...(lobby as any), showMatches: e.target.checked }
                                                            setLobbiesConfig(newLobbies)
                                                        }}
                                                        className="rounded bg-gray-700 border-gray-600 text-orange-500"
                                                    />
                                                    <span className="text-sm text-gray-400">Mostrar Partidos</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
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
