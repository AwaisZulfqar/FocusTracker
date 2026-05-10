import { motion } from 'framer-motion'
import Background from '../Background/Background.jsx'
import ArrowRight from '../icons/ArrowRight.jsx'
import { scoreColor, scoreEmoji } from '../../utils/score.js'
import { SCORE_RADIUS, SCORE_CIRCUMFERENCE } from '../../constants/ring.js'
import styles from './ResultScreen.module.css'

function ResultStat({ value, label, color }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statValue} style={{ color }}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  )
}

export default function ResultScreen({ result, session, onComplete }) {
  const score = result.focusScore || 0
  const color = scoreColor(score)

  return (
    <div className={styles.page}>
      <Background />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.center}
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 220 }}
          className={styles.headIcon}
          style={{ background: `radial-gradient(circle, ${color}40 0%, transparent 70%)` }}
        >
          <span className={styles.emoji}>{scoreEmoji(score)}</span>
        </motion.div>

        <h2 className={styles.title}>Session Complete</h2>
        <p className={styles.sub}>{session.taskName}</p>

        <div className={styles.scoreRingWrap}>
          <svg width="170" height="170" className={styles.scoreSvg}>
            <circle cx="85" cy="85" r={SCORE_RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
            <motion.circle
              cx="85" cy="85" r={SCORE_RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={SCORE_CIRCUMFERENCE}
              initial={{ strokeDashoffset: SCORE_CIRCUMFERENCE }}
              animate={{ strokeDashoffset: SCORE_CIRCUMFERENCE * (1 - score / 100) }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 10px ${color})` }}
            />
          </svg>
          <div className={styles.scoreCenter}>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className={styles.scoreValue}
              style={{ color }}
            >
              {score.toFixed(0)}%
            </motion.span>
            <span className={styles.scoreLabel}>FOCUS SCORE</span>
          </div>
        </div>

        <div className={styles.summaryWrap}>
          <div className={styles.summaryGlow} />
          <div className={styles.summaryCard}>
            <p className={styles.summaryHeading}>AI SUMMARY</p>
            <p className={styles.summaryText}>{result.summary}</p>
            {result.distractionDetails && result.distractionDetails !== 'None' && (
              <div className={styles.distractBox}>
                <span className={styles.warn}>⚠</span>
                <span>{result.distractionDetails}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.statsRow}>
          <ResultStat color="#4ade80" value={result.focused} label="Focused" />
          <ResultStat color="#f87171" value={result.distracted} label="Distracted" />
          <ResultStat color="#a855f7" value={result.total} label="Screenshots" />
        </div>

        <motion.button
          whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 12px 36px rgba(139,92,246,0.55)' }}
          whileTap={{ scale: 0.98 }}
          className={styles.backBtn}
          onClick={onComplete}
        >
          Back to Dashboard <ArrowRight />
        </motion.button>
      </motion.div>
    </div>
  )
}
