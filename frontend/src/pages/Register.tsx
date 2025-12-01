import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

function Register() {
    const [username, setUsername] = useState('')
    const [serial, setSerial] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const formRef = useRef<HTMLFormElement>(null)

    // MD5 hash function (simplified - matches backend expectation)
    const md5 = (str: string): string => {
        // Using crypto-js would be better, but for simplicity using a basic implementation
        // This is a placeholder - in production use proper MD5 library
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }
        // Convert to hex and pad to 32 chars
        let hexHash = Math.abs(hash).toString(16)
        while (hexHash.length < 32) {
            hexHash += '0'
        }
        return hexHash.substring(0, 32)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validations
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        if (password.length < 3) {
            setError('La contraseña debe tener al menos 3 caracteres')
            return
        }

        if (username.length < 3 || !/^[0-9a-zA-Z]+$/.test(username)) {
            setError('El nombre de usuario debe tener al menos 3 caracteres y solo letras/números')
            return
        }

        // Clean and validate serial
        let cleanSerial = serial.replace(/^\s+/, '').replace(/\s+$/, '').replace(/-/g, '').toUpperCase()

        if (!cleanSerial.match(/^[A-Z0-9]{20}$/)) {
            setError('El serial debe tener 20 caracteres (sin guiones)')
            return
        }

        // Pad serial to 36 chars (as per original implementation)
        while (cleanSerial.length < 36) {
            cleanSerial += '\0'
        }

        // Calculate hash: md5(serial + username + '-' + password)
        const hashValue = md5(cleanSerial + username + '-' + password)

        // Set hidden field and submit traditional form
        const hashField = document.getElementById('hash') as HTMLInputElement
        const serialField = document.getElementById('serial') as HTMLInputElement

        if (hashField && serialField) {
            hashField.value = hashValue
            serialField.value = cleanSerial.substring(0, 20) // Remove padding for submission
            formRef.current?.submit()
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-xl border border-gray-700 p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-2">⚽</div>
                    <h2 className="text-2xl font-bold text-white">Crear Cuenta</h2>
                    <p className="text-gray-400">La Mano de Castolo</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-center text-sm">
                        {error}
                    </div>
                )}

                {/* Traditional HTML Form that does direct POST */}
                <form
                    ref={formRef}
                    name="registration"
                    action="/api/register"
                    method="POST"
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <input type="hidden" name="nonce" value="" />
                    <input type="hidden" name="hash" id="hash" />
                    <input type="hidden" name="serial" id="serial" />
                    <input type="hidden" name="format" value="html" />

                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-2">
                            Nombre de Usuario
                        </label>
                        <input
                            type="text"
                            name="user"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                            placeholder="Tu nombre de usuario"
                            required
                            minLength={3}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-2">
                            Serial del Juego
                        </label>
                        <input
                            type="text"
                            value={serial}
                            onChange={(e) => setSerial(e.target.value.toUpperCase())}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500 transition-colors"
                            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                            required
                            maxLength={24}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            20 caracteres (puedes incluir o no los guiones)
                        </p>
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
                            minLength={3}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-2">
                            Confirmar Contraseña
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                            placeholder="•••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02]"
                    >
                        Registrarse
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                        ← Volver al Inicio
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Register
