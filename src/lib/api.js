const api = typeof window !== 'undefined' ? window.api : null

if (!api && typeof window !== 'undefined') {
  console.warn('window.api preload bridge missing')
}

export default api
