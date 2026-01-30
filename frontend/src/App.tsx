import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { type ReactNode } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import Downloads from './pages/Downloads'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Auth from './pages/Auth'
import Account from './pages/Account'
import ServerStats from './pages/ServerStats'
import MatchHistory from './pages/MatchHistory'
import Guide from './pages/Guide'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes with Layout */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/downloads" element={<Layout><Downloads /></Layout>} />
          <Route path="/server" element={<Layout><ServerStats /></Layout>} />
          <Route path="/history" element={<Layout><MatchHistory /></Layout>} />
          <Route path="/account" element={<Layout><Account /></Layout>} />
          <Route path="/auth" element={<Layout><Auth /></Layout>} />
          <Route path="/guide" element={<Layout><Guide /></Layout>} />

          {/* Auth routes without Layout (full page) */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
