interface OnlineUser {
    username?: string
    profile?: string
    lobby?: string
    ip?: string
}

interface UsersListProps {
    users: OnlineUser[]
}

function UsersList({ users }: UsersListProps) {
    if (users.length === 0) {
        return <p className="text-gray-400 text-center py-4">No users online</p>
    }

    return (
        <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user, idx) => (
                <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <p className="text-white font-medium">{user.profile || user.username || 'Unknown'}</p>
                    {user.lobby && (
                        <p className="text-gray-400 text-sm">📍 {user.lobby}</p>
                    )}
                </div>
            ))}
        </div>
    )
}

export default UsersList
