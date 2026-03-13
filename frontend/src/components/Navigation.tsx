import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { PanelMenu } from 'primereact/panelmenu'
import { MenuItem } from 'primereact/menuitem'
import { Badge } from 'primereact/badge'
import { useAuth } from '@hooks/useAuth'
import { useCronJobs } from '@hooks/useCronJobs'

const Navigation: React.FC = () => {
  const location = useLocation()
  const { user } = useAuth()
  const { jobs, failureCount } = useCronJobs()

  const menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      command: () => window.location.href = '/',
      className: location.pathname === '/' ? 'active-menu-item' : '',
      template: (item, options) => (
        <NavLink
          to="/"
          className={({ isActive }) => 
            `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
          }
        >
          <span className={options.iconClassName} />
          <span className={options.labelClassName}>{item.label}</span>
        </NavLink>
      )
    },
    {
      label: 'Cron Jobs',
      icon: 'pi pi-clock',
      template: (item, options) => (
        <NavLink
          to="/jobs"
          className={({ isActive }) => 
            `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
          }
        >
          <span className={options.iconClassName} />
          <span className={options.labelClassName}>{item.label}</span>
          {failureCount > 0 && (
            <Badge 
              value={failureCount} 
              severity="danger" 
              className="ml-auto"
            />
          )}
        </NavLink>
      ),
      items: [
        {
          label: 'All Jobs',
          icon: 'pi pi-list',
          template: (item, options) => (
            <NavLink
              to="/jobs"
              className={({ isActive }) => 
                `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
              }
            >
              <span className={options.iconClassName} />
              <span className={options.labelClassName}>{item.label}</span>
              <Badge 
                value={jobs?.length || 0} 
                severity="info" 
                className="ml-auto"
              />
            </NavLink>
          )
        },
        {
          label: 'Create Job',
          icon: 'pi pi-plus',
          template: (item, options) => (
            <NavLink
              to="/jobs/create"
              className={({ isActive }) => 
                `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
              }
            >
              <span className={options.iconClassName} />
              <span className={options.labelClassName}>{item.label}</span>
            </NavLink>
          )
        }
      ]
    },
    {
      label: 'Analytics',
      icon: 'pi pi-chart-line',
      template: (item, options) => (
        <NavLink
          to="/analytics"
          className={({ isActive }) => 
            `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
          }
        >
          <span className={options.iconClassName} />
          <span className={options.labelClassName}>{item.label}</span>
        </NavLink>
      ),
      items: [
        {
          label: 'Performance',
          icon: 'pi pi-chart-bar',
          template: (item, options) => (
            <NavLink
              to="/analytics/performance"
              className={({ isActive }) => 
                `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
              }
            >
              <span className={options.iconClassName} />
              <span className={options.labelClassName}>{item.label}</span>
            </NavLink>
          )
        },
        {
          label: 'Trends',
          icon: 'pi pi-chart-line',
          template: (item, options) => (
            <NavLink
              to="/analytics/trends"
              className={({ isActive }) => 
                `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
              }
            >
              <span className={options.iconClassName} />
              <span className={options.labelClassName}>{item.label}</span>
            </NavLink>
          )
        }
      ]
    },
    {
      label: 'Predictive Insights',
      icon: 'pi pi-eye',
      template: (item, options) => (
        <NavLink
          to="/insights"
          className={({ isActive }) => 
            `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
          }
        >
          <span className={options.iconClassName} />
          <span className={options.labelClassName}>{item.label}</span>
        </NavLink>
      )
    },
    {
      label: 'Reports',
      icon: 'pi pi-file-pdf',
      template: (item, options) => (
        <NavLink
          to="/reports"
          className={({ isActive }) => 
            `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
          }
        >
          <span className={options.iconClassName} />
          <span className={options.labelClassName}>{item.label}</span>
        </NavLink>
      )
    }
  ]

  // Add admin-only sections
  if (user?.role === 'admin') {
    menuItems.push(
      {
        separator: true
      },
      {
        label: 'Administration',
        icon: 'pi pi-cog',
        items: [
          {
            label: 'Workspace Settings',
            icon: 'pi pi-building',
            template: (item, options) => (
              <NavLink
                to="/settings/workspace"
                className={({ isActive }) => 
                  `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
                }
              >
                <span className={options.iconClassName} />
                <span className={options.labelClassName}>{item.label}</span>
              </NavLink>
            )
          },
          {
            label: 'User Management',
            icon: 'pi pi-users',
            template: (item, options) => (
              <NavLink
                to="/settings/users"
                className={({ isActive }) => 
                  `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
                }
              >
                <span className={options.iconClassName} />
                <span className={options.labelClassName}>{item.label}</span>
              </NavLink>
            )
          },
          {
            label: 'Integrations',
            icon: 'pi pi-link',
            template: (item, options) => (
              <NavLink
                to="/settings/integrations"
                className={({ isActive }) => 
                  `p-menuitem-link ${isActive ? 'active-menu-item' : ''}`
                }
              >
                <span className={options.iconClassName} />
                <span className={options.labelClassName}>{item.label}</span>
              </NavLink>
            )
          }
        ]
      }
    )
  }

  return (
    <div className="navigation-container">
      <PanelMenu 
        model={menuItems}
        className="navigation-menu"
        style={{ border: 'none' }}
      />
    </div>
  )
}

export default Navigation