import { motion } from 'framer-motion'
import { indexedItemVariants } from '../../lib/animations.js'
import styles from './StatCard.module.css'

export default function StatCard({ icon, label, value, accent, hint, i }) {
  return (
    <motion.div
      custom={i}
      variants={indexedItemVariants}
      initial="initial"
      animate="animate"
      className={styles.wrap}
    >
      <div
        className={styles.glow}
        style={{ background: `linear-gradient(135deg, ${accent}55, rgba(34,211,238,0.08), rgba(124,58,237,0.06))` }}
      />
      <div className={styles.card}>
        <div
          className={styles.icon}
          style={{ background: `${accent}20`, color: accent, boxShadow: `0 0 14px ${accent}30` }}
        >
          {icon}
        </div>
        <p className={styles.label}>{label}</p>
        <p className={styles.value} style={{ color: accent }}>{value}</p>
        <p className={styles.hint}>{hint}</p>
      </div>
    </motion.div>
  )
}
