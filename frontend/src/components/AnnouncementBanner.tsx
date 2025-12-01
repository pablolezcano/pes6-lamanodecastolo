import { useState, useEffect } from 'react'
import axios from 'axios'

interface Announcement {
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'urgent'
    createdAt: string
}

function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [dismissedIds, setDismissedIds] = useState<string[]>([])
    const [visible, setVisible] = useState<string[]>([])

    useEffect(() => {
        // Load dismissed announcements from localStorage
        const dismissed = localStorage.getItem('dismissedAnnouncements')
        if (dismissed) {
            setDismissedIds(JSON.parse(dismissed))
        }

        // Fetch active announcements
        fetchAnnouncements()
    }, [])

    useEffect(() => {
        // Show announcements with stagger effect
        const active = announcements.filter(a => !dismissedIds.includes(a.id))
        active.forEach((ann, index) => {
            setTimeout(() => {
                setVisible(prev => [...prev, ann.id])
            }, index * 150)
        })
    }, [announcements, dismissedIds])

    const fetchAnnouncements = async () => {
        try {
            const response = await axios.get('/api/announcements')
            setAnnouncements(response.data)
        } catch (error) {
            console.error('Error fetching announcements:', error)
            setAnnouncements([])
        }
    }

    const dismissAnnouncement = (id: string) => {
        // Remove from visible first (for animation)
        setVisible(prev => prev.filter(vid => vid !== id))

        // After animation, mark as dismissed
        setTimeout(() => {
            const newDismissed = [...dismissedIds, id]
            setDismissedIds(newDismissed)
            localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed))
        }, 300)
    }

    const getAnnouncementStyles = (type: string) => {
        switch (type) {
            case 'urgent':
                return {
                    bg: 'bg-gradient-to-r from-pink-500 to-red-500',
                    icon: '🚫',
                    textColor: 'text-white'
                }
            case 'warning':
                return {
                    bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
                    icon: '⚠️',
                    textColor: 'text-gray-900'
                }
            case 'info':
            default:
                return {
                    bg: 'bg-gradient-to-r from-teal-400 to-cyan-500',
                    icon: '✓',
                    textColor: 'text-gray-900'
                }
        }
    }

    const activeAnnouncements = announcements.filter(a =>
        !dismissedIds.includes(a.id) && visible.includes(a.id)
    )

    if (activeAnnouncements.length === 0) {
        return null
    }

    return (
        <div className="fixed top-16 left-0 right-0 z-50 flex flex-col gap-0 pointer-events-none">
            {activeAnnouncements.map((announcement, index) => {
                const styles = getAnnouncementStyles(announcement.type)

                return (
                    <div
                        key={announcement.id}
                        className={`${styles.bg} ${styles.textColor} shadow-lg flex items-center pointer-events-auto animate-slide-in-right w-full`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="max-w-7xl mx-auto w-full flex items-center gap-4 px-4">
                            <div className="flex-shrink-0 text-3xl">
                                {styles.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg leading-tight">
                                    {announcement.title}
                                </h3>
                                <p className="text-sm opacity-90 leading-snug">
                                    {announcement.message}
                                </p>
                            </div>

                            <button
                                onClick={() => dismissAnnouncement(announcement.id)}
                                className={`flex-shrink-0 ${styles.textColor} hover:opacity-70 transition-opacity`}
                                aria-label="Cerrar"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default AnnouncementBanner
