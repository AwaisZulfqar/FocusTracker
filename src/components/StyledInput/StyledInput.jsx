import { useState } from 'react'
import styles from './StyledInput.module.css'

export default function StyledInput({ type = 'text', placeholder, value, onChange, onKeyDown, min, max }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      min={min}
      max={max}
      className={`${styles.input} ${focused ? styles.inputFocused : ''}`}
    />
  )
}
