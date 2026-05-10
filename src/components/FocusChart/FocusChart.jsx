import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { scoreColor } from '../../utils/score.js'
import styles from './FocusChart.module.css'

function Legend({ color, label }) {
  return (
    <div className={styles.legend}>
      <span className={styles.legendDot} style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span className={styles.legendLabel}>{label}</span>
    </div>
  )
}

export default function FocusChart({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className={styles.wrap}
    >
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>DAILY PERFORMANCE</p>
            <p className={styles.title}>Focus Score by Day</p>
          </div>
          <div className={styles.legendRow}>
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
              tickFormatter={(d) => d.slice(5)}
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
                <Cell
                  key={i}
                  fill={`url(#bar-${i})`}
                  style={{ filter: `drop-shadow(0 0 8px ${scoreColor(entry.avg_focus)}55)` }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
