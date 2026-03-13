import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from 'primereact/sidebar'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { useAuth } from '@hooks/useAuth'

import Navbar from '@components/Navbar'
import Navigation from '@components/Navigation'
import MobileNavigation from '@components/MobileNavigation'
import NotificationCenter from '@components/NotificationCenter'
import { WebSocketStatus } from '@components/WebSocketStatus'

const Layout: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [notificationsVisible, setNotificationsVisible] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { user } = useAuth()

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible)
  const toggleNotifications = () => setNotificationsVisible(!notificationsVisible)

  return (
    <div className="layout-wrapper">
      <Navbar 
        onMenuToggle={toggleSidebar}
        onNotificationsToggle={toggleNotifications}
        isMobile={isMobile}
      />
      
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
          className="layout-sidebar-mobile"
        >
          <MobileNavigation onNavigate={() => setSidebarVisible(false)} />
        </Sidebar>
      )}
      
      {/* Main Content */}
      <div className={`layout-content ${isMobile ? 'mobile' : 'desktop'}`}>
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
      
      {/* Notification Sidebar */}
      <Sidebar
        visible={notificationsVisible}
        onHide={() => setNotificationsVisible(false)}
        position="right"
        className="notification-sidebar"
      >
        <NotificationCenter />
      </Sidebar>
      
      {/* WebSocket Connection Status */}
      <WebSocketStatus />
      
      {/* Mobile Navigation Bottom Bar */}
      {isMobile && <MobileNavigation />}
    </div>
  )
}

export default Layout