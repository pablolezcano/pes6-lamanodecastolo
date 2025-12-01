import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RegisterForm from '../components/RegisterForm'

type TabType = 'login' | 'register'

function Auth() {
    const [activeTab, setActiveTab] = useState<TabType>('login')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { loginUser, isUserAuthenticated, user } = useAuth()
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const success = await loginUser(username, password)
        if (success) {
            navigate('/')
        } else {
            setError('Usuario o contraseña incorrectos')
        }
        setLoading(false)
    }

    const handleRegistrationSuccess = () => {
        // Switch to login tab after successful registration
        setActiveTab('login')
    }

    // If already logged in, redirect to home
    if (isUserAuthenticated && user) {
        navigate('/')
        return null
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-8">
            <div className="max-w-2xl w-full bg-gray-800 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
                {/* Tabs Header */}
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('login')}
                        className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${activeTab === 'login'
                            ? 'bg-gray-900 text-orange-500 border-b-2 border-orange-500'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-xl">🔑</span>
                            <span>Iniciar Sesión</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`flex-1 px-6 py-4 text-center font-semibold transition-all ${activeTab === 'register'
                            ? 'bg-gray-900 text-orange-500 border-b-2 border-orange-500'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-xl">⚽</span>
                            <span>Registrarse</span>
                        </div>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    {activeTab === 'login' ? (
                        <div>
                            <div className="text-center mb-8">
                                <div className="text-4xl mb-2">🔑</div>
                                <h2 className="text-2xl font-bold text-white">Iniciar Sesión</h2>
                                <p className="text-gray-400">Accede a tu cuenta de PES6</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-center text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">
                                        Nombre de Usuario
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        placeholder="Tu nombre de usuario"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-sm font-medium mb-2">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                                        placeholder="•••••"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                                >
                                    {loading ? 'Cargando...' : 'Ingresar'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div>
                            <div className="text-center mb-6">
                                <div className="text-4xl mb-2">⚽</div>
                                <h2 className="text-2xl font-bold text-white">Crear Cuenta</h2>
                                <p className="text-gray-400">Únete a la comunidad de PES6</p>
                            </div>

                            <RegisterForm onSuccess={handleRegistrationSuccess} />
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                            ← Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Auth
