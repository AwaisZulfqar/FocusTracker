import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Floating Orb ─────────────────────────────────────────────────── */
function FloatingOrb({ style }) {
  return <div style={{ ...orbBase, ...style }} />
}

/* ─── Particle ─────────────────────────────────────────────────────── */
function Particle({ x, y, delay, size }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%', background: 'rgba(168,85,247,0.7)', pointerEvents: 'none' }}
      animate={{ opacity: [0, 0.8, 0], y: [0, -24, -48], scale: [0.5, 1.2, 0.3] }}
      transition={{ repeat: Infinity, duration: 4 + delay, delay, ease: 'easeOut' }}
    />
  )
}

const PARTICLES = [
  { x: '12%', y: '75%', delay: 0, size: 3 },
  { x: '88%', y: '20%', delay: 1.2, size: 2 },
  { x: '30%', y: '60%', delay: 2.4, size: 2 },
  { x: '70%', y: '80%', delay: 0.6, size: 3 },
  { x: '55%', y: '15%', delay: 1.8, size: 2 },
  { x: '92%', y: '60%', delay: 3, size: 2 },
  { x: '5%', y: '35%', delay: 0.3, size: 2 },
  { x: '48%', y: '90%', delay: 2, size: 3 },
]

/* ─── Main Auth Component ─────────────────────────────────────────── */
export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fn = mode === 'login' ? window.api.login : window.api.signup
    const result = await fn(form)
    setLoading(false)
    if (result.error) return setError(result.error)
    onLogin(result)
  }

  function switchMode() {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setError('')
    setForm({ email: '', password: '', username: '' })
  }

  return (
    <div style={s.page}>
      {/* ── Ambient Orbs ── */}
      <FloatingOrb style={{ top: '-120px', right: '-80px', width: 520, height: 520, background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 68%)' }} />
      <FloatingOrb style={{ bottom: '-100px', left: '-60px', width: 400, height: 400, background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 68%)' }} />
      <FloatingOrb style={{ top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, background: 'radial-gradient(circle, rgba(109,40,217,0.07) 0%, transparent 65%)' }} />

      {/* ── Particles ── */}
      {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* ── Grid texture ── */}
      <div style={s.gridOverlay} />

      {/* ── Card ── */}
      <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={s.cardWrap}
      >
        {/* Glowing border effect */}
        <div style={s.cardGlow} />

        <div style={s.card}>
          {/* Top shimmer */}
          <div style={s.shimmer} />

          {/* ── Logo + Brand ── */}
          <div style={s.logoSection}>
            <motion.div
              whileHover={{ scale: 1.07, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.4 }}
              style={s.logoWrap}
            >
              {/* Animated ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                style={s.logoRing}
              />
              <span style={{ fontSize: 22, position: 'relative', zIndex: 1 }}>⚡</span>
            </motion.div>

            <div>
              <h1 style={s.brand}>FocusTracker</h1>
              <p style={s.brandTagline}>
                {mode === 'login' ? 'Welcome back, stay focused.' : 'Start your productivity journey.'}
              </p>
            </div>
          </div>

          {/* ── Tab Toggle ── */}
          <div style={s.tabBar}>
            {['login', 'signup'].map(tab => (
              <motion.button
                key={tab}
                onClick={() => { setMode(tab); setError(''); setForm({ email: '', password: '', username: '' }) }}
                style={{ ...s.tab, ...(mode === tab ? s.tabActive : {}) }}
                whileTap={{ scale: 0.97 }}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
                {mode === tab && (
                  <motion.div layoutId="tab-indicator" style={s.tabIndicator} />
                )}
              </motion.button>
            ))}
          </div>

          {/* ── Divider ── */}
          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or with email</span>
            <div style={s.dividerLine} />
          </div>

          {/* ── Form ── */}
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InputField
              id="auth-email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={<EmailIcon />}
              value={form.email}
              onChange={v => setForm(f => ({ ...f, email: v }))}
            />
            {mode === 'signup' && (
              <InputField
                id="auth-username"
                label="User Name"
                type="text"
                placeholder="Enter Your Name"
                icon={<PersonIcon />}
                value={form.username}
                onChange={v => setForm(f => ({ ...f, username: v }))}
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
                onChange={v => setForm(f => ({ ...f, password: v }))}
              />
              {mode === 'login' && (
                <motion.button
                  whileHover={{ color: '#c084fc' }}
                  type="button"
                  style={s.forgotBtn}
                >
                  Forgot password?
                </motion.button>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  style={s.errorBox}
                >
                  <span style={{ fontSize: 14 }}>⚠</span> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={{ filter: 'brightness(1.1)', boxShadow: '0 10px 36px rgba(139,92,246,0.6), 0 0 0 1px rgba(168,85,247,0.3)' }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              style={s.submitBtn}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                    style={s.spinner}
                  />
                  Please wait…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                    style={{ fontSize: 15, lineHeight: 1 }}
                  >
                    →
                  </motion.span>
                </span>
              )}
            </motion.button>
          </form>

          {/* ── Footer ── */}
          <p style={s.footer}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <motion.button
              whileHover={{ color: '#d8b4fe' }}
              type="button"
              onClick={switchMode}
              style={s.switchBtn}
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

/* ─── Input Field ─────────────────────────────────────────────────── */
function InputField({ id, label, type, placeholder, icon, value, onChange }) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label htmlFor={id} style={s.label}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Left icon */}
        <span style={{
          position: 'absolute', left: 13,
          color: focused ? 'rgba(168,85,247,0.7)' : 'rgba(255,255,255,0.22)',
          transition: 'color 0.2s',
          display: 'flex', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {icon}
        </span>

        <input
          id={id}
          type={isPassword && !show ? 'password' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          style={{
            ...s.input,
            paddingLeft: 40,
            paddingRight: isPassword ? 44 : 14,
            border: focused ? '1px solid rgba(139,92,246,0.65)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.14), inset 0 1px 2px rgba(0,0,0,0.3)' : 'inset 0 1px 2px rgba(0,0,0,0.3)',
            background: focused ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.04)',
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            style={s.eyeBtn}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── SVG Icons ───────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-2.8-11.3-7l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.9 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

/* ─── Style Constants ─────────────────────────────────────────────── */
const orbBase = {
  position: 'absolute',
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: 0,
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#07070f',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139,92,246,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  cardWrap: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: 440,
    margin: '0 20px',
  },
  cardGlow: {
    position: 'absolute',
    inset: -1,
    borderRadius: 22,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.45) 0%, rgba(34,211,238,0.15) 50%, rgba(124,58,237,0.1) 100%)',
    filter: 'blur(1px)',
    zIndex: -1,
  },
  card: {
    background: 'rgba(10,10,18,0.92)',
    borderRadius: 20,
    padding: '34px 30px 28px',
    backdropFilter: 'blur(60px)',
    WebkitBackdropFilter: 'blur(60px)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60%',
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 26,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a855f7 100%)',
    boxShadow: '0 10px 32px rgba(124,58,237,0.5), 0 0 0 1px rgba(168,85,247,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  logoRing: {
    position: 'absolute',
    inset: -3,
    borderRadius: 19,
    border: '1.5px solid transparent',
    background: 'linear-gradient(135deg, rgba(168,85,247,0.6), rgba(34,211,238,0.3), rgba(168,85,247,0.1)) border-box',
    WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'destination-out',
    maskComposite: 'exclude',
  },
  brand: {
    fontSize: 18,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-0.4px',
    lineHeight: 1.2,
    margin: 0,
  },
  brandTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.38)',
    marginTop: 2,
    fontWeight: 400,
    lineHeight: 1,
  },
  tabBar: {
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 22,
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 9,
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.38)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    position: 'relative',
    transition: 'color 0.2s',
    fontFamily: 'inherit',
  },
  tabActive: {
    background: 'rgba(124,58,237,0.2)',
    color: '#fff',
    border: '1px solid rgba(124,58,237,0.3)',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '30%',
    height: 2,
    background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
    borderRadius: 2,
  },
  googleBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '11px 16px',
    borderRadius: 11,
    border: '1px solid rgba(255,255,255,0.11)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s',
    marginBottom: 16,
    fontFamily: 'inherit',
  },
  googleLabel: {
    fontSize: 13.5,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: '0.01em',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(255,255,255,0.07)',
  },
  dividerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.24)',
    fontWeight: 500,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 7,
    letterSpacing: '0.02em',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    fontSize: 13.5,
    color: '#fff',
    outline: 'none',
    transition: 'border 0.18s, box-shadow 0.18s, background 0.18s',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.28)',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    transition: 'color 0.15s',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.32)',
    padding: '5px 0 0',
    display: 'block',
    textAlign: 'right',
    width: '100%',
    transition: 'color 0.2s',
    fontFamily: 'inherit',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 13px',
    borderRadius: 9,
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#fca5a5',
    fontSize: 12,
    overflow: 'hidden',
  },
  submitBtn: {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 11,
    border: 'none',
    background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #a855f7 75%, #38bdf8 100%)',
    backgroundSize: '200% 200%',
    color: '#fff',
    fontSize: 14.5,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
    transition: 'filter 0.2s, box-shadow 0.2s',
    boxShadow: '0 8px 28px rgba(124,58,237,0.45)',
    marginTop: 4,
    fontFamily: 'inherit',
  },
  spinner: {
    display: 'inline-block',
    width: 15,
    height: 15,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: '#fff',
  },
  footer: {
    textAlign: 'center',
    marginTop: 22,
    fontSize: 13,
    color: 'rgba(255,255,255,0.32)',
    lineHeight: 1,
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    color: '#a78bfa',
    padding: 0,
    marginLeft: 4,
    transition: 'color 0.15s',
    fontFamily: 'inherit',
  },
}
