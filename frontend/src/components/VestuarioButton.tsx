import { Link, useLocation } from 'react-router-dom'

interface VestuarioButtonProps {
    className?: string
}

function VestuarioButton({ className = '' }: VestuarioButtonProps) {
    const location = useLocation()
    const isActive = location.pathname === '/server'

    return (
        <Link
            to="/server"
            className={`vestuario-btn relative px-6 py-2.5 rounded-lg font-semibold uppercase tracking-wide text-sm transition-all duration-300 flex items-center gap-2 ${isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/50'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange-500/50 hover:scale-105'
                } ${className}`}
        >
            <span className="text-lg">🏆</span>
            <span>Vestuario</span>
        </Link>
    )
}

export default VestuarioButton
