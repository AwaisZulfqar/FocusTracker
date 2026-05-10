import { useState } from 'react'
import { motion } from 'framer-motion'
import { itemVariants } from '../../lib/animations.js'
import { ClockIcon, TimerIcon, CheckIcon, ArrowRight, TrashIcon } from '../icons/index.js'
import styles from './TodoCard.module.css'

export default function TodoCard({ todo, onStart, onDelete }) {
  const [hover, setHover] = useState(false)
  const done = todo.isCompleted

  return (
    <motion.div
      variants={itemVariants}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className={styles.wrap}
    >
      <div className={styles.glow} style={{ opacity: hover && !done ? 1 : 0.5 }} />
      <div className={styles.card}>
        <div className={styles.left}>
          <div className={`${styles.dot} ${done ? styles.dotDone : styles.dotActive}`} />
          <div className={styles.body}>
            <p className={styles.name} style={{ textDecoration: done ? 'line-through' : 'none' }}>
              {todo.taskName}
            </p>
            <div className={styles.meta}>
              <span className={styles.metaItem}>
                <ClockIcon size={11} /> {todo.scheduledTime}
              </span>
              <span className={styles.sep}>·</span>
              <span className={styles.metaItem}>
                <TimerIcon size={11} /> {todo.durationMinutes} min
              </span>
            </div>
          </div>
        </div>
        <div className={styles.right}>
          {done ? (
            <span className={styles.doneBadge}>
              <CheckIcon /> Done
            </span>
          ) : (
            <motion.button
              whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 8px 22px rgba(139,92,246,0.5)' }}
              whileTap={{ scale: 0.96 }}
              className={styles.startBtn}
              onClick={() => onStart(todo.id)}
            >
              Start <ArrowRight size={11} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.08, color: '#fca5a5' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onDelete(todo.id)}
            className={styles.deleteBtn}
            style={{ opacity: hover ? 1 : 0 }}
          >
            <TrashIcon />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
