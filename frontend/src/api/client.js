import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('az_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally — but never for the auth flow itself. A 401 from
// login/verify-magic-link is an expected outcome (bad credentials, expired or
// already-used link) that the page handles inline; redirecting here would wipe
// a freshly issued session and bounce the user back to the sign-in page.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthFlow = url.includes('/auth/login') || url.includes('/auth/verify-magic-link')
    if (error.response?.status === 401 && !isAuthFlow) {
      localStorage.removeItem('az_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
