interface StatsCardProps {
    title: string
    value: number
    icon: string
}

function StatsCard({ title, value, icon }: StatsCardProps) {
    return (
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    <p className="text-4xl font-bold text-white mt-2">{value}</p>
                </div>
                <div className="text-5xl">{icon}</div>
            </div>
        </div>
    )
}

export default StatsCard
