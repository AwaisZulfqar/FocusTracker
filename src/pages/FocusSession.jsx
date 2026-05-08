import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const RADIUS = 105
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function FocusSession({ session, onComplete }) {
  const [seconds, setSeconds] = useState(session.totalSeconds)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [screenshotsTaken, setScreenshotsTaken] = useState(0)

  useEffect(() => {
    window.api.onSessionTick((remaining) => setSeconds(remaining))
    window.api.onScreenshotCount((count) => setScreenshotsTaken(count))
    window.api.onAnalysisComplete((data) => {
      setAnalyzing(false)
      setResult(data)
    })
  }, [])

  useEffect(() => {
    if (seconds <= 0) setAnalyzing(true)
  }, [seconds])

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const progress = 1 - (seconds / session.totalSeconds)
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  if (result) return <ResultScreen result={result} session={session} onComplete={onComplete} />

  if (analyzing) return (
    <div style={s.page}>
      <Background />
      <div style={s.center}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          style={s.bigSpinner}
        />
        <h2 style={s.analyzingTitle}>Analyzing your session</h2>
        <p style={s.analyzingSub}>AI reviewing {screenshotsTaken} screenshots</p>
        <p style={s.analyzingHint}>This may take 30–60 seconds</p>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={s.center}
      >
        {/* Recording badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={s.recBadge}
        >
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            style={s.recDot}
          />
          <span style={s.recText}>RECORDING</span>
        </motion.div>

        {/* Task */}
        <p style={s.sessionLabel}>Focus Session</p>
        <h2 style={s.taskName}>{session.taskName}</h2>

        {/* Timer ring */}
        <div style={s.ringWrap}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
            style={s.ringHalo}
          />
          <svg width="260" height="260" style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 2 }}>
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
            <circle
              cx="130" cy="130" r={RADIUS}
              fill="none"
              stroke="rgba(139,92,246,0.08)"
              strokeWidth="8"
            />
            <motion.circle
              cx="130" cy="130" r={RADIUS}
              fill="none"
              stroke="url(#ring-grad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              filter="url(#ring-glow)"
            />
          </svg>

          {/* Time */}
          <div style={s.ringCenter}>
            <motion.span
              key={minutes}
              initial={{ y: -3, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={s.timeText}
            >
              {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </motion.span>
            <p style={s.remaining}>REMAINING</p>
          </div>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          <StatTile icon={<CamIcon />} label="Screenshots" value={screenshotsTaken} />
          <StatTile icon={<ChartIcon />} label="Progress" value={`${(progress * 100).toFixed(0)}%`} />
          <StatTile icon={<TimerIcon />} label="Duration" value={`${session.totalSeconds / 60}m`} />
        </div>

        <p style={s.lockHint}>
          <LockIcon /> Timer locked · Stay focused
        </p>
      </motion.div>
    </div>
  )
}

/* ── Result ── */
function ResultScreen({ result, session, onComplete }) {
  const score = result.focusScore || 0
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171'
  const r = 70
  const c = 2 * Math.PI * r

  return (
    <div style={s.page}>
      <Background />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ ...s.center, maxWidth: 460 }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 220 }}
          style={{ ...s.resultIcon, background: `radial-gradient(circle, ${color}40 0%, transparent 70%)` }}
        >
          <span style={{ fontSize: 32 }}>{score >= 70 ? '🎯' : score >= 40 ? '⚡' : '📊'}</span>
        </motion.div>

        <h2 style={s.resultTitle}>Session Complete</h2>
        <p style={s.resultSub}>{session.taskName}</p>

        {/* Score ring */}
        <div style={s.scoreRingWrap}>
          <svg width="170" height="170" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="85" cy="85" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
            <motion.circle
              cx="85" cy="85" r={r}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - score / 100) }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 10px ${color})` }}
            />
          </svg>
          <div style={s.scoreCenter}>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ fontSize: 36, fontWeight: 800, color }}
            >
              {score.toFixed(0)}%
            </motion.span>
            <span style={s.scoreLabel}>FOCUS SCORE</span>
          </div>
        </div>

        {/* Summary */}
        <div style={s.summaryWrap}>
          <div style={s.summaryGlow} />
          <div style={s.summaryCard}>
            <p style={s.summaryHeading}>AI SUMMARY</p>
            <p style={s.summaryText}>{result.summary}</p>
            {result.distractionDetails && result.distractionDetails !== 'None' && (
              <div style={s.distractBox}>
                <span style={{ color: '#fca5a5', fontSize: 12 }}>⚠</span>
                <span>{result.distractionDetails}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={s.resultStats}>
          <ResultStat color="#4ade80" value={result.focused} label="Focused" />
          <ResultStat color="#f87171" value={result.distracted} label="Distracted" />
          <ResultStat color="#a855f7" value={result.total} label="Screenshots" />
        </div>

        <motion.button
          whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 12px 36px rgba(139,92,246,0.55)' }}
          whileTap={{ scale: 0.98 }}
          style={s.backBtn}
          onClick={onComplete}
        >
          Back to Dashboard <ArrowRight />
        </motion.button>
      </motion.div>
    </div>
  )
}

/* ── Helpers ── */
function Background() {
  return (
    <>
      <div style={s.gridOverlay} />
      <div style={{ ...s.orb, top: '-15%', right: '-12%', width: 620, height: 620, background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)' }} />
      <div style={{ ...s.orb, bottom: '-15%', left: '-10%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)' }} />
      <div style={{ ...s.orb, top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(109,40,217,0.06) 0%, transparent 65%)' }} />
    </>
  )
}

function StatTile({ icon, label, value }) {
  return (
    <div style={s.statTile}>
      <span style={s.statTileIcon}>{icon}</span>
      <div>
        <p style={s.statTileValue}>{value}</p>
        <p style={s.statTileLabel}>{label}</p>
      </div>
    </div>
  )
}

function ResultStat({ value, label, color }) {
  return (
    <div style={s.resultStatCard}>
      <p style={{ ...s.resultStatValue, color }}>{value}</p>
      <p style={s.resultStatLabel}>{label}</p>
    </div>
  )
}

function CamIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}
function TimerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="2" x2="14" y2="2" />
      <circle cx="12" cy="14" r="8" />
      <line x1="12" y1="14" x2="15" y2="11" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

/* ── Styles ── */
const s = {
  page: {
    minHeight: '100vh',
    background: '#07070f',
    position: 'relative',
    overflow: 'hidden',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(139,92,246,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139,92,246,0.025) 1px, transparent 1px)
    `,
    backgroundSize: '44px 44px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 0,
  },
  center: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '0 20px',
  },
  recBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    borderRadius: 999,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    marginBottom: 26,
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#ef4444',
    boxShadow: '0 0 8px #ef4444',
  },
  recText: {
    fontSize: 10.5,
    fontWeight: 700,
    color: '#fca5a5',
    letterSpacing: '0.16em',
  },
  sessionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    margin: 0,
  },
  taskName: {
    fontSize: 26,
    fontWeight: 800,
    margin: '8px 0 36px',
    letterSpacing: '-0.5px',
  },
  ringWrap: {
    position: 'relative',
    width: 260,
    height: 260,
    marginBottom: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringHalo: {
    position: 'absolute',
    inset: -8,
    borderRadius: '50%',
    background: 'conic-gradient(from 0deg, rgba(139,92,246,0.15), rgba(34,211,238,0.05), rgba(139,92,246,0.15))',
    filter: 'blur(20px)',
    zIndex: 0,
  },
  ringCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  timeText: {
    fontSize: 56,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-1px',
    fontFamily: "'JetBrains Mono', 'Inter', monospace",
    background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1,
  },
  remaining: {
    fontSize: 10.5,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.32)',
    letterSpacing: '0.2em',
    marginTop: 8,
  },
  statsRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statTile: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderRadius: 14,
    background: 'rgba(124,58,237,0.06)',
    border: '1px solid rgba(139,92,246,0.18)',
    backdropFilter: 'blur(20px)',
  },
  statTileIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'rgba(168,85,247,0.15)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#c4b5fd',
  },
  statTileValue: {
    fontSize: 15,
    fontWeight: 800,
    color: '#fff',
    margin: 0,
    lineHeight: 1.1,
    textAlign: 'left',
  },
  statTileLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginTop: 3,
    textAlign: 'left',
  },
  lockHint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: 'rgba(255,255,255,0.22)',
    marginTop: 28,
    fontWeight: 500,
    letterSpacing: '0.04em',
  },

  /* Analyzing */
  bigSpinner: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: '3px solid rgba(139,92,246,0.18)',
    borderTopColor: '#a855f7',
    marginBottom: 24,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.4px',
  },
  analyzingSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.42)',
    marginTop: 6,
  },
  analyzingHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.22)',
    marginTop: 4,
  },

  /* Result */
  resultIcon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  resultSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    margin: '6px 0 28px',
  },
  scoreRingWrap: {
    position: 'relative',
    width: 170,
    height: 170,
    marginBottom: 24,
  },
  scoreCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreLabel: {
    fontSize: 9.5,
    color: 'rgba(255,255,255,0.32)',
    fontWeight: 700,
    letterSpacing: '0.2em',
    marginTop: 4,
  },
  summaryWrap: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  summaryGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: 15,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(34,211,238,0.08), rgba(124,58,237,0.06))',
    zIndex: -1,
  },
  summaryCard: {
    background: 'rgba(10,10,18,0.85)',
    borderRadius: 14,
    padding: 16,
    textAlign: 'left',
    backdropFilter: 'blur(20px)',
  },
  summaryHeading: {
    fontSize: 9.5,
    fontWeight: 700,
    color: 'rgba(168,85,247,0.7)',
    letterSpacing: '0.2em',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 1.55,
    margin: 0,
  },
  distractBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    fontSize: 12,
    color: '#fca5a5',
  },
  resultStats: {
    display: 'flex',
    gap: 8,
    width: '100%',
    marginBottom: 22,
  },
  resultStatCard: {
    flex: 1,
    background: 'rgba(124,58,237,0.06)',
    border: '1px solid rgba(139,92,246,0.16)',
    borderRadius: 12,
    padding: '10px 8px',
    textAlign: 'center',
  },
  resultStatValue: {
    fontSize: 18,
    fontWeight: 800,
    margin: 0,
    lineHeight: 1.1,
  },
  resultStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.38)',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  backBtn: {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #a855f7 75%, #38bdf8 100%)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'filter 0.2s, box-shadow 0.2s',
    boxShadow: '0 8px 28px rgba(124,58,237,0.45)',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
}
