import type { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import AnnouncementBanner from './AnnouncementBanner'

interface LayoutProps {
    children: ReactNode
}

function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-900">
            <AnnouncementBanner />
            <Header />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    )
}

export default Layout
