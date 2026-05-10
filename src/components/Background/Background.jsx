import FloatingOrb from '../FloatingOrb/FloatingOrb.jsx'
import styles from './Background.module.css'

export default function Background({ variant = 'session' }) {
  if (variant === 'session') {
    return (
      <>
        <div className={styles.grid} />
        <FloatingOrb style={{ top: '-15%', right: '-12%', width: 620, height: 620, background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />
        <FloatingOrb style={{ bottom: '-15%', left: '-10%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)' }} />
        <FloatingOrb style={{ top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(109,40,217,0.06) 0%, transparent 65%)' }} />
      </>
    )
  }
  return null
}
