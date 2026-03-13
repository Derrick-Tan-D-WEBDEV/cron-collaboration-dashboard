import React from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'

const reports = [
  { name: 'Weekly Summary', type: 'Automated', generated: 'Jan 12, 2025', size: '2.4 MB', status: 'ready' },
  { name: 'Monthly Performance', type: 'Automated', generated: 'Jan 1, 2025', size: '5.1 MB', status: 'ready' },
  { name: 'Failure Analysis', type: 'On-demand', generated: 'Jan 10, 2025', size: '1.8 MB', status: 'ready' },
  { name: 'Cost Optimization', type: 'On-demand', generated: 'Generating...', size: '—', status: 'pending' },
]

const Reports: React.FC = () => (
  <>
    <div className="flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h1 className="text-3xl font-bold m-0 mb-1" style={{ color: 'var(--text-color)' }}>Reports</h1>
        <p className="m-0 text-color-secondary">Generate and download execution reports</p>
      </div>
      <Button icon="pi pi-file-export" label="Generate Report" />
    </div>
    <Card>
      <DataTable value={reports} stripedRows rowHover size="small" style={{ fontSize: '0.9rem' }}>
        <Column field="name" header="Report" sortable body={(r) => <span className="font-medium">{r.name}</span>} />
        <Column field="type" header="Type" />
        <Column field="generated" header="Generated" />
        <Column field="size" header="Size" />
        <Column field="status" header="Status" body={(r) => (
          <Tag value={r.status} severity={r.status === 'ready' ? 'success' : 'warning'} rounded />
        )} style={{ width: '100px' }} />
        <Column header="" style={{ width: '80px' }} body={(r) => (
          <Button icon="pi pi-download" text rounded size="small" disabled={r.status !== 'ready'} />
        )} />
      </DataTable>
    </Card>
  </>
)

export default Reports
