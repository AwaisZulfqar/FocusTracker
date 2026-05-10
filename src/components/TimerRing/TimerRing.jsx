import { motion } from 'framer-motion'
import { TIMER_RADIUS, TIMER_CIRCUMFERENCE } from '../../constants/ring.js'
import { formatClock } from '../../utils/time.js'
import styles from './TimerRing.module.css'

export default function TimerRing({ seconds, totalSeconds }) {
  const progress = 1 - seconds / totalSeconds
  const dashOffset = TIMER_CIRCUMFERENCE * (1 - progress)
  const display = formatClock(Math.max(0, seconds))
  const minutes = Math.floor(seconds / 60)

  return (
    <div className={styles.ringWrap}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
        className={styles.halo}
      />
      <svg width="260" height="260" className={styles.svg}>
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="130" cy="130" r={TIMER_RADIUS} fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="8" />
        <motion.circle
          cx="130" cy="130" r={TIMER_RADIUS}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={TIMER_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          filter="url(#ring-glow)"
        />
      </svg>
      <div className={styles.center}>
        <motion.span
          key={minutes}
          initial={{ y: -3, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={styles.time}
        >
          {display}
        </motion.span>
        <p className={styles.remaining}>REMAINING</p>
      </div>
    </div>
  )
}
