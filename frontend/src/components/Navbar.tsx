import React from 'react'
import { Button } from 'primereact/button'
import { Badge } from 'primereact/badge'
import { Avatar } from 'primereact/avatar'
import { Menu } from 'primereact/menu'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useNotifications } from '@hooks/useNotifications'
import { useTheme } from '@hooks/useTheme'

interface NavbarProps {
  onMenuToggle: () => void
  onNotificationsToggle: () => void
  isMobile: boolean
}

const Navbar: React.FC<NavbarProps> = ({ onMenuToggle, onNotificationsToggle, isMobile }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { theme, toggleTheme } = useTheme()
  const userMenuRef = React.useRef<Menu>(null)

  const userMenuItems = [
    { label: 'Profile', icon: 'pi pi-user', command: () => navigate('/settings') },
    { label: 'Settings', icon: 'pi pi-cog', command: () => navigate('/settings') },
    { separator: true },
    { label: 'Logout', icon: 'pi pi-sign-out', command: logout },
  ]

  return (
    <div className="layout-topbar">
      <div className="flex align-items-center gap-3">
        {isMobile && (
          <Button icon="pi pi-bars" text rounded onClick={onMenuToggle} aria-label="Menu" />
        )}
        <a href="/" className="topbar-logo" style={{ textDecoration: 'none' }}>
          <i className="pi pi-bolt" />
          <span>CronDash</span>
        </a>
      </div>

      <div className="topbar-actions">
        <Button
          icon={theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'}
          text rounded
          onClick={toggleTheme}
          tooltip="Toggle Theme"
          tooltipOptions={{ position: 'bottom' }}
        />

        <span className="p-overlay-badge">
          <Button icon="pi pi-bell" text rounded onClick={onNotificationsToggle} />
          {unreadCount > 0 && <Badge value={unreadCount.toString()} severity="danger" />}
        </span>

        {!isMobile && (
          <span className="text-color-secondary text-sm font-medium ml-2">
            {user?.name}
          </span>
        )}

        <Avatar
          label={user?.name?.charAt(0).toUpperCase() || 'U'}
          shape="circle"
          className="cursor-pointer"
          style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
          onClick={(e) => userMenuRef.current?.toggle(e)}
        />
        <Menu ref={userMenuRef} model={userMenuItems} popup />
      </div>
    </div>
  )
}

export default Navbar