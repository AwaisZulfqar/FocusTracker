import styles from './FloatingOrb.module.css'

export default function FloatingOrb({ style, fixed = false }) {
  return <div className={fixed ? styles.orbFixed : styles.orb} style={style} />
}
