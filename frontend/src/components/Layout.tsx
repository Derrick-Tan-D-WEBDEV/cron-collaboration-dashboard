import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from 'primereact/sidebar'
import { useMediaQuery } from '@hooks/useMediaQuery'

import Navbar from '@components/Navbar'
import Navigation from '@components/Navigation'
import NotificationCenter from '@components/NotificationCenter'

const Layout: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [notificationsVisible, setNotificationsVisible] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="layout-wrapper">
      {/* Top Bar */}
      <Navbar
        onMenuToggle={() => setSidebarVisible(!sidebarVisible)}
        onNotificationsToggle={() => setNotificationsVisible(!notificationsVisible)}
        isMobile={isMobile}
      />

      <div className="layout-body">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="layout-sidebar">
            <Navigation />
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <Sidebar
            visible={sidebarVisible}
            onHide={() => setSidebarVisible(false)}
            position="left"
            style={{ width: '280px' }}
          >
            <div style={{ marginTop: '0.5rem' }}>
              <Navigation onNavigate={() => setSidebarVisible(false)} />
            </div>
          </Sidebar>
        )}

        {/* Main Content */}
        <div className={`layout-content ${isMobile ? 'mobile' : ''}`}>
          <Outlet />
        </div>
      </div>

      {/* Notifications Sidebar */}
      <Sidebar
        visible={notificationsVisible}
        onHide={() => setNotificationsVisible(false)}
        position="right"
        style={{ width: '360px' }}
      >
        <NotificationCenter />
      </Sidebar>
    </div>
  )
}

export default Layout