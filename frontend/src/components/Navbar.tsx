import React from 'react'
import { Menubar } from 'primereact/menubar'
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
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => navigate('/settings/profile')
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => navigate('/settings')
    },
    {
      separator: true
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: logout
    }
  ]

  const start = (
    <div className="flex align-items-center gap-3">
      {isMobile && (
        <Button
          icon="pi pi-bars"
          className="p-button-text p-button-rounded"
          onClick={onMenuToggle}
          aria-label="Menu"
        />
      )}
      <div className="navbar-logo">
        <i className="pi pi-clock text-primary text-2xl mr-2" />
        <span className="font-semibold text-xl">CronDash</span>
      </div>
    </div>
  )

  const end = (
    <div className="flex align-items-center gap-2">
      {/* Theme Toggle */}
      <Button
        icon={theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'}
        className="p-button-text p-button-rounded"
        onClick={toggleTheme}
        tooltip="Toggle Theme"
        tooltipOptions={{ position: 'bottom' }}
        aria-label="Toggle theme"
      />

      {/* Notifications */}
      <div className="relative">
        <Button
          icon="pi pi-bell"
          className="p-button-text p-button-rounded"
          onClick={onNotificationsToggle}
          aria-label="Notifications"
          tooltip="Notifications"
          tooltipOptions={{ position: 'bottom' }}
        />
        {unreadCount > 0 && (
          <Badge
            value={unreadCount > 99 ? '99+' : unreadCount.toString()}
            severity="danger"
            className="notification-badge"
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              fontSize: '0.75rem'
            }}
          />
        )}
      </div>

      {/* User Menu */}
      <div className="flex align-items-center gap-2">
        {!isMobile && (
          <div className="text-right">
            <div className="font-medium text-sm">{user?.name}</div>
            <div className="text-xs text-500 capitalize">{user?.role}</div>
          </div>
        )}
        <Avatar
          image={user?.avatar}
          label={user?.name?.charAt(0).toUpperCase()}
          className="cursor-pointer user-avatar"
          onClick={(e) => userMenuRef.current?.toggle(e)}
          aria-label="User menu"
          size="normal"
          shape="circle"
        />
        <Menu
          ref={userMenuRef}
          model={userMenuItems}
          popup
          className="user-menu"
        />
      </div>
    </div>
  )

  return (
    <div className="navbar-container">
      <Menubar
        start={start}
        end={end}
        className="navbar"
        style={{
          border: 'none',
          borderRadius: '0',
          padding: '1rem 2rem',
          background: 'var(--surface-ground)'
        }}
      />
    </div>
  )
}

export default Navbar