import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { MessageSquare, User, ShieldAlert, LogOut, ChevronDown } from 'lucide-react'

// Lista temporal de admins (hasta que el backend lo proporcione)
const ADMIN_USERNAMES = ['admin', 'juce', 'reddwarf']

function Header() {
    const { isUserAuthenticated, user, userCountry, logout } = useAuth()
    const location = useLocation()
    const path = location.pathname
    const [showProfileMenu, setShowProfileMenu] = useState(false)

    // Determinar si el usuario es admin
    const isAdmin = user ? ADMIN_USERNAMES.includes(user.username.toLowerCase()) : false

    return (
        <nav className="bg-gray-800 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo-lmc.png" alt="LMC Logo" className="h-12 w-auto object-contain" />
                            <span className="text-white font-bold text-xl ml-2">La mano de Castolo</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-6">
                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-baseline space-x-4">
                            <Link
                                to="/"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${path === '/' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                Inicio
                            </Link>
                            <Link
                                to="/server"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${path === '/server' ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white border-b-2 border-orange-500/50'
                                    }`}
                            >
                                Vestuario
                            </Link>
                            <Link
                                to="/downloads"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${path === '/downloads' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                Descargas
                            </Link>
                        </div>

                        {/* User Profile or Auth Buttons */}
                        <div className="flex items-center gap-4">
                            {isUserAuthenticated && user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isAdmin
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 ring-2 ring-red-500/50'
                                            : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${isAdmin ? 'bg-red-500 ring-2 ring-red-300' : 'bg-orange-500'
                                            }`}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Username with country flag */}
                                        <div className="flex items-center gap-2">
                                            {userCountry && (
                                                <img
                                                    src={`https://flagcdn.com/w20/${userCountry.toLowerCase()}.png`}
                                                    alt={userCountry}
                                                    className="w-5 h-4"
                                                />
                                            )}
                                            <span className="text-white font-medium">{user.username}</span>
                                            {isAdmin && (
                                                <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                                            )}
                                        </div>

                                        <ChevronDown size={16} className="text-gray-300" />
                                    </button>

                                    {showProfileMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setShowProfileMenu(false)}
                                            ></div>
                                            <div className="absolute right-0 mt-2 w-56 bg-gray-700 rounded-lg shadow-2xl z-20 border border-gray-600 overflow-hidden">
                                                {/* Lobbies / Vestuario */}
                                                <Link
                                                    to="/server"
                                                    className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-600 transition-colors"
                                                    onClick={() => setShowProfileMenu(false)}
                                                >
                                                    <MessageSquare size={18} className="text-orange-400" />
                                                    <span>Lobbies</span>
                                                </Link>

                                                {/* Mi Cuenta */}
                                                <Link
                                                    to="/account"
                                                    className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-600 transition-colors"
                                                    onClick={() => setShowProfileMenu(false)}
                                                >
                                                    <User size={18} className="text-blue-400" />
                                                    <span>Mi Cuenta</span>
                                                </Link>

                                                {/* Panel Admin (solo si es admin) */}
                                                {isAdmin && (
                                                    <Link
                                                        to="/admin"
                                                        className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-gray-600 transition-colors border-t border-gray-600"
                                                        onClick={() => setShowProfileMenu(false)}
                                                    >
                                                        <ShieldAlert size={18} className="text-red-400" />
                                                        <span className="font-semibold">Panel Admin</span>
                                                    </Link>
                                                )}

                                                {/* Cerrar Sesión */}
                                                <button
                                                    onClick={() => {
                                                        logout()
                                                        setShowProfileMenu(false)
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-600 transition-colors border-t border-gray-600"
                                                >
                                                    <LogOut size={18} />
                                                    <span>Cerrar Sesión</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                /* Auth Buttons cuando NO está logueado */
                                <div className="flex items-center gap-3">
                                    <Link
                                        to="/auth"
                                        className="text-gray-300 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Iniciar Sesión
                                    </Link>
                                    <Link
                                        to="/auth"
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        Registrarse
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Header
