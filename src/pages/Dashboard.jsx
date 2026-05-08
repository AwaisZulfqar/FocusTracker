import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const listVariants = {
  animate: { transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function Dashboard({ onStartSession }) {
  const [todos, setTodos] = useState([])
  const [form, setForm] = useState({ taskName: '', scheduledTime: '', durationMinutes: 30 })
  const [alarm, setAlarm] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.api.getTodos().then(setTodos)
    window.api.onAlarmTrigger((data) => setAlarm(data))
  }, [])

  async function addTodo() {
    if (!form.taskName || !form.scheduledTime) return
    setLoading(true)
    await window.api.addTodo(form)
    const updated = await window.api.getTodos()
    setTodos(updated)
    setForm({ taskName: '', scheduledTime: '', durationMinutes: 30 })
    setLoading(false)
  }

  async function startSession(todoId) {
    const result = await window.api.startSession(todoId)
    if (result.success) {
      onStartSession({ todoId, taskName: result.task, totalSeconds: result.totalSeconds })
      setAlarm(null)
    }
  }

  async function deleteTodo(id) {
    await window.api.deleteTodo(id)
    setTodos(todos.filter(t => t.id !== id))
  }

  const pending = todos.filter(t => !t.isCompleted)
  const completed = todos.filter(t => t.isCompleted)
  const totalMin = pending.reduce((sum, t) => sum + (t.durationMinutes || 0), 0)
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={s.page}>
      {/* Alarm Modal */}
      <AnimatePresence>
        {alarm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={s.modalBackdrop}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={s.modalCard}
            >
              <div style={s.modalGlow} />
              <div style={s.modalInner}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [-8, 8, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                  style={s.modalIcon}
                >
                  <ClockIcon size={26} />
                </motion.div>
                <h2 style={s.modalTitle}>Time to Focus</h2>
                <p style={s.modalSub}>
                  Task: <span style={{ color: '#c4b5fd', fontWeight: 600 }}>{alarm.taskName}</span>
                </p>
                <motion.button
                  whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 12px 36px rgba(139,92,246,0.55)' }}
                  whileTap={{ scale: 0.98 }}
                  style={s.primaryBtn}
                  onClick={() => startSession(alarm.todoId)}
                >
                  Start Focus Session
                  <ArrowRight />
                </motion.button>
                <button
                  style={s.skipBtn}
                  onClick={() => setAlarm(null)}
                >
                  Skip this time
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={s.header}>
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p style={s.greeting}>
            <SparkleIcon /> {greeting}
          </p>
          <h1 style={s.title}>Today's Tasks</h1>
          <p style={s.subDate}>{today}</p>
        </motion.div>

        {/* Stat strip */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={s.statStrip}
        >
          <StatPill label="Pending" value={pending.length} accent="#a855f7" />
          <StatPill label="Done" value={completed.length} accent="#4ade80" />
          <StatPill label="Planned" value={`${totalMin}m`} accent="#22d3ee" />
        </motion.div>
      </div>

      {/* Add Task Card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={s.cardWrap}
      >
        <div style={s.cardGlow} />
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardChip}>
              <PlusIcon /> NEW TASK
            </span>
          </div>
          <div style={s.formRow}>
            <Field label="Task Name" style={{ flex: 1, minWidth: 220 }}>
              <StyledInput
                placeholder="e.g. Study algorithms"
                value={form.taskName}
                onChange={v => setForm({ ...form, taskName: v })}
                onKeyDown={e => e.key === 'Enter' && addTodo()}
              />
            </Field>
            <Field label="Start Time" style={{ width: 130 }}>
              <StyledInput
                type="time"
                value={form.scheduledTime}
                onChange={v => setForm({ ...form, scheduledTime: v })}
              />
            </Field>
            <Field label="Minutes" style={{ width: 90 }}>
              <StyledInput
                type="number"
                value={form.durationMinutes}
                onChange={v => setForm({ ...form, durationMinutes: Number(v) })}
                min={5} max={180}
              />
            </Field>
            <motion.button
              whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 10px 32px rgba(139,92,246,0.55)' }}
              whileTap={{ scale: 0.97 }}
              onClick={addTodo}
              disabled={loading}
              style={{ ...s.primaryBtn, width: 'auto', padding: '10px 18px', marginTop: 0 }}
            >
              {loading ? '...' : (<>Add Task <ArrowRight /></>)}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Pending */}
      <AnimatePresence mode="popLayout">
        {pending.length === 0 && completed.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={s.empty}
          >
            <motion.div
              animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              style={s.emptyIcon}
            >
              <SparkleIcon size={28} />
            </motion.div>
            <p style={s.emptyTitle}>No tasks yet</p>
            <p style={s.emptySub}>Plan your first focus block above</p>
          </motion.div>
        )}
      </AnimatePresence>

      {pending.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <p style={s.sectionLabel}>Up Next</p>
          <motion.div variants={listVariants} animate="animate" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence mode="popLayout">
              {pending.map(todo => (
                <TodoCard key={todo.id} todo={todo} onStart={startSession} onDelete={deleteTodo} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div style={{ marginTop: 26 }}>
          <p style={s.sectionLabel}>Completed Today</p>
          <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.55 }} variants={listVariants} animate="animate">
            {completed.map(todo => (
              <TodoCard key={todo.id} todo={todo} onStart={startSession} onDelete={deleteTodo} />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}

/* ── TodoCard ── */
function TodoCard({ todo, onStart, onDelete }) {
  const [hover, setHover] = useState(false)
  return (
    <motion.div
      variants={itemVariants}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      style={s.todoWrap}
    >
      <div style={{ ...s.todoGlow, opacity: hover && !todo.isCompleted ? 1 : 0.5 }} />
      <div style={s.todoCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{
            ...s.todoDot,
            background: todo.isCompleted ? 'rgba(74,222,128,0.3)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
            boxShadow: todo.isCompleted ? '0 0 8px rgba(74,222,128,0.4)' : '0 0 10px rgba(168,85,247,0.6)',
          }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ ...s.todoName, textDecoration: todo.isCompleted ? 'line-through' : 'none' }}>
              {todo.taskName}
            </p>
            <div style={s.todoMeta}>
              <span style={s.todoMetaItem}>
                <ClockIcon size={11} /> {todo.scheduledTime}
              </span>
              <span style={s.todoSep}>·</span>
              <span style={s.todoMetaItem}>
                <TimerIcon size={11} /> {todo.durationMinutes} min
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {todo.isCompleted ? (
            <span style={s.doneBadge}>
              <CheckIcon /> Done
            </span>
          ) : (
            <motion.button
              whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 8px 22px rgba(139,92,246,0.5)' }}
              whileTap={{ scale: 0.96 }}
              style={s.startBtn}
              onClick={() => onStart(todo.id)}
            >
              Start <ArrowRight size={11} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.08, color: '#fca5a5' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onDelete(todo.id)}
            style={{ ...s.deleteBtn, opacity: hover ? 1 : 0 }}
          >
            <TrashIcon />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Field & Input ── */
function Field({ label, children, style }) {
  return (
    <div style={style}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

function StyledInput({ type = 'text', placeholder, value, onChange, onKeyDown, min, max }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      min={min}
      max={max}
      style={{
        ...s.input,
        border: focused ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.14), inset 0 1px 2px rgba(0,0,0,0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.3)',
        background: focused ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.04)',
      }}
    />
  )
}

function StatPill({ label, value, accent }) {
  return (
    <div style={s.statPill}>
      <p style={{ ...s.statValue, color: accent }}>{value}</p>
      <p style={s.statLabel}>{label}</p>
    </div>
  )
}

/* ── SVG ── */
function SparkleIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9z" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function ClockIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function TimerIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="2" x2="14" y2="2" />
      <line x1="12" y1="14" x2="15" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function ArrowRight({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
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
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 26,
    flexWrap: 'wrap',
  },
  greeting: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: 'rgba(168,85,247,0.85)',
    fontWeight: 500,
    margin: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '-0.6px',
    margin: '6px 0 4px',
  },
  subDate: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.32)',
    margin: 0,
    fontWeight: 500,
  },
  statStrip: {
    display: 'flex',
    gap: 8,
  },
  statPill: {
    minWidth: 78,
    padding: '10px 14px',
    borderRadius: 12,
    background: 'rgba(124,58,237,0.06)',
    border: '1px solid rgba(139,92,246,0.16)',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 800,
    margin: 0,
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  cardWrap: {
    position: 'relative',
    borderRadius: 18,
    marginBottom: 4,
  },
  cardGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: 19,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(34,211,238,0.12) 50%, rgba(124,58,237,0.08) 100%)',
    filter: 'blur(0.5px)',
    zIndex: -1,
  },
  card: {
    position: 'relative',
    background: 'rgba(10,10,18,0.85)',
    borderRadius: 18,
    padding: '20px 22px',
    backdropFilter: 'blur(40px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderRadius: 999,
    background: 'rgba(168,85,247,0.12)',
    border: '1px solid rgba(168,85,247,0.22)',
    color: '#c4b5fd',
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: '0.1em',
  },
  formRow: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  fieldLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    letterSpacing: '0.04em',
  },
  input: {
    width: '100%',
    padding: '10px 13px',
    borderRadius: 10,
    fontSize: 13,
    color: '#fff',
    outline: 'none',
    transition: 'border 0.18s, box-shadow 0.18s, background 0.18s',
    fontFamily: 'inherit',
    colorScheme: 'dark',
  },
  primaryBtn: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 11,
    border: 'none',
    background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #a855f7 75%, #38bdf8 100%)',
    color: '#fff',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'filter 0.2s, box-shadow 0.2s',
    boxShadow: '0 8px 24px rgba(124,58,237,0.42)',
    marginTop: 4,
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  empty: {
    textAlign: 'center',
    padding: '64px 20px',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 28,
  },
  emptyIcon: {
    display: 'inline-flex',
    color: '#a855f7',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.55)',
    margin: 0,
  },
  emptySub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.28)',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.32)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  todoWrap: {
    position: 'relative',
    borderRadius: 14,
  },
  todoGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: 15,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(34,211,238,0.06) 60%, rgba(124,58,237,0.04))',
    transition: 'opacity 0.25s',
    zIndex: -1,
  },
  todoCard: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 14,
    background: 'rgba(12,12,22,0.85)',
    border: '1px solid rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
  },
  todoDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  todoName: {
    fontSize: 13.5,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  todoMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    color: 'rgba(255,255,255,0.38)',
    fontSize: 11.5,
    fontWeight: 500,
  },
  todoMetaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  todoSep: { opacity: 0.5 },
  doneBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    padding: '5px 10px',
    borderRadius: 999,
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.22)',
    color: '#4ade80',
    letterSpacing: '0.04em',
  },
  startBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '7px 14px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #6d28d9, #7c3aed, #a855f7)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
    fontFamily: 'inherit',
    transition: 'filter 0.18s, box-shadow 0.18s',
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(248,113,113,0.7)',
    padding: 6,
    borderRadius: 8,
    transition: 'opacity 0.18s, color 0.18s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    zIndex: 50,
  },
  modalCard: {
    position: 'relative',
    width: '100%',
    maxWidth: 360,
    margin: '0 20px',
    borderRadius: 20,
  },
  modalGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: 21,
    background: 'linear-gradient(135deg, rgba(168,85,247,0.5), rgba(34,211,238,0.18) 50%, rgba(124,58,237,0.1))',
    filter: 'blur(1px)',
    zIndex: -1,
  },
  modalInner: {
    background: 'rgba(10,10,18,0.95)',
    borderRadius: 20,
    padding: 28,
    textAlign: 'center',
    boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
  },
  modalIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 18,
    background: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(124,58,237,0.18))',
    border: '1px solid rgba(168,85,247,0.28)',
    color: '#c4b5fd',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.3px',
  },
  modalSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    margin: '6px 0 22px',
  },
  skipBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    cursor: 'pointer',
    marginTop: 12,
    fontFamily: 'inherit',
  },
}
