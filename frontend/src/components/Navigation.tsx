import React from 'react'
import { NavLink } from 'react-router-dom'

interface NavigationProps {
  onNavigate?: () => void
}

const navItems = [
  { to: '/', icon: 'pi pi-home', label: 'Dashboard', end: true },
  { to: '/jobs', icon: 'pi pi-clock', label: 'Cron Jobs' },
  { to: '/analytics', icon: 'pi pi-chart-line', label: 'Analytics' },
  { to: '/insights', icon: 'pi pi-eye', label: 'Predictive Insights' },
  { to: '/reports', icon: 'pi pi-file', label: 'Reports' },
  { to: '/settings', icon: 'pi pi-cog', label: 'Settings' },
]

const Navigation: React.FC<NavigationProps> = ({ onNavigate }) => {
  return (
    <nav>
      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navigation