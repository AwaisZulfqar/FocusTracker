import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import FocusSession from './pages/FocusSession'
import Reports from './pages/Reports'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

export default function App() {
  const [user, setUser] = useState(undefined)
  const [page, setPage] = useState('dashboard')
  const [activeSession, setActiveSession] = useState(null)

  useEffect(() => {
    window.api.getUser().then(setUser)
  }, [])

  if (user === undefined) return <BootLoader />
  if (!user) return <Auth onLogin={setUser} />
  if (activeSession) return (
    <FocusSession session={activeSession} onComplete={() => setActiveSession(null)} />
  )

  const initials = (user.email || '?').slice(0, 2).toUpperCase()

  return (
    <div style={s.shell}>
      {/* Ambient backdrop */}
      <div style={s.gridOverlay} />
      <div style={{ ...s.orb, top: '-20%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />
      <div style={{ ...s.orb, bottom: '-20%', left: '-10%', width: 460, height: 460, background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)' }} />

      {/* Sidebar */}
      <motion.nav
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={s.sidebar}
      >
        {/* Logo */}
        <div style={s.logoSection}>
          <motion.div whileHover={{ scale: 1.06, rotate: [0, -4, 4, 0] }} transition={{ duration: 0.4 }} style={s.logoWrap}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              style={s.logoRing}
            />
            <span style={{ fontSize: 18, position: 'relative', zIndex: 1 }}>⚡</span>
          </motion.div>
          <div>
            <h1 style={s.brand}>FocusTracker</h1>
            <p style={s.brandSub}>AI Productivity</p>
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavItem
            icon={<DashIcon />}
            label="Dashboard"
            active={page === 'dashboard'}
            onClick={() => setPage('dashboard')}
          />
          <NavItem
            icon={<ChartIcon />}
            label="Reports"
            active={page === 'reports'}
            onClick={() => setPage('reports')}
          />
        </div>

        {/* User card */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={s.userCard}>
            <div style={s.userCardGlow} />
            <div style={s.userInner}>
              <div style={s.avatar}>{initials}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={s.userEmail}>{user.email}</p>
                <div style={s.userStatus}>
                  <span style={s.statusDot} />
                  <span style={s.statusText}>Active</span>
                </div>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ x: 2, color: '#fca5a5' }}
            whileTap={{ scale: 0.97 }}
            style={s.signOut}
            onClick={() => { window.api.logout(); setUser(null) }}
          >
            <SignOutIcon />
            <span>Sign Out</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Main */}
      <main style={s.main}>
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

/* ── Boot loader ── */
function BootLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070f' }}>
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 12px rgba(139,92,246,0.7)' }}
          />
        ))}
      </motion.div>
    </div>
  )
}

/* ── NavItem ── */
function NavItem({ icon, label, active, onClick }) {
  return (
    <motion.button
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        ...s.navItem,
        ...(active ? s.navItemActive : {}),
      }}
    >
      {active && (
        <motion.div
          layoutId="nav-indicator"
          style={s.navIndicator}
        />
      )}
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16 }}>
        {icon}
      </span>
      <span>{label}</span>
    </motion.button>
  )
}

/* ── Icons ── */
function DashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-5" />
    </svg>
  )
}
function SignOutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

/* ── Styles ── */
const s = {
  shell: {
    display: 'flex',
    height: '100vh',
    background: '#07070f',
    position: 'relative',
    overflow: 'hidden',
    color: '#fff',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(139,92,246,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139,92,246,0.025) 1px, transparent 1px)
    `,
    backgroundSize: '44px 44px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  orb: {
    position: 'fixed',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 0,
  },
  sidebar: {
    position: 'relative',
    zIndex: 10,
    width: 232,
    display: 'flex',
    flexDirection: 'column',
    padding: '22px 16px 18px',
    gap: 4,
    background: 'rgba(10,10,18,0.7)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    borderRight: '1px solid rgba(139,92,246,0.14)',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    padding: '4px 6px',
    marginBottom: 22,
  },
  logoWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a855f7 100%)',
    boxShadow: '0 8px 22px rgba(124,58,237,0.5), 0 0 0 1px rgba(168,85,247,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  logoRing: {
    position: 'absolute',
    inset: -2,
    borderRadius: 14,
    border: '1.5px solid transparent',
    background: 'linear-gradient(135deg, rgba(168,85,247,0.6), rgba(34,211,238,0.3), rgba(168,85,247,0.1)) border-box',
    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'destination-out',
    maskComposite: 'exclude',
  },
  brand: {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: '-0.3px',
    margin: 0,
    lineHeight: 1.1,
  },
  brandSub: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.32)',
    marginTop: 3,
    fontWeight: 500,
    letterSpacing: '0.04em',
    lineHeight: 1,
  },
  navItem: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    padding: '9px 12px',
    borderRadius: 11,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'left',
    width: '100%',
    transition: 'color 0.18s',
    fontFamily: 'inherit',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(168,85,247,0.1))',
    color: '#fff',
    border: '1px solid rgba(139,92,246,0.28)',
    boxShadow: '0 0 0 1px rgba(168,85,247,0.05), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  navIndicator: {
    position: 'absolute',
    left: -16,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 3,
    height: 18,
    borderRadius: 2,
    background: 'linear-gradient(180deg, #a855f7, #7c3aed)',
    boxShadow: '0 0 10px #a855f7',
  },
  userCard: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  userCardGlow: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.45), rgba(34,211,238,0.12) 60%, rgba(124,58,237,0.1))',
    borderRadius: 14,
    padding: 1,
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    pointerEvents: 'none',
  },
  userInner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    background: 'rgba(124,58,237,0.06)',
    borderRadius: 14,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.04em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(124,58,237,0.4)',
  },
  userEmail: {
    fontSize: 11.5,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.85)',
    margin: 0,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  userStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#4ade80',
    boxShadow: '0 0 6px #4ade80',
  },
  statusText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 500,
  },
  signOut: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.05)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.18s',
    fontFamily: 'inherit',
  },
  main: {
    position: 'relative',
    zIndex: 10,
    flex: 1,
    overflow: 'auto',
    padding: '34px 40px',
  },
}
