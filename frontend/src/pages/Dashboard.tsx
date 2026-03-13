import React, { useState, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Badge } from 'primereact/badge'
import { Button } from 'primereact/button'
import { Skeleton } from 'primereact/skeleton'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'

import { DashboardStatsCards } from '@components/dashboard/DashboardStatsCards'
import { RecentExecutions } from '@components/dashboard/RecentExecutions'
import { PerformanceChart } from '@components/dashboard/PerformanceChart'
import { PredictionAlerts } from '@components/dashboard/PredictionAlerts'
import { QuickActions } from '@components/dashboard/QuickActions'

import { useDashboard } from '@hooks/useDashboard'
import { useWebSocket } from '@hooks/useWebSocket'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { useTheme } from '@hooks/useTheme'

const Dashboard: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { isDark } = useTheme()
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds

  const {
    dashboardData,
    recentExecutions,
    performanceMetrics,
    predictions,
    isLoading,
    error,
    refetch
  } = useDashboard({
    refreshInterval,
    autoRefresh: true
  })

  // WebSocket for real-time updates
  useWebSocket({
    events: {
      'job.execution.update': (data) => {
        refetch()
      },
      'predictions.updated': (data) => {
        // Update predictions in real-time
      }
    }
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  if (error) {
    return (
      <div className="dashboard-error p-4">
        <Card>
          <div className="text-center p-4">
            <i className="pi pi-exclamation-triangle text-6xl text-red-500 mb-3" />
            <h3>Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <Button label="Retry" icon="pi pi-refresh" onClick={() => refetch()} />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Cron Collaboration</title>
        <meta name="description" content="Monitor and manage your cron jobs with real-time analytics and predictive insights." />
      </Helmet>

      <motion.div
        className={`dashboard-container ${isMobile ? 'mobile' : 'desktop'}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="dashboard-header mb-4">
          <div className="flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-gray-600">
                Real-time overview of your cron jobs and system performance
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                icon="pi pi-refresh"
                label={isMobile ? '' : 'Refresh'}
                className="p-button-outlined"
                onClick={() => refetch()}
                loading={isLoading}
                tooltip="Refresh dashboard data"
              />
              <Button
                icon="pi pi-plus"
                label={isMobile ? '' : 'Create Job'}
                onClick={() => window.location.href = '/jobs/create'}
                tooltip="Create new cron job"
              />
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="mb-4">
          <QuickActions />
        </motion.div>

        {/* Statistics Cards */}
        <motion.div variants={itemVariants} className="mb-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <Skeleton height="100px" />
                </Card>
              ))}
            </div>
          ) : (
            <DashboardStatsCards data={dashboardData} />
          )}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Performance Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card title="Performance Overview" className="h-full">
              {isLoading ? (
                <Skeleton height="300px" />
              ) : (
                <PerformanceChart
                  data={performanceMetrics}
                  isDark={isDark}
                  isMobile={isMobile}
                />
              )}
            </Card>
          </motion.div>

          {/* Prediction Alerts */}
          <motion.div variants={itemVariants}>
            <Card title="Predictive Alerts" className="h-full">
              {isLoading ? (
                <Skeleton height="300px" />
              ) : (
                <PredictionAlerts
                  predictions={predictions}
                  isMobile={isMobile}
                />
              )}
            </Card>
          </motion.div>

          {/* Recent Executions */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <Card 
              title="Recent Executions" 
              subTitle="Latest cron job executions and their status"
            >
              {isLoading ? (
                <Skeleton height="400px" />
              ) : (
                <RecentExecutions
                  executions={recentExecutions}
                  isMobile={isMobile}
                />
              )}
            </Card>
          </motion.div>
        </div>

        {/* Mobile-specific bottom padding for navigation */}
        {isMobile && <div style={{ height: '80px' }} />}
      </motion.div>
    </>
  )
}

export default Dashboard