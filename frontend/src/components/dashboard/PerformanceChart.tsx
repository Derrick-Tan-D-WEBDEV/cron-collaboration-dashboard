import React, { useRef, useEffect } from 'react'
import { Chart } from 'primereact/chart'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { motion } from 'framer-motion'
import { AnalyticsData } from '@types/index'

interface PerformanceChartProps {
  data: AnalyticsData | undefined
  isDark: boolean
  isMobile: boolean
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  data, 
  isDark, 
  isMobile 
}) => {
  const chartRef = useRef<Chart>(null)
  const [chartType, setChartType] = React.useState('line')
  const [timeRange, setTimeRange] = React.useState('24h')

  const chartTypes = [
    { label: 'Line Chart', value: 'line' },
    { label: 'Bar Chart', value: 'bar' },
    { label: 'Area Chart', value: 'area' }
  ]

  const timeRanges = [
    { label: 'Last 24 Hours', value: '24h' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' }
  ]

  const getChartOptions = () => {
    const textColor = isDark ? '#ffffff' : '#495057'
    const surfaceBorder = isDark ? '#383838' : '#dee2e6'
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: textColor,
            usePointStyle: true,
            font: {
              size: isMobile ? 12 : 14
            }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
            font: {
              size: isMobile ? 10 : 12
            }
          },
          grid: {
            color: surfaceBorder
          }
        },
        y: {
          ticks: {
            color: textColor,
            font: {
              size: isMobile ? 10 : 12
            }
          },
          grid: {
            color: surfaceBorder
          }
        }
      },
      interaction: {
        intersect: false
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  }

  const getChartData = () => {
    if (!data?.trends) return null

    const labels = data.trends.performance.map(point => 
      new Date(point.timestamp).toLocaleDateString()
    )

    const datasets = [
      {
        label: 'Success Rate (%)',
        data: data.trends.performance.map(point => point.value * 100),
        borderColor: '#10b981',
        backgroundColor: chartType === 'area' ? 'rgba(16, 185, 129, 0.1)' : '#10b981',
        tension: 0.4,
        fill: chartType === 'area'
      },
      {
        label: 'Avg Runtime (s)',
        data: data.trends.executionTime.map(point => point.value),
        borderColor: '#3b82f6',
        backgroundColor: chartType === 'area' ? 'rgba(59, 130, 246, 0.1)' : '#3b82f6',
        tension: 0.4,
        fill: chartType === 'area'
      },
      {
        label: 'Failure Rate (%)',
        data: data.trends.failures.map(point => point.value * 100),
        borderColor: '#ef4444',
        backgroundColor: chartType === 'area' ? 'rgba(239, 68, 68, 0.1)' : '#ef4444',
        tension: 0.4,
        fill: chartType === 'area'
      }
    ]

    return {
      labels,
      datasets
    }
  }

  const downloadChart = () => {
    if (chartRef.current) {
      const chart = chartRef.current.getChart()
      const url = chart.toBase64Image()
      const link = document.createElement('a')
      link.download = `performance-chart-${new Date().toISOString().split('T')[0]}.png`
      link.href = url
      link.click()
    }
  }

  const chartData = getChartData()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="performance-chart-container"
    >
      {/* Chart Controls */}
      <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          <Dropdown
            value={timeRange}
            onChange={(e) => setTimeRange(e.value)}
            options={timeRanges}
            placeholder="Time Range"
            className="w-full md:w-auto"
            style={{ minWidth: isMobile ? '120px' : '150px' }}
          />
          <Dropdown
            value={chartType}
            onChange={(e) => setChartType(e.value)}
            options={chartTypes}
            placeholder="Chart Type"
            className="w-full md:w-auto"
            style={{ minWidth: isMobile ? '120px' : '150px' }}
          />
        </div>
        <Button
          icon="pi pi-download"
          label={isMobile ? '' : 'Download'}
          className="p-button-outlined"
          onClick={downloadChart}
          tooltip="Download chart as PNG"
        />
      </div>

      {/* Chart */}
      <div style={{ height: isMobile ? '250px' : '350px' }}>
        {chartData ? (
          <Chart
            ref={chartRef}
            type={chartType as any}
            data={chartData}
            options={getChartOptions()}
            height="100%"
          />
        ) : (
          <div className="flex align-items-center justify-content-center h-full">
            <div className="text-center">
              <i className="pi pi-chart-line text-4xl text-gray-400 mb-2" />
              <p className="text-gray-500">No data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Insights */}
      {data && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border-radius-6">
          <h5 className="font-semibold mb-2">Performance Insights</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="font-medium">Success Rate Trend:</span>
              <span className={`ml-1 ${data.metrics.successRate > 0.95 ? 'text-green-600' : 'text-red-600'}`}>
                {data.metrics.successRate > 0.95 ? 'Improving' : 'Declining'}
              </span>
            </div>
            <div>
              <span className="font-medium">Avg Runtime:</span>
              <span className="ml-1 text-blue-600">
                {data.metrics.averageRuntime.toFixed(1)}s
              </span>
            </div>
            <div>
              <span className="font-medium">Prediction Accuracy:</span>
              <span className="ml-1 text-purple-600">
                {(data.metrics.predictiveAccuracy * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}