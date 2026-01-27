import { useState, useEffect } from 'react'
import { md5 } from 'js-md5'
import { Cpu, Zap, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RegisterFormProps {
    onSuccess?: () => void
}

function RegisterForm({ onSuccess }: RegisterFormProps) {
    const [installType, setInstallType] = useState<'official' | 'manual'>('official');
    // Default official serial
    const OFFICIAL_SERIAL = 'VNRCAVN5MTWXADT6FKEC';

    const [serial, setSerial] = useState(OFFICIAL_SERIAL)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Reset serial when switching modes
    useEffect(() => {
        if (installType === 'official') {
            setSerial(OFFICIAL_SERIAL);
            setError('');
        } else {
            setSerial('');
        }
    }, [installType]);

    const handleSerialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (installType === 'official') return;

        // Regla de Oro: Limpieza en tiempo real (solo alfanuméricos, mayúsculas)
        const rawValue = e.target.value.toUpperCase();
        const cleanValue = rawValue.replace(/[^A-Z0-9]/g, '');

        if (cleanValue.length <= 20) {
            setSerial(cleanValue);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validaciones Finales
        let cleanSerial = serial;

        if (installType === 'manual') {
            // Asegurar limpieza final
            cleanSerial = cleanSerial.replace(/[^A-Z0-9]/g, '');
        }

        if (cleanSerial.length !== 20) {
            setError('El serial debe tener exactamente 20 caracteres.')
            setLoading(false)
            return
        }

        let cleanUsername = username.replace(/^\s+/, '').replace(/\s+$/, '')
        if (cleanUsername.length < 3 || !cleanUsername.match(/^[0-9a-zA-Z]+$/)) {
            setError('El usuario debe tener mínimo 3 caracteres (solo letras y números).')
            setLoading(false)
            return
        }

        if (password.length < 3) {
            setError('La contraseña debe tener mínimo 3 caracteres.')
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.')
            setLoading(false)
            return
        }

        try {
            // Calculate hash
            const hash = md5(cleanSerial + cleanUsername + '-' + password)

            // Get nonce from backend or generate one
            let nonce = ''
            try {
                const nonceRes = await fetch('/register')
                if (!nonceRes.ok) {
                    throw new Error('No se pudo conectar con el servidor')
                }
                const nonceHtml = await nonceRes.text()
                const nonceMatch = nonceHtml.match(/name="nonce"[^>]*value="([^"]+)"/)

                if (nonceMatch && nonceMatch[1]) {
                    nonce = nonceMatch[1]
                }
            } catch (e) {
                // If fetch fails, assume empty nonce (new user)
            }

            // Submit registration
            const formData = new URLSearchParams()
            formData.append('nonce', nonce)
            formData.append('hash', hash)
            formData.append('serial', cleanSerial)
            formData.append('user', cleanUsername)
            formData.append('format', 'html')

            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            })

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`)
            }

            const resultHtml = await response.text()

            // Check if registration was successful
            if (resultHtml.includes('Success') || resultHtml.includes('Usuario registrado') || (response.status === 200 && !resultHtml.includes('409') && !resultHtml.includes('400'))) {
                setSuccess(true)
                if (onSuccess) {
                    setTimeout(onSuccess, 2000)
                }
            } else if (resultHtml.includes('409') || resultHtml.includes('ya existe') || resultHtml.includes('Conflict')) {
                setError('Este usuario o serial ya está registrado.')
            } else if (resultHtml.includes('400') || resultHtml.includes('Invalid')) {
                setError('Datos inválidos. Por favor verifica los campos.')
            } else {
                setError('Error al registrar. Por favor intenta de nuevo.')
            }
        } catch (err: any) {
            console.error('Registration error:', err)
            setError(`Error de conexión: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center py-12 animate-slide-in">
                <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">¡BIENVENIDO AL JUEGO!</h3>
                <p className="text-gray-400 mb-6">Tu cuenta de La Mano de Castolo ha sido creada.</p>
                <div className="text-sm text-gray-500 animate-pulse">Redirigiendo al login...</div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto relative z-10">

            {/* Mensaje de Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-shake">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Selector de Instalación */}
            <div className="bg-gray-900/50 p-1.5 rounded-xl border border-gray-700/50 flex relative">
                <button
                    type="button"
                    onClick={() => setInstallType('official')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 relative z-10 ${installType === 'official'
                        ? 'text-white shadow-lg bg-gray-800 border border-gray-600'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Zap className={`w-4 h-4 ${installType === 'official' ? 'text-orange-500' : ''}`} />
                    INSTALADOR OFICIAL
                </button>
                <button
                    type="button"
                    onClick={() => setInstallType('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 relative z-10 ${installType === 'manual'
                        ? 'text-white shadow-lg bg-gray-800 border border-gray-600'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Cpu className={`w-4 h-4 ${installType === 'manual' ? 'text-blue-500' : ''}`} />
                    OTRO PARCHE
                </button>
            </div>

            {/* Campo Serial */}
            <div className="space-y-2">
                <div className="flex items-center justify-between pl-1 pr-1">
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                        Serial del Juego (20 caracteres)
                    </label>
                    {installType === 'official' && (
                        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-orange-400 tracking-wider animate-pulse">
                            <Shield className="w-3 h-3" /> VERIFICADO
                        </div>
                    )}
                </div>
                <div className="relative group">
                    <input
                        type="text"
                        value={serial}
                        onChange={handleSerialChange}
                        className={`w-full bg-gray-800/80 border rounded-xl px-4 py-4 text-white font-mono tracking-widest text-center transition-all focus:outline-none ${installType === 'official'
                            ? 'border-orange-500/30 text-orange-400 cursor-not-allowed select-none bg-orange-500/5'
                            : 'border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                            }`}
                        placeholder="XXXXXXXXXXXXXXXXXXXX"
                        disabled={installType === 'official'}
                        required
                    />
                </div>
                {installType === 'manual' ? (
                    <p className="text-xs text-blue-400 items-center gap-1 flex pl-1">
                        <AlertCircle className="w-3 h-3" />
                        Importante: Ingrese solo números y letras, sin guiones ni espacios.
                    </p>
                ) : (
                    <p className="text-xs text-gray-500 pl-1">Serial oficial autocompletado.</p>
                )}
            </div>

            {/* Campos de Usuario */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-1">
                        Usuario *
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-5 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                        placeholder="Tu nombre de usuario"
                        minLength={3}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-1">
                            Contraseña *
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-5 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                            placeholder="•••••"
                            minLength={3}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-widest pl-1">
                            Confirmar *
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-5 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors"
                            placeholder="•••••"
                            minLength={3}
                            required
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:-translate-y-0.5 shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4 uppercase tracking-wider flex items-center justify-center gap-2"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Procesando...
                    </span>
                ) : 'Crear Cuenta de Jugador'}
            </button>

            <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest opacity-60">
                Al registrarte aceptas las reglas de la comunidad
            </p>
        </form>
    )
}

export default RegisterForm
