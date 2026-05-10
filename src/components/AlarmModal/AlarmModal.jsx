import { motion, AnimatePresence } from 'framer-motion'
import { ClockIcon, ArrowRight } from '../icons/index.js'
import styles from './AlarmModal.module.css'

export default function AlarmModal({ alarm, onStart, onDismiss }) {
  return (
    <AnimatePresence>
      {alarm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={styles.backdrop}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={styles.card}
          >
            <div className={styles.glow} />
            <div className={styles.inner}>
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [-8, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className={styles.icon}
              >
                <ClockIcon size={26} />
              </motion.div>
              <h2 className={styles.title}>Time to Focus</h2>
              <p className={styles.sub}>
                Task: <span className={styles.taskName}>{alarm.taskName}</span>
              </p>
              <motion.button
                whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 12px 36px rgba(139,92,246,0.55)' }}
                whileTap={{ scale: 0.98 }}
                className={styles.primaryBtn}
                onClick={() => onStart(alarm.todoId)}
              >
                Start Focus Session
                <ArrowRight />
              </motion.button>
              <button className={styles.skipBtn} onClick={onDismiss}>
                Skip this time
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
