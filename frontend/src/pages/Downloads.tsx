
import { Download, Monitor, User, Users, Gamepad2, CheckCircle2 } from 'lucide-react';

const Downloads = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6 overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 animate-slide-in">
        {/* Sección Hero */}
        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            Centro de <span className="text-orange-500">DESCARGAS</span>
          </h1>
          <p className="text-xl text-gray-400 font-light tracking-wide">
            La versión definitiva de PES6 está aquí.
          </p>
        </div>

        {/* Tarjeta Principal */}
        <div className="bg-gray-800 rounded-[2.5rem] border border-gray-700/50 shadow-2xl shadow-black/50 overflow-hidden max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2">

          {/* Columna Izquierda (Información y Acción) */}
          <div className="p-8 lg:p-12 flex flex-col justify-center space-y-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Branding */}
            <div className="flex items-center gap-3 text-orange-500 mb-2 relative z-10">
              <Monitor className="w-6 h-6" />
              <span className="font-bold tracking-wider text-sm uppercase">LA MANO DE CASTOLO - Client Edition</span>
            </div>

            {/* Título Principal */}
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                El regreso de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400 italic">Leyenda</span>
              </h2>
            </div>

            {/* Bullets */}
            <ul className="space-y-4 relative z-10">
              {[
                "Cliente exclusivo para jugar y optimizado para jugar al servidor de La Mano de Castolo.",
                "Cliente completo del juego listo para instalar y jugar. Incluye todos los archivos necesarios y voces en español.",
                "Equipos, jugadores y camisetas actualizadas de la temporada 2025/2026."
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-300">
                  <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-base leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            {/* Botones de Descarga */}
            <div className="grid grid-cols-1 gap-4 pt-4 relative z-10">
              {/* Mediafire Button */}
              <button className="group relative w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-600/25 flex items-center justify-between overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    {/* Simple Mediafire Flame Logo Representation */}
                    <svg className="w-6 h-6 text-white text-fill-current" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 7c-1.5 0-3.5 1.5-3.5 1.5s-1-3.5-4-3.5c-4 0-6 5-6 8 0 4.5 3.5 7.5 7 7.5 6 0 9-4.5 9-9 0-2.5-1-4.5-2.5-4.5z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs opacity-80 font-bold tracking-wider">SERVIDOR 1</span>
                    <span className="font-bold text-lg">DESCARGAR POR MEDIAFIRE</span>
                  </div>
                </div>
                <Download className="w-6 h-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
              </button>

              {/* Dropbox Button */}
              <button className="group relative w-full bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-600/25 flex items-center justify-between overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    {/* Simple Dropbox Box Logo Representation */}
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 3l-5 4 5 4 5-4-5-4zm10 0l-5 4 5 4 5-4-5-4zm-10 10l-5 4 5 4 5-4-5-4zm10 0l-5 4 5 4 5-4-5-4zm-5 4.5l-5-3.8-2 1.6 7 5.7 7-5.7-2-1.6-5 3.8z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs opacity-80 font-bold tracking-wider">SERVIDOR 2</span>
                    <span className="font-bold text-lg">DESCARGAR POR DROPBOX</span>
                  </div>
                </div>
                <Download className="w-6 h-6 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
              </button>
            </div>
          </div>

          {/* Columna Derecha (Especificaciones Técnicas) */}
          <div className="bg-gray-800/50 p-8 lg:p-12 border-t lg:border-t-0 lg:border-l border-gray-700 flex flex-col justify-between backdrop-blur-sm">

            {/* Compatibilidad */}
            <div className="mb-10">
              <div className="flex items-center gap-4 bg-gray-700/30 p-4 rounded-2xl border border-gray-600/50">
                {/* Windows Logo */}
                <svg className="w-8 h-8 text-blue-400" viewBox="0 0 88 88" fill="currentColor">
                  <path d="M0 12.402l35.687-4.86.016 34.423-35.67.212v-29.775zM35.703 45.474l-.013 34.05-35.69 4.885v-29.789l35.703-9.146zM39.697 6.138l48.303-6.57v38.935l-48.29-.168-.013-32.197zM39.71 45.474l48.29 9.17-.003 39.462-48.287-6.617v-42.015z" />
                </svg>
                <div>
                  <h3 className="font-bold text-white">Compatible con Windows</h3>
                  <p className="text-sm text-gray-400">Windows 10 / 11 (64-bit)</p>
                </div>
              </div>
            </div>

            {/* Tabla de Modos de Juego */}
            <div className="mb-10">
              <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Modos de Juego Soportados</h4>
              <div className="space-y-1">
                {[
                  { icon: User, label: "Un jugador", checked: true },
                  { icon: Users, label: "JcJ en línea", checked: true },
                  { icon: Gamepad2, label: "JcJ en pantalla dividida/compartida", checked: true },
                  { icon: Users, label: "Cooperativos en línea", checked: true },
                  { icon: Gamepad2, label: "Cooperativos en pantalla dividida/compartida", checked: true }
                ].map((mode, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/40 transition-colors group">
                    <div className="flex items-center gap-3">
                      <mode.icon className="w-5 h-5 text-gray-500 group-hover:text-orange-500 transition-colors" />
                      <span className="text-gray-300 font-medium">{mode.label}</span>
                    </div>
                    {mode.checked && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Datos Técnicos y Badges */}
            <div className="mt-auto">
              <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-700/50">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1 font-mono uppercase">Versión</span>
                  <span className="bg-gray-700/50 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-md font-mono text-sm inline-block">2026 v0.1</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1 font-mono uppercase">Tamaño en Disco</span>
                  <span className="bg-gray-700/50 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-md font-mono text-sm inline-block">1.2 GB</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Sección Inferior (Instrucciones) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto">
          {[
            { step: "01", title: "Descargar y Descomprimir", desc: "Baja el archivo .rar y extraelo en tu carpeta de preferencia." },
            { step: "02", title: "Instalar y Configurar", desc: "Ejecuta el instalador y configura el kitserver según tu PC." },
            { step: "03", title: "Jugar Online", desc: "Abre el juego, ingresa tu serial y logueate para competir." }
          ].map((card, idx) => (
            <div key={idx} className="bg-gray-800 rounded-3xl p-6 border border-gray-700/50 hover:border-orange-500/30 transition-all hover:bg-gray-800/80 group">
              <div className="text-4xl font-black text-gray-700 group-hover:text-orange-500/20 mb-4 transition-colors font-mono">{card.step}</div>
              <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Downloads;
