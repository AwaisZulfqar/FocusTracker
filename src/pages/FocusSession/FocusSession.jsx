import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../lib/api.js'
import Background from '../../components/Background/Background.jsx'
import TimerRing from '../../components/TimerRing/TimerRing.jsx'
import StatTile from '../../components/StatTile/StatTile.jsx'
import ResultScreen from '../../components/ResultScreen/ResultScreen.jsx'
import { CamIcon, ChartIcon, TimerIcon, LockIcon } from '../../components/icons/index.js'
import styles from './FocusSession.module.css'

export default function FocusSession({ session, onComplete }) {
  const [seconds, setSeconds] = useState(session.totalSeconds)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [screenshotsTaken, setScreenshotsTaken] = useState(0)

  useEffect(() => {
    api.onSessionTick((remaining) => setSeconds(remaining))
    api.onScreenshotCount((count) => setScreenshotsTaken(count))
    api.onAnalysisComplete((data) => {
      setAnalyzing(false)
      setResult(data)
    })
  }, [])

  useEffect(() => {
    if (seconds <= 0) setAnalyzing(true)
  }, [seconds])

  if (result) return <ResultScreen result={result} session={session} onComplete={onComplete} />

  if (analyzing) {
    return (
      <div className={styles.page}>
        <Background />
        <div className={styles.center}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className={styles.bigSpinner}
          />
          <h2 className={styles.analyzingTitle}>Analyzing your session</h2>
          <p className={styles.analyzingSub}>AI reviewing {screenshotsTaken} screenshots</p>
          <p className={styles.analyzingHint}>This may take 30–60 seconds</p>
        </div>
      </div>
    )
  }

  const progress = 1 - seconds / session.totalSeconds

  return (
    <div className={styles.page}>
      <Background />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.center}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={styles.recBadge}
        >
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={styles.recDot}
          />
          <span className={styles.recText}>RECORDING</span>
        </motion.div>

        <p className={styles.sessionLabel}>Focus Session</p>
        <h2 className={styles.taskName}>{session.taskName}</h2>

        <TimerRing seconds={seconds} totalSeconds={session.totalSeconds} />

        <div className={styles.statsRow}>
          <StatTile icon={<CamIcon />} label="Screenshots" value={screenshotsTaken} />
          <StatTile icon={<ChartIcon variant="bars" size={13} />} label="Progress" value={`${(progress * 100).toFixed(0)}%`} />
          <StatTile icon={<TimerIcon size={13} />} label="Duration" value={`${session.totalSeconds / 60}m`} />
        </div>

        <p className={styles.lockHint}>
          <LockIcon size={11} /> Timer locked · Stay focused
        </p>
      </motion.div>
    </div>
  )
}
