import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../lib/api.js'
import { pageVariants } from '../../lib/animations.js'
import BootLoader from '../BootLoader/BootLoader.jsx'
import Sidebar from '../Sidebar/Sidebar.jsx'
import FloatingOrb from '../FloatingOrb/FloatingOrb.jsx'
import Auth from '../../pages/Auth/Auth.jsx'
import Dashboard from '../../pages/Dashboard/Dashboard.jsx'
import FocusSession from '../../pages/FocusSession/FocusSession.jsx'
import Reports from '../../pages/Reports/Reports.jsx'
import styles from './App.module.css'

export default function App() {
  const [user, setUser] = useState(undefined)
  const [page, setPage] = useState('dashboard')
  const [activeSession, setActiveSession] = useState(null)

  useEffect(() => {
    api.getUser().then(setUser)
  }, [])

  if (user === undefined) return <BootLoader />
  if (!user) return <Auth onLogin={setUser} />
  if (activeSession) {
    return <FocusSession session={activeSession} onComplete={() => setActiveSession(null)} />
  }

  function logout() {
    api.logout()
    setUser(null)
  }

  return (
    <div className={styles.shell}>
      <div className={styles.gridOverlay} />
      <FloatingOrb
        fixed
        style={{ top: '-20%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }}
      />
      <FloatingOrb
        fixed
        style={{ bottom: '-20%', left: '-10%', width: 460, height: 460, background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)' }}
      />

      <Sidebar user={user} page={page} onNavigate={setPage} onLogout={logout} />

      <main className={styles.main}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {page === 'dashboard' && <Dashboard onStartSession={setActiveSession} />}
            {page === 'reports' && <Reports />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
