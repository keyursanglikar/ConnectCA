// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// CA Pages
import Dashboard from './pages/ca/Dashboard'
import Clients from './pages/ca/Clients'
import ClientDetail from './pages/ca/ClientDetail'
import CADocuments from './pages/ca/Documents'
import FeeStructure from './pages/ca/FeeStructure'
import Invoices from './pages/ca/Invoices'
import Reports from './pages/ca/Reports'
import Settings from './pages/ca/Settings'
import CreateClient from './pages/ca/CreateClient'
import ClientDocuments from './pages/ca/ClientDocuments'
import ClientsAdd from './pages/ca/ClientsAdd'
import Submissions from './pages/ca/Submissions'
import SubmissionDetail from './pages/ca/SubmissionDetail'
import ComputationBill from './pages/ca/ComputationBill'

// Client Pages
import ClientDashboard from './pages/client/ClientDashboard'
import ClientDocs from './pages/client/Documents'
import ViewInvoices from './pages/client/ViewInvoices'
import StatusTracker from './pages/client/StatusTracker'
import MyFeePamplate from './pages/client/MyFeePamplate'

// Super Admin Pages
import SuperAdminDashboard from './pages/Superadmin/Dashboard'
import CAManagement from './pages/Superadmin/CAManagement'
import AuditLogs from './pages/Superadmin/AuditLogs'
import SystemSettings from './pages/Superadmin/SystemSettings'
import CreateCA from './pages/Superadmin/CreateCA'


// Test component
import TestTailwind from './components/TestTailwind'

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B2A4A] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (roles && !roles.includes(user?.role)) {
    if (user?.role === 'SUPER_ADMIN') {
      return <Navigate to="/super-admin/dashboard" replace />
    } else if (user?.role === 'CA') {
      return <Navigate to="/ca/dashboard" replace />
    } else if (user?.role === 'CLIENT') {
      return <Navigate to="/client/dashboard" replace />
    }
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/test" element={<TestTailwind />} />
      
      {/* SUPER ADMIN ROUTES */}
      <Route path="/super-admin/dashboard" element={
        <PrivateRoute roles={['SUPER_ADMIN']}>
          <SuperAdminDashboard />
        </PrivateRoute>
      } />
      <Route path="/super-admin/ca-management" element={
        <PrivateRoute roles={['SUPER_ADMIN']}>
          <CAManagement />
        </PrivateRoute>
      } />
      <Route path="/super-admin/audit-logs" element={
        <PrivateRoute roles={['SUPER_ADMIN']}>
          <AuditLogs />
        </PrivateRoute>
      } />
      <Route path="/super-admin/settings" element={
        <PrivateRoute roles={['SUPER_ADMIN']}>
          <SystemSettings />
        </PrivateRoute>
      } />
      <Route path="/super-admin/create-ca" element={
        <PrivateRoute roles={['SUPER_ADMIN']}>
          <CreateCA />
        </PrivateRoute>
      } />
      
      {/* CA ROUTES */}
      <Route path="/ca/dashboard" element={
        <PrivateRoute roles={['CA']}>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/ca/clients" element={
        <PrivateRoute roles={['CA']}>
          <Clients />
        </PrivateRoute>
      } />
      <Route path="/ca/clients/:id" element={
        <PrivateRoute roles={['CA']}>
          <ClientDetail />
        </PrivateRoute>
      } />
      <Route path="/ca/clients/add" element={
        <PrivateRoute roles={['CA']}>
          <CreateClient />
        </PrivateRoute>
      } />
      <Route path="/ca/clients/:id/documents" element={
        <PrivateRoute roles={['CA']}>
          <ClientDocuments />
        </PrivateRoute>
      } />
      <Route path="/ca/documents" element={
        <PrivateRoute roles={['CA']}>
          <CADocuments />
        </PrivateRoute>
      } />
      <Route path="/ca/fees" element={
        <PrivateRoute roles={['CA']}>
          <FeeStructure />
        </PrivateRoute>
      } />
      <Route path="/ca/invoices" element={
        <PrivateRoute roles={['CA']}>
          <Invoices />
        </PrivateRoute>
      } />
      <Route path="/ca/reports" element={
        <PrivateRoute roles={['CA']}>
          <Reports />
        </PrivateRoute>
      } />
      <Route path="/ca/settings" element={
        <PrivateRoute roles={['CA']}>
          <Settings />
        </PrivateRoute>
      } />
      
      {/* CA SUBMISSIONS ROUTES */}
      <Route path="/ca/submissions" element={
        <PrivateRoute roles={['CA']}>
          <Submissions />
        </PrivateRoute>
      } />
      <Route path="/ca/submissions/:id" element={
        <PrivateRoute roles={['CA']}>
          <SubmissionDetail />
        </PrivateRoute>
      } />

      <Route path="/ca/submissions/:id/computation-bill" element={
        <PrivateRoute roles={['CA']}>
          <ComputationBill />
        </PrivateRoute>
      } />
      
      {/* CLIENT ROUTES */}
      <Route path="/client/dashboard" element={
        <PrivateRoute roles={['CLIENT']}>
          <ClientDashboard />
        </PrivateRoute>
      } />
      <Route path="/client/documents" element={
        <PrivateRoute roles={['CLIENT']}>
          <ClientDocs />
        </PrivateRoute>
      } />
      <Route path="/client/invoices" element={
        <PrivateRoute roles={['CLIENT']}>
          <ViewInvoices />
        </PrivateRoute>
      } />
      <Route path="/client/status" element={
        <PrivateRoute roles={['CLIENT']}>
          <StatusTracker />
        </PrivateRoute>
      } />
      <Route path="/client/fee-pamplate" element={
        <PrivateRoute roles={['CLIENT']}>
          <MyFeePamplate />
        </PrivateRoute>
      } />

      <Route path="/client/submissions/:id/computation-bill" element={
  <PrivateRoute roles={['CLIENT']}>
    <ComputationBill />
  </PrivateRoute>
} />
      
      {/* DEFAULT ROUTE */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App