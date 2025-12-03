import { Link } from 'react-router-dom'

function Footer() {
    return (
        <footer className="bg-gray-800 border-t border-gray-700">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">La mano de Castolo</h3>
                        <p className="text-gray-400 text-sm">
                            Servidor dedicado de PES6 Online con comunidad activa, rankings y estadísticas en tiempo real.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Enlaces Rápidos</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link to="/server" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Servidor
                                </Link>
                            </li>
                            <li>
                                <Link to="/downloads" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Descargas
                                </Link>
                            </li>
                            <li>
                                <Link to="/auth" className="text-gray-400 hover:text-white text-sm transition-colors">
                                    Registrarse
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact/Social */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-4">Comunidad</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Únete a nuestra comunidad y juega con los mejores.
                        </p>
                        <Link
                            to="/auth"
                            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-all"
                        >
                            Registrarse Gratis
                        </Link>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700 mt-8 pt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} La mano de Castolo. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
