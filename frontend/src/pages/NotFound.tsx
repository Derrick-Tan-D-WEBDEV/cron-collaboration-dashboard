import React from 'react'
import { Button } from 'primereact/button'
import { useNavigate } from 'react-router-dom'

const NotFound: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className="flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <i className="pi pi-map" style={{ fontSize: '4rem', color: 'var(--primary-color)', marginBottom: '1rem' }} />
      <h1 className="text-5xl font-bold m-0" style={{ color: 'var(--text-color)' }}>404</h1>
      <p className="text-xl text-color-secondary mt-2 mb-4">Page not found</p>
      <Button label="Back to Dashboard" icon="pi pi-home" onClick={() => navigate('/')} />
    </div>
  )
}

export default NotFound
