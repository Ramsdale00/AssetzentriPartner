import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import Leads from './pages/Leads'
import DealDetail from './pages/DealDetail'
import Collateral from './pages/Collateral'
import Team from './pages/Team'
import AdminOps from './pages/AdminOps'
import AdminDeals from './pages/AdminDeals'
import AdminPartners from './pages/AdminPartners'
import AdminPartnerDetail from './pages/AdminPartnerDetail'

function ProtectedRoute({ children, requirePersona }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, color: 'var(--muted)', fontSize: 14 }}>
        <div className="spinner" />
        Loading...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (requirePersona && user.persona !== requirePersona) {
    if (user.persona === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <Layout>{children}</Layout>
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.persona === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginGuard />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Partner routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute requirePersona="partner"><Dashboard /></ProtectedRoute>
      } />
      <Route path="/onboarding" element={
        <ProtectedRoute requirePersona="partner"><Onboarding /></ProtectedRoute>
      } />
      <Route path="/leads" element={
        <ProtectedRoute requirePersona="partner"><Leads /></ProtectedRoute>
      } />
      <Route path="/leads/:dealId" element={
        <ProtectedRoute requirePersona="partner"><DealDetail /></ProtectedRoute>
      } />
      <Route path="/collateral" element={
        <ProtectedRoute requirePersona="partner"><Collateral /></ProtectedRoute>
      } />
      <Route path="/team" element={
        <ProtectedRoute requirePersona="partner"><Team /></ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requirePersona="admin"><AdminOps /></ProtectedRoute>
      } />
      <Route path="/admin/deals" element={
        <ProtectedRoute requirePersona="admin"><AdminDeals /></ProtectedRoute>
      } />
      <Route path="/admin/partners" element={
        <ProtectedRoute requirePersona="admin"><AdminPartners /></ProtectedRoute>
      } />
      <Route path="/admin/partners/:id" element={
        <ProtectedRoute requirePersona="admin"><AdminPartnerDetail /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function LoginGuard() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    if (user.persona === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/dashboard" replace />
  }
  return <Login />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
