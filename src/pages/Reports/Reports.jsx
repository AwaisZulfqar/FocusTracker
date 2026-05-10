import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../lib/api.js'
import { scoreColor, scoreTone } from '../../utils/score.js'
import StatCard from '../../components/StatCard/StatCard.jsx'
import SessionCard from '../../components/SessionCard/SessionCard.jsx'
import FocusChart from '../../components/FocusChart/FocusChart.jsx'
import {
  SparkleIcon,
  TargetIcon,
  StackIcon,
  TrophyIcon,
  ChartBigIcon,
} from '../../components/icons/index.js'
import styles from './Reports.module.css'

export default function Reports() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getReports(7).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className={styles.loaderWrap}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className={styles.loader}
        />
      </div>
    )
  }

  const allSessions = data.flatMap((d) => d.sessions || [])
  const avgScore = allSessions.length > 0
    ? allSessions.reduce((sum, x) => sum + (x.focusScore || 0), 0) / allSessions.length
    : 0
  const best = allSessions.length > 0 ? Math.max(...allSessions.map((x) => x.focusScore || 0)) : 0
  const totalMin = allSessions.reduce((sum, x) => sum + (x.durationMinutes || 0), 0)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <p className={styles.eyebrow}>
            <SparkleIcon variant="small" size={11} /> ANALYTICS
          </p>
          <h1 className={styles.title}>Focus Report</h1>
          <p className={styles.sub}>Last 7 days · {allSessions.length} sessions tracked</p>
        </motion.div>
      </div>

      {data.length === 0 ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyGlow} />
          <div className={styles.emptyCard}>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className={styles.emptyIcon}
            >
              <ChartBigIcon />
            </motion.div>
            <p className={styles.emptyTitle}>No sessions yet</p>
            <p className={styles.emptySub}>Complete a focus session to see your report</p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.statsGrid}>
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

          <FocusChart data={data} />

          <div>
            <p className={styles.sectionLabel}>Session History</p>
            <div className={styles.list}>
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
