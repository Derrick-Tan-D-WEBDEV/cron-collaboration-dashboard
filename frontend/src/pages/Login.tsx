import React, { useState } from 'react'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Button } from 'primereact/button'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--surface-ground)' }}>
      <Card style={{ width: '380px' }}>
        <div className="text-center mb-4">
          <i className="pi pi-bolt" style={{ fontSize: '2rem', color: 'var(--primary-color)' }} />
          <h2 className="mt-2" style={{ color: 'var(--text-color)' }}>CronDash</h2>
          <p className="text-color-secondary text-sm">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-column gap-3">
          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium text-color-secondary">Email</label>
            <InputText value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="flex flex-column gap-1">
            <label className="text-sm font-medium text-color-secondary">Password</label>
            <Password value={password} onChange={(e) => setPassword(e.target.value)} feedback={false} toggleMask />
          </div>
          <Button type="submit" label="Sign In" icon="pi pi-sign-in" className="mt-2" />
        </form>
      </Card>
    </div>
  )
}

export default Login
