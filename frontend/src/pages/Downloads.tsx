function Downloads() {
    const downloads = [
        {
            title: 'PES6 Client',
            description: 'Official PES6 game client for Windows',
            size: '~4.5 GB',
            icon: '🎮'
        },
        {
            title: 'Server Patch',
            description: 'Latest patch to connect to this server',
            size: '~50 MB',
            icon: '🔧'
        },
        {
            title: 'Roster Update',
            description: 'Updated team rosters and player stats',
            size: '~10 MB',
            icon: '⚽'
        }
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
                <h1 className="text-4xl font-bold text-white mb-2">Downloads</h1>
                <p className="text-gray-400 mb-8">Get everything you need to play on our server</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {downloads.map((item, idx) => (
                        <div
                            key={idx}
                            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
                        >
                            <div className="text-5xl mb-4">{item.icon}</div>
                            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-gray-400 text-sm mb-4">{item.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500 text-sm">{item.size}</span>
                                <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
                                    Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-400 mb-2">📖 Installation Guide</h3>
                    <ol className="text-gray-300 space-y-2 list-decimal list-inside">
                        <li>Download and install the PES6 Client</li>
                        <li>Apply the Server Patch to your installation</li>
                        <li>Install the Roster Update (optional)</li>
                        <li>Launch the game and connect to the server</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}

export default Downloads
