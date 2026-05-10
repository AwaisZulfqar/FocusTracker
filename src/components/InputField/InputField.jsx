import { useState } from 'react'
import EyeIcon from '../icons/EyeIcon.jsx'
import EyeOffIcon from '../icons/EyeOffIcon.jsx'
import styles from './InputField.module.css'

export default function InputField({ id, label, type, placeholder, icon, value, onChange }) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.wrap}>
        <span className={`${styles.icon} ${focused ? styles.iconActive : ''}`}>
          {icon}
        </span>
        <input
          id={id}
          type={isPassword && !show ? 'password' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          className={`${styles.input} ${focused ? styles.inputFocused : ''} ${isPassword ? styles.inputWithRight : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className={styles.eyeBtn}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  )
}
