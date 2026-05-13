import React, { createContext, useContext, useState, useEffect } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('az_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      client.get('/auth/me')
        .then((res) => {
          setUser(res.data)
        })
        .catch(() => {
          localStorage.removeItem('az_token')
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password })
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('az_token', newToken)
    setToken(newToken)
    setUser(newUser)
    return newUser
  }

  const logout = () => {
    localStorage.removeItem('az_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
