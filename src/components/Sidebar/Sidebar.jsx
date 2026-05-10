import { motion } from 'framer-motion'
import NavItem from './NavItem.jsx'
import { DashIcon, ChartIcon, SignOutIcon } from '../icons/index.js'
import { initialsFromEmail } from '../../utils/time.js'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashIcon /> },
  { id: 'reports', label: 'Reports', icon: <ChartIcon /> },
]

export default function Sidebar({ user, page, onNavigate, onLogout }) {
  const initials = initialsFromEmail(user.email)

  return (
    <motion.nav
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={styles.sidebar}
    >
      <div className={styles.logoSection}>
        <motion.div whileHover={{ scale: 1.06, rotate: [0, -4, 4, 0] }} transition={{ duration: 0.4 }} className={styles.logoWrap}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className={styles.logoRing}
          />
          <span className={styles.logoBolt}>⚡</span>
        </motion.div>
        <div>
          <h1 className={styles.brand}>FocusTracker</h1>
          <p className={styles.brandSub}>AI Productivity</p>
        </div>
      </div>

      <div className={styles.navList}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={page === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>

      <div className={styles.bottomGroup}>
        <div className={styles.userCard}>
          <div className={styles.userCardGlow} />
          <div className={styles.userInner}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <p className={styles.userEmail}>{user.email}</p>
              <div className={styles.userStatus}>
                <span className={styles.statusDot} />
                <span className={styles.statusText}>Active</span>
              </div>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ x: 2, color: '#fca5a5' }}
          whileTap={{ scale: 0.97 }}
          className={styles.signOut}
          onClick={onLogout}
        >
          <SignOutIcon />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </motion.nav>
  )
}
