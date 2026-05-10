import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../lib/api.js'
import { listVariants } from '../../lib/animations.js'
import { getGreeting, formatLongDate } from '../../utils/time.js'
import AlarmModal from '../../components/AlarmModal/AlarmModal.jsx'
import StatPill from '../../components/StatPill/StatPill.jsx'
import Field from '../../components/Field/Field.jsx'
import StyledInput from '../../components/StyledInput/StyledInput.jsx'
import TodoCard from '../../components/TodoCard/TodoCard.jsx'
import { SparkleIcon, PlusIcon, ArrowRight } from '../../components/icons/index.js'
import styles from './Dashboard.module.css'

const INITIAL_FORM = { taskName: '', scheduledTime: '', durationMinutes: 30 }

export default function Dashboard({ onStartSession }) {
  const [todos, setTodos] = useState([])
  const [form, setForm] = useState(INITIAL_FORM)
  const [alarm, setAlarm] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getTodos().then(setTodos)
    api.onAlarmTrigger((data) => setAlarm(data))
  }, [])

  async function addTodo() {
    if (!form.taskName || !form.scheduledTime) return
    setLoading(true)
    await api.addTodo(form)
    const updated = await api.getTodos()
    setTodos(updated)
    setForm(INITIAL_FORM)
    setLoading(false)
  }

  async function startSession(todoId) {
    const result = await api.startSession(todoId)
    if (result.success) {
      onStartSession({ todoId, taskName: result.task, totalSeconds: result.totalSeconds })
      setAlarm(null)
    }
  }

  async function deleteTodo(id) {
    await api.deleteTodo(id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const pending = todos.filter((t) => !t.isCompleted)
  const completed = todos.filter((t) => t.isCompleted)
  const totalMin = pending.reduce((sum, t) => sum + (t.durationMinutes || 0), 0)
  const greeting = getGreeting()
  const today = formatLongDate()

  return (
    <div className={styles.page}>
      <AlarmModal alarm={alarm} onStart={startSession} onDismiss={() => setAlarm(null)} />

      <div className={styles.header}>
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className={styles.greeting}>
            <SparkleIcon /> {greeting}
          </p>
          <h1 className={styles.title}>Today's Tasks</h1>
          <p className={styles.subDate}>{today}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.statStrip}
        >
          <StatPill label="Pending" value={pending.length} accent="#a855f7" />
          <StatPill label="Done" value={completed.length} accent="#4ade80" />
          <StatPill label="Planned" value={`${totalMin}m`} accent="#22d3ee" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={styles.cardWrap}
      >
        <div className={styles.cardGlow} />
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardChip}>
              <PlusIcon /> NEW TASK
            </span>
          </div>
          <div className={styles.formRow}>
            <Field label="Task Name" style={{ flex: 1, minWidth: 220 }}>
              <StyledInput
                placeholder="e.g. Study algorithms"
                value={form.taskName}
                onChange={(v) => setForm({ ...form, taskName: v })}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              />
            </Field>
            <Field label="Start Time" style={{ width: 130 }}>
              <StyledInput
                type="time"
                value={form.scheduledTime}
                onChange={(v) => setForm({ ...form, scheduledTime: v })}
              />
            </Field>
            <Field label="Minutes" style={{ width: 90 }}>
              <StyledInput
                type="number"
                value={form.durationMinutes}
                onChange={(v) => setForm({ ...form, durationMinutes: Number(v) })}
                min={5}
                max={180}
              />
            </Field>
            <motion.button
              whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 10px 32px rgba(139,92,246,0.55)' }}
              whileTap={{ scale: 0.97 }}
              onClick={addTodo}
              disabled={loading}
              className={styles.addBtn}
            >
              {loading ? '...' : (<>Add Task <ArrowRight /></>)}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {pending.length === 0 && completed.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.empty}
          >
            <motion.div
              animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              className={styles.emptyIcon}
            >
              <SparkleIcon size={28} />
            </motion.div>
            <p className={styles.emptyTitle}>No tasks yet</p>
            <p className={styles.emptySub}>Plan your first focus block above</p>
          </motion.div>
        )}
      </AnimatePresence>

      {pending.length > 0 && (
        <div className={styles.upNext}>
          <p className={styles.sectionLabel}>Up Next</p>
          <motion.div variants={listVariants} animate="animate" className={styles.list}>
            <AnimatePresence mode="popLayout">
              {pending.map((todo) => (
                <TodoCard key={todo.id} todo={todo} onStart={startSession} onDelete={deleteTodo} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {completed.length > 0 && (
        <div className={styles.completedSection}>
          <p className={styles.sectionLabel}>Completed Today</p>
          <motion.div className={styles.completedList} variants={listVariants} animate="animate">
            {completed.map((todo) => (
              <TodoCard key={todo.id} todo={todo} onStart={startSession} onDelete={deleteTodo} />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}
