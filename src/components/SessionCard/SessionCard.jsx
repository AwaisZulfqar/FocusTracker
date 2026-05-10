import { motion } from 'framer-motion'
import { indexedItemVariants } from '../../lib/animations.js'
import { scoreColor } from '../../utils/score.js'
import styles from './SessionCard.module.css'

export default function SessionCard({ sess, i }) {
  const c = scoreColor(sess.focusScore)
  return (
    <motion.div
      custom={i}
      variants={indexedItemVariants}
      initial="initial"
      animate="animate"
      className={styles.wrap}
    >
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.left}>
          <div className={styles.accent} style={{ background: c, boxShadow: `0 0 10px ${c}` }} />
          <div className={styles.body}>
            <p className={styles.name}>{sess.taskName}</p>
            <div className={styles.meta}>
              <span>{new Date(sess.completedAt).toLocaleDateString()}</span>
              <span className={styles.sep}>·</span>
              <span>{sess.durationMinutes} min</span>
              <span className={styles.sep}>·</span>
              <span>{sess.totalScreenshots} shots</span>
            </div>
            {sess.aiSummary && <p className={styles.summary}>{sess.aiSummary}</p>}
          </div>
        </div>
        <div className={styles.score}>
          <p className={styles.scoreVal} style={{ color: c }}>
            {sess.focusScore?.toFixed(0)}%
          </p>
          <div className={styles.counts}>
            <span className={styles.focused}>{sess.focusedCount}</span>
            <span className={styles.slash}>/</span>
            <span className={styles.distracted}>{sess.distractedCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
