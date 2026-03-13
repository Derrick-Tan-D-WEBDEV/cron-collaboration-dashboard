import React, { useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Chart } from 'primereact/chart'
import { ProgressBar } from 'primereact/progressbar'
import { Helmet } from 'react-helmet-async'

// Mock data for a nice-looking dashboard
const stats = [
  { title: 'Total Jobs', value: '48', icon: 'pi pi-clock', bg: '#3B82F6', trend: '+5', trendUp: true },
  { title: 'Active Now', value: '12', icon: 'pi pi-play', bg: '#10B981', trend: '+3', trendUp: true },
  { title: 'Success Rate', value: '97.2%', icon: 'pi pi-check-circle', bg: '#8B5CF6', trend: '+1.4%', trendUp: true },
  { title: 'Avg Runtime', value: '4.2s', icon: 'pi pi-stopwatch', bg: '#F59E0B', trend: '-0.8s', trendUp: true },
]

const recentExecutions = [
  { id: 'exec-001', name: 'db-backup-daily', status: 'completed', duration: '3.2s', time: '2 min ago' },
  { id: 'exec-002', name: 'email-digest', status: 'completed', duration: '1.1s', time: '15 min ago' },
  { id: 'exec-003', name: 'cache-cleanup', status: 'running', duration: '—', time: 'Now' },
  { id: 'exec-004', name: 'report-generation', status: 'failed', duration: '12.4s', time: '1 hr ago' },
  { id: 'exec-005', name: 'log-rotation', status: 'completed', duration: '0.8s', time: '2 hrs ago' },
  { id: 'exec-006', name: 'health-check', status: 'completed', duration: '0.3s', time: '3 hrs ago' },
]

const chartData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Successful',
      data: [42, 38, 45, 50, 47, 35, 44],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Failed',
      data: [2, 1, 0, 3, 1, 0, 1],
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
    },
  ],
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' as const, labels: { color: '#94a3b8', usePointStyle: true } },
  },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
  },
}

const alerts = [
  { severity: 'warn', text: 'report-generation failed 3 times in 24h', time: '1h ago' },
  { severity: 'info', text: 'AI suggests rescheduling db-backup to 3:00 AM', time: '2h ago' },
  { severity: 'success', text: 'All critical jobs healthy for 7 days', time: '1d ago' },
]

const Dashboard: React.FC = () => {
  const statusTemplate = (row: typeof recentExecutions[0]) => {
    const map: Record<string, 'success' | 'danger' | 'info' | 'warning'> = {
      completed: 'success',
      failed: 'danger',
      running: 'info',
    }
    return <Tag value={row.status} severity={map[row.status] || 'info'} rounded />
  }

  return (
    <>
      <Helmet><title>Dashboard - CronDash</title></Helmet>

      {/* Header */}
      <div className="flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold m-0 mb-1" style={{ color: 'var(--text-color)' }}>Dashboard</h1>
          <p className="m-0 text-color-secondary">Real-time overview of your cron jobs and system performance</p>
        </div>
        <div className="flex gap-2">
          <Button icon="pi pi-refresh" label="Refresh" outlined size="small" />
          <Button icon="pi pi-plus" label="Create Job" size="small" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.title} className="stat-card">
            <div className="stat-info">
              <h4>{s.title}</h4>
              <div className="stat-value">{s.value}</div>
              <div className="stat-trend" style={{ color: s.trendUp ? '#10B981' : '#EF4444' }}>
                <i className={`pi ${s.trendUp ? 'pi-arrow-up' : 'pi-arrow-down'}`} style={{ fontSize: '0.7rem', marginRight: '0.25rem' }} />
                {s.trend}
              </div>
            </div>
            <div className="stat-icon" style={{ backgroundColor: s.bg }}>
              <i className={s.icon} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Alerts row */}
      <div className="content-grid">
        <Card title="Performance Overview">
          <div style={{ height: '300px' }}>
            <Chart type="line" data={chartData} options={chartOptions} style={{ height: '100%' }} />
          </div>
        </Card>

        <Card title="Alerts &amp; Insights">
          <div className="flex flex-column gap-3">
            {alerts.map((a, i) => {
              const iconMap: Record<string, string> = { warn: 'pi pi-exclamation-triangle', info: 'pi pi-info-circle', success: 'pi pi-check-circle' }
              const colorMap: Record<string, string> = { warn: '#F59E0B', info: '#3B82F6', success: '#10B981' }
              return (
                <div key={i} className="flex align-items-start gap-3 p-3 border-round" style={{ background: 'var(--surface-ground)' }}>
                  <i className={iconMap[a.severity]} style={{ color: colorMap[a.severity], fontSize: '1.25rem', marginTop: '2px' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{a.text}</div>
                    <div className="text-xs text-color-secondary mt-1">{a.time}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Recent Executions Table */}
      <Card title="Recent Executions" subTitle="Latest cron job executions and their status">
        <DataTable value={recentExecutions} stripedRows showGridlines={false} size="small"
          rowHover paginator rows={5} emptyMessage="No recent executions."
          style={{ fontSize: '0.9rem' }}
        >
          <Column field="name" header="Job Name" sortable body={(row) => (
            <span className="font-medium">{row.name}</span>
          )} />
          <Column field="status" header="Status" sortable body={statusTemplate} style={{ width: '120px' }} />
          <Column field="duration" header="Duration" style={{ width: '100px' }} />
          <Column field="time" header="Time" style={{ width: '120px' }} body={(row) => (
            <span className="text-color-secondary text-sm">{row.time}</span>
          )} />
        </DataTable>
      </Card>
    </>
  )
}

export default Dashboard