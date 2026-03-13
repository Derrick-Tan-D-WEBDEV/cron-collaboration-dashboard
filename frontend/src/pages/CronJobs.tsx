import React from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { InputText } from 'primereact/inputtext'

const jobs = [
  { name: 'db-backup-daily', schedule: '0 2 * * *', status: 'active', lastRun: '2 hrs ago', nextRun: 'in 22 hrs' },
  { name: 'email-digest', schedule: '0 8 * * 1-5', status: 'active', lastRun: '8 hrs ago', nextRun: 'in 16 hrs' },
  { name: 'cache-cleanup', schedule: '*/15 * * * *', status: 'active', lastRun: '3 min ago', nextRun: 'in 12 min' },
  { name: 'report-generation', schedule: '0 6 * * 1', status: 'paused', lastRun: '3 days ago', nextRun: '—' },
  { name: 'log-rotation', schedule: '0 0 * * *', status: 'active', lastRun: '12 hrs ago', nextRun: 'in 12 hrs' },
  { name: 'health-check', schedule: '*/5 * * * *', status: 'active', lastRun: '1 min ago', nextRun: 'in 4 min' },
]

const CronJobs: React.FC = () => {
  const statusTemplate = (row: typeof jobs[0]) => (
    <Tag value={row.status} severity={row.status === 'active' ? 'success' : 'warning'} rounded />
  )

  return (
    <>
      <div className="flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold m-0 mb-1" style={{ color: 'var(--text-color)' }}>Cron Jobs</h1>
          <p className="m-0 text-color-secondary">Manage and monitor your scheduled jobs</p>
        </div>
        <div className="flex gap-2">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText placeholder="Search jobs..." />
          </span>
          <Button icon="pi pi-plus" label="New Job" />
        </div>
      </div>
      <Card>
        <DataTable value={jobs} stripedRows rowHover paginator rows={10} size="small" style={{ fontSize: '0.9rem' }}>
          <Column field="name" header="Job Name" sortable body={(r) => <span className="font-medium">{r.name}</span>} />
          <Column field="schedule" header="Schedule" sortable />
          <Column field="status" header="Status" body={statusTemplate} style={{ width: '100px' }} />
          <Column field="lastRun" header="Last Run" />
          <Column field="nextRun" header="Next Run" />
          <Column header="Actions" style={{ width: '120px' }} body={() => (
            <div className="flex gap-1">
              <Button icon="pi pi-play" text rounded size="small" />
              <Button icon="pi pi-pencil" text rounded size="small" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" />
            </div>
          )} />
        </DataTable>
      </Card>
    </>
  )
}

export default CronJobs
