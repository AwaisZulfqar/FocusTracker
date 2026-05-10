import styles from './StatPill.module.css'

export default function StatPill({ label, value, accent }) {
  return (
    <div className={styles.pill}>
      <p className={styles.value} style={{ color: accent }}>{value}</p>
      <p className={styles.label}>{label}</p>
    </div>
  )
}
