import React from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { InputSwitch } from 'primereact/inputswitch'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Divider } from 'primereact/divider'

const Settings: React.FC = () => {
  const [emailNotifs, setEmailNotifs] = React.useState(true)
  const [slackNotifs, setSlackNotifs] = React.useState(false)
  const [timezone, setTimezone] = React.useState('UTC')

  const tzOptions = [
    { label: 'UTC', value: 'UTC' },
    { label: 'US/Eastern', value: 'US/Eastern' },
    { label: 'US/Pacific', value: 'US/Pacific' },
    { label: 'Europe/London', value: 'Europe/London' },
    { label: 'Asia/Singapore', value: 'Asia/Singapore' },
  ]

  return (
    <>
      <div className="mb-4">
        <h1 className="text-3xl font-bold m-0 mb-1" style={{ color: 'var(--text-color)' }}>Settings</h1>
        <p className="m-0 text-color-secondary">Configure your dashboard preferences</p>
      </div>

      <div className="flex flex-column gap-4" style={{ maxWidth: '640px' }}>
        <Card title="Profile">
          <div className="flex flex-column gap-3">
            <div className="flex flex-column gap-1">
              <label className="text-sm font-medium text-color-secondary">Display Name</label>
              <InputText defaultValue="Dev User" />
            </div>
            <div className="flex flex-column gap-1">
              <label className="text-sm font-medium text-color-secondary">Email</label>
              <InputText defaultValue="dev@crondash.local" />
            </div>
          </div>
        </Card>

        <Card title="Notifications">
          <div className="flex flex-column gap-3">
            <div className="flex justify-content-between align-items-center">
              <span>Email notifications</span>
              <InputSwitch checked={emailNotifs} onChange={(e) => setEmailNotifs(e.value ?? false)} />
            </div>
            <div className="flex justify-content-between align-items-center">
              <span>Slack integration</span>
              <InputSwitch checked={slackNotifs} onChange={(e) => setSlackNotifs(e.value ?? false)} />
            </div>
          </div>
        </Card>

        <Card title="General">
          <div className="flex flex-column gap-3">
            <div className="flex flex-column gap-1">
              <label className="text-sm font-medium text-color-secondary">Timezone</label>
              <Dropdown value={timezone} options={tzOptions} onChange={(e) => setTimezone(e.value)} />
            </div>
          </div>
        </Card>

        <Button label="Save Changes" icon="pi pi-check" />
      </div>
    </>
  )
}

export default Settings
