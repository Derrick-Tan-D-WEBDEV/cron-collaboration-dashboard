import React from 'react'
import { Card } from 'primereact/card'
import { Badge } from 'primereact/badge'
import { motion } from 'framer-motion'
import { AnalyticsData } from '@types/index'

interface DashboardStatsCardsProps {
  data: AnalyticsData | undefined
}

export const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ data }) => {
  if (!data) return null

  const stats = [
    {
      title: 'Total Jobs',
      value: data.metrics.totalJobs,
      icon: 'pi pi-clock',
      color: 'bg-blue-500',
      trend: '+5%',
      trendColor: 'text-green-500'
    },
    {
      title: 'Active Jobs',
      value: data.metrics.activeJobs,
      icon: 'pi pi-play',
      color: 'bg-green-500',
      trend: '+12%',
      trendColor: 'text-green-500'
    },
    {
      title: 'Success Rate',
      value: `${(data.metrics.successRate * 100).toFixed(1)}%`,
      icon: 'pi pi-check-circle',
      color: 'bg-emerald-500',
      trend: data.metrics.successRate > 0.95 ? '+2%' : '-1%',
      trendColor: data.metrics.successRate > 0.95 ? 'text-green-500' : 'text-red-500'
    },
    {
      title: 'Avg Runtime',
      value: `${data.metrics.averageRuntime.toFixed(1)}s`,
      icon: 'pi pi-stopwatch',
      color: 'bg-purple-500',
      trend: data.metrics.averageRuntime < 30 ? '-8%' : '+3%',
      trendColor: data.metrics.averageRuntime < 30 ? 'text-green-500' : 'text-red-500'
    }
  ]

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card className="stats-card h-full hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold mb-2">{stat.value}</h3>
                <div className="flex items-center">
                  <span className={`text-sm ${stat.trendColor} font-medium`}>
                    {stat.trend}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs last period</span>
                </div>
              </div>
              <div className={`rounded-full p-3 ${stat.color} text-white`}>
                <i className={`${stat.icon} text-xl`} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}