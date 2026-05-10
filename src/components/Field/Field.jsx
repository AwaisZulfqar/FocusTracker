import styles from './Field.module.css'

export default function Field({ label, children, style }) {
  return (
    <div style={style}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  )
}
