import { motion } from 'framer-motion'
import styles from './Particle.module.css'

export default function Particle({ x, y, delay, size }) {
  return (
    <motion.div
      className={styles.particle}
      style={{ left: x, top: y, width: size, height: size }}
      animate={{ opacity: [0, 0.8, 0], y: [0, -24, -48], scale: [0.5, 1.2, 0.3] }}
      transition={{ repeat: Infinity, duration: 4 + delay, delay, ease: 'easeOut' }}
    />
  )
}
