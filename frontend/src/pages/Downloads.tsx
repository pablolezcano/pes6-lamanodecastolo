import { Download, Monitor, HardDrive, FileText } from 'lucide-react';

const DOWNLOADS = [
    {
        category: 'CLIENT',
        title: 'PES6 Full Client Installer',
        description: 'Cliente completo del juego listo para instalar y jugar. Incluye todos los archivos necesarios.',
        version: 'v2.0.1',
        size: '1.8 GB',
        icon: Monitor
    },
    {
        category: 'PATCH',
        title: 'Parche de Actualización 2024',
        description: 'Actualiza tu juego con los últimos equipos, plantillas y gráficos de la temporada 2024.',
        version: 'v4.5',
        size: '450 MB',
        icon: HardDrive
    },
    {
        category: 'TOOLS',
        title: 'Online Fix / Hosts',
        description: 'Archivo necesario para conectarte a nuestros servidores. Imprescindible para el juego online.',
        version: 'v1.0',
        size: '2 KB',
        icon: FileText
    }
];

function Downloads() {
    return (
        <div className="bg-gray-900 text-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                
                {/* Encabezado (Hero) */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                        Centro de <span className="text-orange-500">Descargas</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                        Todo lo que necesitas para unirte a la comunidad y empezar a jugar. Descarga el cliente, parches y herramientas.
                    </p>
                </div>

                {/* Grid de Recursos (Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {DOWNLOADS.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col
                                                       transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/10">
                                <div className="p-6 flex-grow">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Icon className="w-8 h-8 text-orange-500" />
                                        <span className="bg-orange-500/10 text-orange-400 text-xs font-bold uppercase px-3 py-1 rounded-full">{item.category}</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4 flex-grow">{item.description}</p>
                                </div>
                                
                                <div className="bg-gray-800/50 px-6 py-4 border-t border-gray-700 mt-auto">
                                    <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                                        <span>Versión: {item.version}</span>
                                        <span>Tamaño: {item.size}</span>
                                    </div>
                                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                        <Download size={18} />
                                        Descargar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sección de Guía de Instalación */}
                <div className="mt-20 bg-gray-800/50 border border-gray-700 rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-center mb-8">Instrucciones Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {/* Paso 1 */}
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-orange-500 border-2 border-orange-500 mb-4">1</div>
                            <h3 className="font-semibold mb-2">Descargar Cliente</h3>
                            <p className="text-sm text-gray-400">Obtén el instalador completo del juego desde nuestro centro de descargas.</p>
                        </div>
                        {/* Paso 2 */}
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-orange-500 border-2 border-orange-500 mb-4">2</div>
                            <h3 className="font-semibold mb-2">Instalar Hosts</h3>
                            <p className="text-sm text-gray-400">Añade nuestro archivo de hosts para poder conectarte a los servidores online.</p>
                        </div>
                        {/* Paso 3 */}
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-orange-500 border-2 border-orange-500 mb-4">3</div>
                            <h3 className="font-semibold mb-2">Crear Cuenta</h3>
                            <p className="text-sm text-gray-400">Regístrate en nuestra web para obtener tu usuario y contraseña de acceso.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Downloads;
