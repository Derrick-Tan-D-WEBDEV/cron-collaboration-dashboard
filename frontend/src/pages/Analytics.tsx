import React from 'react'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'

const barData = {
  labels: ['db-backup', 'email-digest', 'cache-cleanup', 'report-gen', 'log-rotation', 'health-check'],
  datasets: [
    { label: 'Avg Runtime (s)', data: [3.2, 1.1, 0.4, 12.4, 0.8, 0.3], backgroundColor: '#3B82F6' },
    { label: 'Failures (7d)', data: [0, 0, 1, 3, 0, 0], backgroundColor: '#EF4444' },
  ],
}
const barOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', usePointStyle: true } } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
  },
}

const Analytics: React.FC = () => {
  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl font-bold m-0 mb-1" style={{ color: 'var(--text-color)' }}>Analytics</h1>
        <p className="m-0 text-color-secondary">Performance metrics and execution analytics</p>
      </div>
      <div className="content-grid">
        <Card title="Job Performance">
          <div style={{ height: '350px' }}>
            <Chart type="bar" data={barData} options={barOpts} style={{ height: '100%' }} />
          </div>
        </Card>
        <Card title="Summary">
          <ul className="list-none p-0 m-0 flex flex-column gap-3">
            <li className="flex justify-content-between p-3 border-round" style={{ background: 'var(--surface-ground)' }}>
              <span className="text-color-secondary">Total Executions (7d)</span>
              <span className="font-bold">1,247</span>
            </li>
            <li className="flex justify-content-between p-3 border-round" style={{ background: 'var(--surface-ground)' }}>
              <span className="text-color-secondary">Avg Success Rate</span>
              <span className="font-bold" style={{ color: '#10B981' }}>97.2%</span>
            </li>
            <li className="flex justify-content-between p-3 border-round" style={{ background: 'var(--surface-ground)' }}>
              <span className="text-color-secondary">Peak Hour</span>
              <span className="font-bold">02:00 - 03:00</span>
            </li>
            <li className="flex justify-content-between p-3 border-round" style={{ background: 'var(--surface-ground)' }}>
              <span className="text-color-secondary">Slowest Job</span>
              <span className="font-bold" style={{ color: '#F59E0B' }}>report-gen (12.4s)</span>
            </li>
          </ul>
        </Card>
      </div>
    </>
  )
}

export default Analytics
