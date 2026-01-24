import { useState } from 'react'
import { md5 } from 'js-md5'

interface RegisterFormProps {
    onSuccess?: () => void
}

function RegisterForm({ onSuccess }: RegisterFormProps) {
    const [serial, setSerial] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)



        // Validaciones
        let cleanSerial = serial.replace(/^\s+/, '').replace(/\s+$/, '').replace(/-/g, '').toUpperCase()

        if (!cleanSerial.match(/^[A-Z0-9]{20}$/)) {
            setError('El serial es inválido. Debe tener 20 caracteres alfanuméricos.')
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

        // Serial padding removed as it causes hash mismatch with standard game client
        // Old code:
        // while (cleanSerial.length < 36) {
        //    cleanSerial += '\0'
        // }

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
                } else {
                    // If no nonce found, assume empty (new user)
                    nonce = ''
                }
            } catch (e) {
                // If fetch fails, assume empty nonce (new user)
                nonce = ''
            }

            // Submit registration
            const formData = new URLSearchParams()
            formData.append('nonce', nonce)
            formData.append('hash', hash)
            formData.append('serial', cleanSerial.replace(/\0/g, '')) // Remove null bytes for submission
            formData.append('user', cleanUsername) // Backend expects 'user' not 'username'
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
            if (resultHtml.includes('Success') || resultHtml.includes('Usuario registrado') || response.status === 200 && !resultHtml.includes('409') && !resultHtml.includes('400')) {
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
            <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-white mb-2">¡Registro Exitoso!</h3>
                <p className="text-gray-400 mb-4">Tu cuenta ha sido creada correctamente.</p>
                <p className="text-sm text-gray-500">Serás redirigido al login en breve...</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-center text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                    Serial del Juego *
                </label>
                <input
                    type="text"
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors font-mono"
                    placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                    maxLength={24}
                    required
                />
                <p className="text-xs text-gray-500 mt-1">20 caracteres sin guiones</p>
            </div>

            <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                    Nombre de Usuario *
                </label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Tu nombre de usuario"
                    minLength={3}
                    required
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 3 caracteres (solo letras y números)</p>
            </div>

            <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                    Contraseña *
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="•••••"
                    minLength={3}
                    required
                />
            </div>

            <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                    Confirmar Contraseña *
                </label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="•••••"
                    minLength={3}
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
                {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
                Al registrarte, aceptas nuestros términos y condiciones
            </p>
        </form>
    )
}

export default RegisterForm
