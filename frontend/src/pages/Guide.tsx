
import { Download, UserPlus, KeyRound, Gamepad2, ArrowRight, Check, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import redMenuImg from '../assets/guide/step3-red.png';
import loginFieldImg from '../assets/guide/step3-login.png';

const Guide = () => {
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-orange-500/30">

            {/* Hero Header */}
            <div className="max-w-3xl mx-auto pt-16 pb-12 px-6 text-center">
                <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-4 text-white">
                    Guía de <span className="text-orange-500">Inicio</span>
                </h1>
                <p className="text-xl text-gray-400 font-medium max-w-lg mx-auto leading-relaxed">
                    Sigue estos <span className="text-orange-400 font-bold">4 pasos sencillos</span> para unirte a la comunidad definitiva de PES 6.
                </p>
            </div>

            <div className="max-w-2xl mx-auto px-6 pb-24 space-y-8">

                {/* PASO 01: DESCARGA */}
                <div className="group relative bg-gray-900 rounded-[2rem] p-8 border border-gray-800 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 shadow-2xl hover:shadow-orange-900/10">
                    <div className="absolute -top-6 left-8 bg-gray-950 px-4 py-2 rounded-xl border border-gray-800 shadow-xl group-hover:border-orange-500/50 transition-colors">
                        <span className="text-orange-500 font-black italic text-xl">PASO 01</span>
                    </div>

                    <div className="mt-4 flex flex-col md:flex-row gap-8 items-start">
                        <div className="p-4 bg-gray-800 rounded-2xl text-orange-400 shrink-0">
                            <Download size={40} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black italic uppercase mb-4">Descarga el Juego</h2>
                            <ul className="space-y-3 mb-6">
                                {['Cliente Exclusivo LMC', 'Voces y Textos en Español', 'Listo para Jugar (Portable)'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-400 text-sm font-medium">
                                        <div className="bg-green-500/10 p-1 rounded-full"><Check size={12} className="text-green-500" /></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <Link to="/downloads" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-colors shadow-lg shadow-orange-600/20">
                                Ir a Descargas <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* PASO 02: REGISTRO */}
                <div className="group relative bg-gray-900 rounded-[2rem] p-8 border border-gray-800 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 shadow-2xl hover:shadow-orange-900/10">
                    <div className="absolute -top-6 left-8 bg-gray-950 px-4 py-2 rounded-xl border border-gray-800 shadow-xl group-hover:border-orange-500/50 transition-colors">
                        <span className="text-orange-500 font-black italic text-xl">PASO 02</span>
                    </div>

                    <div className="mt-4 flex flex-col md:flex-row gap-8 items-start">
                        <div className="p-4 bg-gray-800 rounded-2xl text-blue-400 shrink-0">
                            <UserPlus size={40} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black italic uppercase mb-2">Crea tu Cuenta</h2>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                Necesitarás una cuenta para acceder al servidor. El registro es rápido y gratuito.
                            </p>

                            <div className="bg-gray-950 rounded-xl p-4 border border-gray-800 mb-6">
                                <div className="flex items-start gap-3">
                                    <KeyRound className="text-yellow-500 shrink-0 mt-1" size={20} />
                                    <div>
                                        <h3 className="font-bold text-gray-200 text-sm uppercase mb-1">Nota Importante sobre el Serial</h3>
                                        <p className="text-xs text-gray-500">
                                            Al registrarte e ingresar tu serial, hazlo <span className="text-white font-bold underline decoration-orange-500 decoration-2">SIN GUIONES</span>.
                                            Ejemplo: <span className="font-mono text-orange-400 bg-orange-900/20 px-1 rounded">VNRCAVN5MTWXADT6FKEC</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Link to="/auth" className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-colors border border-gray-700">
                                Registrarse Ahora
                            </Link>
                        </div>
                    </div>
                </div>

                {/* PASO 03: EL TRUCO (DESTACADO) */}
                <div className="group relative bg-gradient-to-tr from-gray-900 to-gray-800 rounded-[2rem] p-8 border-2 border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:-translate-y-1 shadow-[0_0_40px_-10px_rgba(234,88,12,0.15)]">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-600 px-6 py-2 rounded-xl shadow-xl shadow-orange-600/30">
                        <span className="text-white font-black italic text-xl tracking-widest">⚠️ PASO 03: CRÍTICO</span>
                    </div>

                    <div className="mt-8 text-center mb-8">
                        <h2 className="text-3xl font-black italic uppercase mb-3"><span className="text-orange-500">Cómo</span> Loguearse</h2>
                        <p className="text-gray-400 max-w-md mx-auto">
                            El sistema de login es único. Sigue este patrón visual para no tener errores de conexión.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Step 3.1 */}
                        <div className="bg-gray-950/50 rounded-2xl p-4 border border-gray-800">
                            <div className="flex items-center gap-3 mb-3 pl-2">
                                <span className="bg-orange-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black">A</span>
                                <span className="font-bold text-gray-300 text-sm uppercase">Entrar al menú RED</span>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-gray-700 shadow-2xl relative group-hover:scale-[1.02] transition-transform duration-500">
                                <img src={redMenuImg} alt="Menú Red" className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        {/* Step 3.2 */}
                        <div className="bg-gray-950/50 rounded-2xl p-4 border border-gray-800">
                            <div className="flex items-center gap-3 mb-3 pl-2">
                                <span className="bg-orange-500 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black">B</span>
                                <span className="font-bold text-gray-300 text-sm uppercase">El campo Contraseña</span>
                            </div>

                            <div className="rounded-xl overflow-hidden border border-gray-700 shadow-2xl relative mb-4 group-hover:scale-[1.02] transition-transform duration-500">
                                <img src={loginFieldImg} alt="Login Field" className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity" />

                                {/* Overlay Highlight */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-6">
                                    <div className="text-center">
                                        <p className="text-orange-400 font-black text-lg md:text-xl uppercase drop-shadow-md">
                                            USUARIO-CONTRASEÑA
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                                <p className="text-orange-300 text-xs md:text-sm font-medium text-center leading-relaxed">
                                    <span className="font-bold block mb-1">¡ATENCIÓN!</span>
                                    En el campo "Contraseña" debes escribir tu usuario, un guión y tu contraseña todo junto.
                                    <br />
                                    <span className="text-gray-400 font-mono mt-2 block bg-black/30 py-1 rounded">pablo-123456</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PASO 04: JUGAR */}
                <div className="group relative bg-gray-900 rounded-[2rem] p-8 border border-gray-800 hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 shadow-2xl hover:shadow-orange-900/10">
                    <div className="absolute -top-6 left-8 bg-gray-950 px-4 py-2 rounded-xl border border-gray-800 shadow-xl group-hover:border-orange-500/50 transition-colors">
                        <span className="text-orange-500 font-black italic text-xl">PASO 04</span>
                    </div>

                    <div className="mt-4 flex flex-col md:flex-row gap-8 items-start">
                        <div className="p-4 bg-gray-800 rounded-2xl text-green-500 shrink-0">
                            <Gamepad2 size={40} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black italic uppercase mb-3">Elige tu Lobby</h2>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                Una vez conectado, verás la lista de servidores. Elige el que mejor ping tenga para tu región y crea o únete a una sala de partido.
                            </p>
                            <Link to="/server" className="inline-flex items-center gap-2 bg-gray-950 hover:bg-black text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wide text-sm transition-colors border border-gray-800 hover:border-gray-600">
                                Ver Estado de Servidores
                            </Link>
                        </div>
                    </div>
                </div>

                {/* FOOTER DISCORD */}
                <div className="mt-16 text-center border-t border-gray-900 pt-12">
                    <p className="text-gray-500 mb-6 font-medium">¿Sigues teniendo problemas para entrar?</p>
                    <a
                        href="https://discord.gg/your-discord-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-wide transition-all transform hover:scale-105 shadow-xl shadow-[#5865F2]/20"
                    >
                        <MessageSquare size={24} fill="white" />
                        Soporte en Discord
                    </a>
                </div>

            </div>
        </div>
    );
};

export default Guide;
