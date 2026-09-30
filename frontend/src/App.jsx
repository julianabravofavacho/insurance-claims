import { useEffect, useState } from 'react'
import { AppShellLayout } from './components/AppShellLayout'
import { ClaimsPage } from './pages/ClaimsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { clearSession, getSession } from './services/authService'
import './App.css'

function App() {
  const [session, setSession] = useState(() => getSession())
  const [currentPage, setCurrentPage] = useState('dashboard')

  useEffect(() => {
    function handleUnauthorized() {
      setSession(null)
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  function handleLogin(nextSession) {
    setSession(nextSession)
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    setCurrentPage('dashboard')
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <AppShellLayout
      user={session.user}
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {currentPage === 'claims' && <ClaimsPage />}
      {currentPage === 'profile' && <ProfilePage user={session.user} />}
      {currentPage === 'dashboard' && <DashboardPage />}
    </AppShellLayout>
  )
}

export default App
