import { motion } from 'framer-motion'
import styles from './Sidebar.module.css'

export default function NavItem({ icon, label, active, onClick }) {
  return (
    <motion.button
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
    >
      {active && <motion.div layoutId="nav-indicator" className={styles.navIndicator} />}
      <span className={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </motion.button>
  )
}
