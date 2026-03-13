import React from 'react'
import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { ProgressBar } from 'primereact/progressbar'

const insights = [
  { title: 'report-generation likely to fail', confidence: 85, severity: 'danger' as const, desc: 'Based on increasing runtime trends over the past 7 days, this job is approaching its timeout threshold.' },
  { title: 'Optimal time to run db-backup', confidence: 92, severity: 'info' as const, desc: 'Moving db-backup from 02:00 to 03:15 could reduce execution time by ~18% due to lower system load.' },
  { title: 'cache-cleanup frequency can be reduced', confidence: 78, severity: 'warning' as const, desc: 'Cache hit rate analysis suggests running every 30 min instead of 15 min with no performance impact.' },
  { title: 'All email systems healthy', confidence: 95, severity: 'success' as const, desc: 'email-digest and notification jobs show stable execution patterns with no degradation signals.' },
]

const PredictiveInsights: React.FC = () => (
  <>
    <div className="mb-4">
      <h1 className="text-3xl font-bold m-0 mb-1" style={{ color: 'var(--text-color)' }}>Predictive Insights</h1>
      <p className="m-0 text-color-secondary">AI-powered predictions and optimization recommendations</p>
    </div>
    <div className="flex flex-column gap-3">
      {insights.map((ins, i) => (
        <Card key={i}>
          <div className="flex align-items-start gap-3 flex-wrap">
            <Tag value={`${ins.confidence}% confidence`} severity={ins.severity} rounded />
            <div className="flex-1" style={{ minWidth: '200px' }}>
              <h3 className="m-0 mb-2 text-lg font-semibold" style={{ color: 'var(--text-color)' }}>{ins.title}</h3>
              <p className="m-0 text-color-secondary text-sm line-height-3">{ins.desc}</p>
              <ProgressBar value={ins.confidence} showValue={false} style={{ height: '6px', marginTop: '0.75rem' }} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  </>
)

export default PredictiveInsights
