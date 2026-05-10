import styles from './StatTile.module.css'

export default function StatTile({ icon, label, value }) {
  return (
    <div className={styles.tile}>
      <span className={styles.icon}>{icon}</span>
      <div>
        <p className={styles.value}>{value}</p>
        <p className={styles.label}>{label}</p>
      </div>
    </div>
  )
}
