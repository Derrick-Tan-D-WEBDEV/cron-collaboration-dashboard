import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PrimeReactProvider } from 'primereact/api'
import { ProgressSpinner } from 'primereact/progressspinner'

import Layout from '@components/Layout'
import { useAuth } from '@hooks/useAuth'
import { useTheme } from '@hooks/useTheme'
import ProtectedRoute from '@components/ProtectedRoute'

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('@pages/Dashboard'))
const CronJobs = React.lazy(() => import('@pages/CronJobs'))
const Analytics = React.lazy(() => import('@pages/Analytics'))
const PredictiveInsights = React.lazy(() => import('@pages/PredictiveInsights'))
const Reports = React.lazy(() => import('@pages/Reports'))
const Settings = React.lazy(() => import('@pages/Settings'))
const Login = React.lazy(() => import('@pages/Login'))
const NotFound = React.lazy(() => import('@pages/NotFound'))

const LoadingSpinner = () => (
  <div className="flex justify-content-center align-items-center" style={{ height: '50vh' }}>
    <ProgressSpinner />
  </div>
)

const App: React.FC = () => {
  const { theme } = useTheme()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <PrimeReactProvider value={{ ripple: true }}>
      <div className={`app ${theme}`} data-theme={theme}>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/" replace /> : <Login />
              } 
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="jobs" element={<CronJobs />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="insights" element={<PredictiveInsights />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </PrimeReactProvider>
  )
}

export default App