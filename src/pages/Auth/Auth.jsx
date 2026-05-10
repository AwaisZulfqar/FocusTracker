import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FloatingOrb from '../../components/FloatingOrb/FloatingOrb.jsx'
import Particle from '../../components/Particle/Particle.jsx'
import InputField from '../../components/InputField/InputField.jsx'
import { EmailIcon, LockIcon, PersonIcon } from '../../components/icons/index.js'
import { AUTH_PARTICLES } from '../../constants/particles.js'
import api from '../../lib/api.js'
import styles from './Auth.module.css'

const INITIAL_FORM = { email: '', password: '', username: '' }

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fn = mode === 'login' ? api.login : api.signup
    const result = await fn(form)
    setLoading(false)
    if (result.error) return setError(result.error)
    onLogin(result)
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'))
    setError('')
    setForm(INITIAL_FORM)
  }

  function selectTab(tab) {
    setMode(tab)
    setError('')
    setForm(INITIAL_FORM)
  }

  return (
    <div className={styles.page}>
      <FloatingOrb style={{ top: '-120px', right: '-80px', width: 520, height: 520, background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 68%)' }} />
      <FloatingOrb style={{ bottom: '-100px', left: '-60px', width: 400, height: 400, background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 68%)' }} />
      <FloatingOrb style={{ top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 65%)' }} />

      {AUTH_PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      <div className={styles.gridOverlay} />

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={styles.cardWrap}
        >
          <div className={styles.cardGlow} />

          <div className={styles.card}>
            <div className={styles.shimmer} />

            <div className={styles.logoSection}>
              <motion.div
                whileHover={{ scale: 1.07, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
                className={styles.logoWrap}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                  className={styles.logoRing}
                />
                <span className={styles.logoBolt}>⚡</span>
              </motion.div>

              <div>
                <h1 className={styles.brand}>FocusTracker</h1>
                <p className={styles.tagline}>
                  {mode === 'login' ? 'Welcome back, stay focused.' : 'Start your productivity journey.'}
                </p>
              </div>
            </div>

            <div className={styles.tabBar}>
              {['login', 'signup'].map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => selectTab(tab)}
                  className={`${styles.tab} ${mode === tab ? styles.tabActive : ''}`}
                  whileTap={{ scale: 0.97 }}
                >
                  {tab === 'login' ? 'Sign In' : 'Sign Up'}
                  {mode === tab && (
                    <motion.div layoutId="tab-indicator" className={styles.tabIndicator} />
                  )}
                </motion.button>
              ))}
            </div>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or with email</span>
              <div className={styles.dividerLine} />
            </div>

            <form onSubmit={submit} className={styles.form}>
              <InputField
                id="auth-email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<EmailIcon />}
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              {mode === 'signup' && (
                <InputField
                  id="auth-username"
                  label="User Name"
                  type="text"
                  placeholder="Enter Your Name"
                  icon={<PersonIcon />}
                  value={form.username}
                  onChange={(v) => setForm((f) => ({ ...f, username: v }))}
                />
              )}
              <div>
                <InputField
                  id="auth-password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<LockIcon />}
                  value={form.password}
                  onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                />
                {mode === 'login' && (
                  <motion.button
                    whileHover={{ color: '#c084fc' }}
                    type="button"
                    className={styles.forgotBtn}
                  >
                    Forgot password?
                  </motion.button>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className={styles.errorBox}
                  >
                    <span className={styles.errorIcon}>⚠</span> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 10px 36px rgba(139,92,246,0.6), 0 0 0 1px rgba(168,85,247,0.3)' }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                type="submit"
                className={styles.submitBtn}
              >
                {loading ? (
                  <span className={styles.btnRow}>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                      className={styles.spinner}
                    />
                    Please wait…
                  </span>
                ) : (
                  <span className={styles.btnRow}>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                      className={styles.btnArrow}
                    >
                      →
                    </motion.span>
                  </span>
                )}
              </motion.button>
            </form>

            <p className={styles.footer}>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <motion.button
                whileHover={{ color: '#d8b4fe' }}
                type="button"
                onClick={switchMode}
                className={styles.switchBtn}
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </motion.button>
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
