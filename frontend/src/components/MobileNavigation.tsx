import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { TabMenu } from 'primereact/tabmenu'
import { MenuItem } from 'primereact/menuitem'
import { Badge } from 'primereact/badge'
import { Button } from 'primereact/button'
import { useCronJobs } from '@hooks/useCronJobs'
import { useGestures } from '@hooks/useGestures'

interface MobileNavigationProps {
  onNavigate?: () => void
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ onNavigate }) => {
  const location = useLocation()
  const { failureCount } = useCronJobs()
  const [activeIndex, setActiveIndex] = useState(0)

  const tabItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      command: () => {
        window.location.href = '/'
        onNavigate?.()
      }
    },
    {
      label: 'Jobs',
      icon: 'pi pi-clock',
      command: () => {
        window.location.href = '/jobs'
        onNavigate?.()
      },
      template: (item, options) => (
        <div className="relative">
          <span className={options.iconClassName} />
          <span className={options.labelClassName}>{item.label}</span>
          {failureCount > 0 && (
            <Badge
              value={failureCount}
              severity="danger"
              className="absolute -top-2 -right-1"
              style={{ fontSize: '0.6rem' }}
            />
          )}
        </div>
      )
    },
    {
      label: 'Analytics',
      icon: 'pi pi-chart-line',
      command: () => {
        window.location.href = '/analytics'
        onNavigate?.()
      }
    },
    {
      label: 'Insights',
      icon: 'pi pi-eye',
      command: () => {
        window.location.href = '/insights'
        onNavigate?.()
      }
    },
    {
      label: 'More',
      icon: 'pi pi-ellipsis-h',
      command: () => {
        // Open more menu or navigate to settings
        window.location.href = '/settings'
        onNavigate?.()
      }
    }
  ]

  // Update active index based on current route
  useEffect(() => {
    const pathToIndex: Record<string, number> = {
      '/': 0,
      '/jobs': 1,
      '/analytics': 2,
      '/insights': 3
    }
    
    const currentIndex = pathToIndex[location.pathname] ?? 4
    setActiveIndex(currentIndex)
  }, [location.pathname])

  // Set up swipe gestures
  useGestures({
    element: document.body,
    gestures: [
      {
        type: 'swipe',
        direction: 'left',
        target: 'mobile-nav',
        action: () => {
          // Navigate to next tab
          if (activeIndex < tabItems.length - 1) {
            const nextItem = tabItems[activeIndex + 1]
            nextItem.command?.()
          }
        }
      },
      {
        type: 'swipe',
        direction: 'right',
        target: 'mobile-nav',
        action: () => {
          // Navigate to previous tab
          if (activeIndex > 0) {
            const prevItem = tabItems[activeIndex - 1]
            prevItem.command?.()
          }
        }
      }
    ]
  })

  // Quick action buttons for mobile
  const QuickActions = () => (
    <div className="mobile-quick-actions p-3">
      <div className="grid grid-cols-2 gap-3">
        <Button
          label="Create Job"
          icon="pi pi-plus"
          className="p-button-outlined w-full"
          size="small"
          onClick={() => {
            window.location.href = '/jobs/create'
            onNavigate?.()
          }}
        />
        <Button
          label="View Reports"
          icon="pi pi-file-pdf"
          className="p-button-outlined w-full"
          size="small"
          onClick={() => {
            window.location.href = '/reports'
            onNavigate?.()
          }}
        />
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Tab Navigation */}
      <div 
        className="mobile-navigation fixed bottom-0 left-0 right-0 z-50"
        id="mobile-nav"
      >
        <TabMenu
          model={tabItems}
          activeIndex={activeIndex}
          onTabChange={(e) => setActiveIndex(e.index)}
          className="mobile-tab-menu"
          style={{
            backgroundColor: 'var(--surface-ground)',
            borderTop: '1px solid var(--surface-border)',
            borderRadius: '0'
          }}
        />
      </div>

      {/* Mobile Sidebar Content (when used in sidebar) */}
      {onNavigate && (
        <div className="mobile-sidebar-content">
          <QuickActions />
          
          {/* Navigation Items */}
          <div className="p-3">
            <h4 className="text-lg font-semibold mb-3">Navigation</h4>
            
            <div className="flex flex-col gap-2">
              <NavLink
                to="/"
                className={({ isActive }) => 
                  `mobile-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={onNavigate}
              >
                <i className="pi pi-home mr-3" />
                Dashboard
              </NavLink>
              
              <NavLink
                to="/jobs"
                className={({ isActive }) => 
                  `mobile-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={onNavigate}
              >
                <i className="pi pi-clock mr-3" />
                Cron Jobs
                {failureCount > 0 && (
                  <Badge 
                    value={failureCount} 
                    severity="danger" 
                    className="ml-auto"
                  />
                )}
              </NavLink>
              
              <NavLink
                to="/analytics"
                className={({ isActive }) => 
                  `mobile-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={onNavigate}
              >
                <i className="pi pi-chart-line mr-3" />
                Analytics
              </NavLink>
              
              <NavLink
                to="/insights"
                className={({ isActive }) => 
                  `mobile-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={onNavigate}
              >
                <i className="pi pi-eye mr-3" />
                Predictive Insights
              </NavLink>
              
              <NavLink
                to="/reports"
                className={({ isActive }) => 
                  `mobile-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={onNavigate}
              >
                <i className="pi pi-file-pdf mr-3" />
                Reports
              </NavLink>
              
              <NavLink
                to="/settings"
                className={({ isActive }) => 
                  `mobile-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={onNavigate}
              >
                <i className="pi pi-cog mr-3" />
                Settings
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MobileNavigation