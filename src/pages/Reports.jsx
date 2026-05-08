import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const scoreColor = (s) => s >= 70 ? '#4ade80' : s >= 40 ? '#fbbf24' : '#f87171'
const scoreTone = (s) => s >= 70 ? 'Excellent' : s >= 40 ? 'Good' : 'Needs Focus'

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3 } }),
}

export default function Reports() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getReports(7).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid rgba(139,92,246,0.2)', borderTopColor: '#a855f7' }}
      />
    </div>
  )

  const allSessions = data.flatMap(d => d.sessions || [])
  const avgScore = allSessions.length > 0
    ? allSessions.reduce((sum, x) => sum + (x.focusScore || 0), 0) / allSessions.length
    : 0
  const best = allSessions.length > 0 ? Math.max(...allSessions.map(x => x.focusScore || 0)) : 0
  const totalMin = allSessions.reduce((sum, x) => sum + (x.durationMinutes || 0), 0)

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <p style={s.eyebrow}>
            <SparkleIcon /> ANALYTICS
          </p>
          <h1 style={s.title}>Focus Report</h1>
          <p style={s.sub}>Last 7 days · {allSessions.length} sessions tracked</p>
        </motion.div>
      </div>

      {data.length === 0 ? (
        <div style={s.emptyWrap}>
          <div style={s.emptyGlow} />
          <div style={s.emptyCard}>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              style={s.emptyIcon}
            >
              <ChartBigIcon />
            </motion.div>
            <p style={s.emptyTitle}>No sessions yet</p>
            <p style={s.emptySub}>Complete a focus session to see your report</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={s.statsGrid}>
            <StatCard
              i={0}
              icon={<TargetIcon />}
              label="7-Day Average"
              value={`${avgScore.toFixed(0)}%`}
              accent={scoreColor(avgScore)}
              hint={scoreTone(avgScore)}
            />
            <StatCard
              i={1}
              icon={<StackIcon />}
              label="Total Sessions"
              value={allSessions.length}
              accent="#a855f7"
              hint={`${totalMin} min focused`}
            />
            <StatCard
              i={2}
              icon={<TrophyIcon />}
              label="Best Session"
              value={`${best.toFixed(0)}%`}
              accent="#4ade80"
              hint="Personal best"
            />
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={s.chartWrap}
          >
            <div style={s.chartGlow} />
            <div style={s.chartCard}>
              <div style={s.chartHeader}>
                <div>
                  <p style={s.chartEyebrow}>DAILY PERFORMANCE</p>
                  <p style={s.chartTitle}>Focus Score by Day</p>
                </div>
                <div style={s.legendRow}>
                  <Legend color="#4ade80" label="≥70" />
                  <Legend color="#fbbf24" label="40–69" />
                  <Legend color="#f87171" label="<40" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -22 }}>
                  <defs>
                    {data.map((entry, i) => (
                      <linearGradient key={i} id={`bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={scoreColor(entry.avg_focus)} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={scoreColor(entry.avg_focus)} stopOpacity={0.4} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="transparent"
                    tick={{ fill: 'rgba(255,255,255,0.32)', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={d => d.slice(5)}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    stroke="transparent"
                    tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,10,20,0.96)',
                      border: '1px solid rgba(139,92,246,0.28)',
                      borderRadius: 12,
                      fontSize: 12,
                      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontSize: 11 }}
                    formatter={(v) => [`${v?.toFixed(0)}%`, 'Avg Focus']}
                    cursor={{ fill: 'rgba(139,92,246,0.06)' }}
                  />
                  <Bar dataKey="avg_focus" radius={[8, 8, 0, 0]} maxBarSize={44}>
                    {data.map((entry, i) => (
                      <Cell key={i} fill={`url(#bar-${i})`}
                        style={{ filter: `drop-shadow(0 0 8px ${scoreColor(entry.avg_focus)}55)` }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* History */}
          <div>
            <p style={s.sectionLabel}>Session History</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allSessions.map((sess, i) => (
                <SessionCard key={sess.id} sess={sess} i={i} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ── StatCard ── */
function StatCard({ icon, label, value, accent, hint, i }) {
  return (
    <motion.div
      custom={i}
      variants={itemVariants}
      initial="initial"
      animate="animate"
      style={s.statWrap}
    >
      <div style={{ ...s.statGlow, background: `linear-gradient(135deg, ${accent}55, rgba(34,211,238,0.08), rgba(124,58,237,0.06))` }} />
      <div style={s.statCard}>
        <div style={{ ...s.statIcon, background: `${accent}20`, color: accent, boxShadow: `0 0 14px ${accent}30` }}>
          {icon}
        </div>
        <p style={s.statLabel}>{label}</p>
        <p style={{ ...s.statValue, color: accent }}>{value}</p>
        <p style={s.statHint}>{hint}</p>
      </div>
    </motion.div>
  )
}

/* ── SessionCard ── */
function SessionCard({ sess, i }) {
  const c = scoreColor(sess.focusScore)
  return (
    <motion.div
      custom={i}
      variants={itemVariants}
      initial="initial"
      animate="animate"
      style={s.sessWrap}
    >
      <div style={s.sessGlow} />
      <div style={s.sessCard}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{ ...s.sessAccent, background: c, boxShadow: `0 0 10px ${c}` }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={s.sessName}>{sess.taskName}</p>
            <div style={s.sessMeta}>
              <span>{new Date(sess.completedAt).toLocaleDateString()}</span>
              <span style={s.sessSep}>·</span>
              <span>{sess.durationMinutes} min</span>
              <span style={s.sessSep}>·</span>
              <span>{sess.totalScreenshots} shots</span>
            </div>
            {sess.aiSummary && (
              <p style={s.sessSummary}>{sess.aiSummary}</p>
            )}
          </div>
        </div>
        <div style={s.sessScore}>
          <p style={{ ...s.sessScoreVal, color: c }}>
            {sess.focusScore?.toFixed(0)}%
          </p>
          <div style={s.sessCounts}>
            <span style={{ color: '#4ade80' }}>{sess.focusedCount}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{ color: '#f87171' }}>{sess.distractedCount}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

/* ── Icons ── */
function SparkleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    </svg>
  )
}
function TargetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
function StackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}
function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17a2 2 0 0 1-2 2H8a2 2 0 0 0 0 4h8a2 2 0 0 0 0-4h0a2 2 0 0 1-2-2v-2.34" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  )
}
function ChartBigIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-5" />
    </svg>
  )
}

/* ── Styles ── */
const s = {
  page: {
    maxWidth: 880,
    margin: '0 auto',
  },
  header: {
    marginBottom: 26,
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 10.5,
    fontWeight: 700,
    color: 'rgba(168,85,247,0.85)',
    letterSpacing: '0.18em',
    margin: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '-0.6px',
    margin: '6px 0 4px',
  },
  sub: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.32)',
    margin: 0,
    fontWeight: 500,
  },
  emptyWrap: {
    position: 'relative',
    borderRadius: 18,
  },
  emptyGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: 19,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(34,211,238,0.08), rgba(124,58,237,0.06))',
    zIndex: -1,
  },
  emptyCard: {
    background: 'rgba(10,10,18,0.85)',
    borderRadius: 18,
    padding: '60px 24px',
    textAlign: 'center',
    backdropFilter: 'blur(40px)',
  },
  emptyIcon: {
    display: 'inline-flex',
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(124,58,237,0.12))',
    border: '1px solid rgba(168,85,247,0.28)',
    color: '#c4b5fd',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.65)',
    margin: 0,
  },
  emptySub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.32)',
    marginTop: 6,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 18,
  },
  statWrap: {
    position: 'relative',
    borderRadius: 16,
  },
  statGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: 17,
    zIndex: -1,
  },
  statCard: {
    position: 'relative',
    background: 'rgba(10,10,18,0.85)',
    borderRadius: 16,
    padding: 16,
    backdropFilter: 'blur(20px)',
  },
  statIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 10,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: 0,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 800,
    margin: '4px 0 4px',
    letterSpacing: '-0.5px',
    lineHeight: 1.1,
  },
  statHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.32)',
    margin: 0,
    fontWeight: 500,
  },
  chartWrap: {
    position: 'relative',
    borderRadius: 18,
    marginBottom: 22,
  },
  chartGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: 19,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.32), rgba(34,211,238,0.08), rgba(124,58,237,0.04))',
    zIndex: -1,
  },
  chartCard: {
    background: 'rgba(10,10,18,0.85)',
    borderRadius: 18,
    padding: '18px 18px 14px',
    backdropFilter: 'blur(24px)',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
    flexWrap: 'wrap',
  },
  chartEyebrow: {
    fontSize: 9.5,
    fontWeight: 700,
    color: 'rgba(168,85,247,0.7)',
    letterSpacing: '0.2em',
    margin: 0,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 700,
    margin: '4px 0 0',
  },
  legendRow: {
    display: 'flex',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.32)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sessWrap: {
    position: 'relative',
    borderRadius: 14,
  },
  sessGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: 15,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(34,211,238,0.04), rgba(124,58,237,0.04))',
    zIndex: -1,
  },
  sessCard: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    padding: '14px 16px',
    borderRadius: 14,
    background: 'rgba(12,12,22,0.85)',
    border: '1px solid rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
  },
  sessAccent: {
    width: 4,
    height: 36,
    borderRadius: 4,
    flexShrink: 0,
    marginTop: 2,
  },
  sessName: {
    fontSize: 13.5,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  sessMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    color: 'rgba(255,255,255,0.36)',
    fontSize: 11.5,
    fontWeight: 500,
  },
  sessSep: {
    opacity: 0.5,
  },
  sessSummary: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.55,
    marginTop: 8,
  },
  sessScore: {
    textAlign: 'right',
    flexShrink: 0,
  },
  sessScoreVal: {
    fontSize: 20,
    fontWeight: 800,
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: '-0.4px',
  },
  sessCounts: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
    marginTop: 4,
    fontSize: 11.5,
    fontWeight: 700,
  },
}
