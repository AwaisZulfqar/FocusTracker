import { motion } from 'framer-motion'
import styles from './BootLoader.module.css'

export default function BootLoader() {
  return (
    <div className={styles.shell}>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className={styles.row}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
            className={styles.dot}
          />
        ))}
      </motion.div>
    </div>
  )
}
