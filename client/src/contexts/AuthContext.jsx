import React, { createContext, useContext, useEffect, useState } from "react"

const AuthContext = createContext(null)

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || "Request failed")
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const me = await api("/api/auth/me")
      setUser(me.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const login = async (email, password) => {
    const out = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })
    setUser(out.user)
    return out
  }

  const signup = async (payload) => {
    const out = await api("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) })
    setUser(out.user)
    return out
  }

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" })
    setUser(null)
  }

  const googleStart = () => {
    window.location.href = "/api/auth/google/start"
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh, googleStart }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
