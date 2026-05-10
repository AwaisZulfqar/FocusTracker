export function scoreColor(score) {
  if (score >= 70) return '#4ade80'
  if (score >= 40) return '#fbbf24'
  return '#f87171'
}

export function scoreTone(score) {
  if (score >= 70) return 'Excellent'
  if (score >= 40) return 'Good'
  return 'Needs Focus'
}

export function scoreEmoji(score) {
  if (score >= 70) return '🎯'
  if (score >= 40) return '⚡'
  return '📊'
}
