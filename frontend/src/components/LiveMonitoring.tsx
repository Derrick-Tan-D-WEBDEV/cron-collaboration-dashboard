import React, { useState, useEffect, useRef } from 'react'
import { Card } from 'primereact/card'
import { Panel } from 'primereact/panel'
import { Badge } from 'primereact/badge'
import { Button } from 'primereact/button'
import { ProgressBar } from 'primereact/progressbar'
import { Timeline } from 'primereact/timeline'
import { Divider } from 'primereact/divider'
import { Toast } from 'primereact/toast'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Chart } from 'primereact/chart'

interface LiveMonitoringProps {
    onProjectSelect?: (projectId: string) => void;
}

interface ProjectStatus {
    jobId: string;
    name: string;
    status: string;
    performance: {
        successRate: number;
        durationSeconds: number;
        last24HRuns: number;
        errorCount: number;
    };
    trend: string;
    isHealthy: boolean;
    lastActivity: string;
}

interface SystemHealth {
    totalJobs: number;
    activeJobs: number;
    healthyJobs: number;
    errorJobs: number;
    healthPercentage: number;
    overallStatus: string;
}

const LiveMonitoring: React.FC<LiveMonitoringProps> = ({ onProjectSelect }) => {
    const [projects, setProjects] = useState<ProjectStatus[]>([])
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
    const [fpsStatus, setFpsStatus] = useState<any>(null)
    const [healthMonitorStatus, setHealthMonitorStatus] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
    const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...')
    
    const toast = useRef<any>(null)

    // Chart data for system health trends
    const [chartData, setChartData] = useState({
        labels: [] as string[],
        datasets: [{
            label: 'System Health %',
            data: [] as number[],
            fill: false,
            borderColor: '#42A5F5',
            tension: 0.4
        }]
    })

    const chartOptions = {
        maintainAspectRatio: false,
        aspectRatio: 0.6,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#495057'
                },
                grid: {
                    color: '#ebedef'
                }
            },
            y: {
                min: 0,
                max: 100,
                ticks: {
                    color: '#495057'
                },
                grid: {
                    color: '#ebedef'
                }
            }
        }
    }

    // Initialize monitoring data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true)
                
                // Fetch live status from our new monitoring endpoint
                const response = await fetch('/api/monitoring/live-status')
                if (response.ok) {
                    const data = await response.json()
                    updateFromLiveStatus(data)
                    setConnectionStatus('Connected')
                }
                
                // Fetch detailed project data
                await refreshProjectData()
                
            } catch (error) {
                console.error('Error fetching initial monitoring data:', error)
                setConnectionStatus('Connection Error')
                toast.current?.show({
                    severity: 'error',
                    summary: 'Connection Error',
                    detail: 'Failed to connect to monitoring service'
                })
            } finally {
                setLoading(false)
            }
        }

        fetchInitialData()
    }, [])

    // Set up periodic refresh
    useEffect(() => {
        const interval = setInterval(async () => {
            await refreshMonitoringData()
        }, 30000) // Refresh every 30 seconds

        return () => clearInterval(interval)
    }, [])

    const refreshMonitoringData = async () => {
        try {
            const response = await fetch('/api/monitoring/live-status')
            if (response.ok) {
                const data = await response.json()
                updateFromLiveStatus(data)
                setLastUpdate(new Date())
                setConnectionStatus('Connected')
            }
        } catch (error) {
            console.error('Error refreshing monitoring data:', error)
            setConnectionStatus('Connection Error')
        }
    }

    const refreshProjectData = async () => {
        try {
            const response = await fetch('/api/monitoring/performance-metrics')
            if (response.ok) {
                const data = await response.json()
                updateProjectsFromMetrics(data)
            }
        } catch (error) {
            console.error('Error fetching project metrics:', error)
        }
    }

    const updateFromLiveStatus = (data: any) => {
        // Update system health
        if (data.systemHealth) {
            setSystemHealth(data.systemHealth)
            updateChart(data.systemHealth.healthPercentage)
        }

        // Update FPS status
        if (data.fps) {
            setFpsStatus(data.fps)
        }

        // Update Health Monitor status
        if (data.healthMonitor) {
            setHealthMonitorStatus(data.healthMonitor)
        }
    }

    const updateProjectsFromMetrics = (data: any) => {
        if (data.ProjectMetrics) {
            const projectArray: ProjectStatus[] = Object.entries(data.ProjectMetrics).map(([jobId, metrics]: [string, any]) => ({
                jobId,
                name: metrics.JobName || 'Unknown Project',
                status: metrics.Status || 'unknown',
                performance: metrics.Performance || {
                    successRate: 0,
                    durationSeconds: 0,
                    last24HRuns: 0,
                    errorCount: 0
                },
                trend: metrics.Trend || 'stable',
                isHealthy: metrics.Performance?.successRate >= 80,
                lastActivity: metrics.LastRun?.startedAt || 'Never'
            }))
            
            setProjects(projectArray)
        }
    }

    const updateChart = (healthPercentage: number) => {
        setChartData(prev => {
            const now = new Date().toLocaleTimeString()
            const newLabels = [...prev.labels.slice(-9), now] // Keep last 10 points
            const newData = [...prev.datasets[0].data.slice(-9), healthPercentage]
            
            return {
                labels: newLabels,
                datasets: [{
                    ...prev.datasets[0],
                    data: newData
                }]
            }
        })
    }

    const triggerManualUpdate = async () => {
        try {
            const response = await fetch('/api/monitoring/trigger-update', { method: 'POST' })
            if (response.ok) {
                await refreshMonitoringData()
                toast.current?.show({
                    severity: 'success',
                    summary: 'Update Triggered',
                    detail: 'Manual monitoring update completed'
                })
            }
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Update Failed',
                detail: 'Manual update failed'
            })
        }
    }

    const getStatusSeverity = (status: string) => {
        switch (status.toLowerCase()) {
            case 'running': return 'success'
            case 'waiting': 
            case 'scheduled': return 'info'
            case 'error': 
            case 'failed': return 'danger'
            default: return 'warning'
        }
    }

    const getTrendSeverity = (trend: string) => {
        switch (trend) {
            case 'improving': return 'success'
            case 'declining': return 'danger'
            case 'stable': return 'info'
            default: return 'warning'
        }
    }

    const getHealthSeverity = (status: string) => {
        switch (status.toLowerCase()) {
            case 'excellent': return 'success'
            case 'good': return 'success'
            case 'fair': return 'warning'
            case 'poor': return 'danger'
            default: return 'info'
        }
    }

    const projectActionsTemplate = (rowData: ProjectStatus) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    size="small"
                    text
                    onClick={() => onProjectSelect?.(rowData.jobId)}
                    tooltip="View Details"
                />
                <Button
                    icon="pi pi-chart-line"
                    size="small"
                    text
                    onClick={() => window.open(`/api/monitoring/analytics/${rowData.jobId}`, '_blank')}
                    tooltip="View Analytics"
                />
            </div>
        )
    }

    const projectStatusTemplate = (rowData: ProjectStatus) => {
        return <Badge value={rowData.status} severity={getStatusSeverity(rowData.status)} />
    }

    const projectTrendTemplate = (rowData: ProjectStatus) => {
        return <Badge value={rowData.trend} severity={getTrendSeverity(rowData.trend)} />
    }

    const projectHealthTemplate = (rowData: ProjectStatus) => {
        return (
            <div className="flex align-items-center gap-2">
                <i className={`pi ${rowData.isHealthy ? 'pi-check-circle text-green-500' : 'pi-exclamation-circle text-red-500'}`} />
                <span>{rowData.isHealthy ? 'Healthy' : 'Issues'}</span>
            </div>
        )
    }

    const projectPerformanceTemplate = (rowData: ProjectStatus) => {
        return (
            <div className="flex flex-column gap-1">
                <ProgressBar value={rowData.performance.successRate} className="w-full h-1rem" />
                <small className="text-500">{rowData.performance.successRate.toFixed(1)}% success rate</small>
            </div>
        )
    }

    return (
        <div className="live-monitoring">
            <Toast ref={toast} />
            
            {/* Header */}
            <div className="flex justify-content-between align-items-center mb-4">
                <h2 className="text-2xl font-bold m-0">Live Project Monitoring</h2>
                <div className="flex align-items-center gap-3">
                    <Badge value={connectionStatus} severity={connectionStatus === 'Connected' ? 'success' : 'danger'} />
                    <small className="text-500">Last update: {lastUpdate.toLocaleTimeString()}</small>
                    <Button
                        icon="pi pi-refresh"
                        size="small"
                        text
                        onClick={triggerManualUpdate}
                        tooltip="Manual Refresh"
                        loading={loading}
                    />
                </div>
            </div>

            {/* System Health Overview */}
            {systemHealth && (
                <Card className="mb-4">
                    <div className="grid">
                        <div className="col-12 md:col-8">
                            <h3 className="mt-0">System Health Overview</h3>
                            <div className="grid">
                                <div className="col-6 md:col-3 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{systemHealth.totalJobs}</div>
                                    <div className="text-500">Total Jobs</div>
                                </div>
                                <div className="col-6 md:col-3 text-center">
                                    <div className="text-2xl font-bold text-green-600">{systemHealth.activeJobs}</div>
                                    <div className="text-500">Active Jobs</div>
                                </div>
                                <div className="col-6 md:col-3 text-center">
                                    <div className="text-2xl font-bold text-orange-600">{systemHealth.healthyJobs}</div>
                                    <div className="text-500">Healthy Jobs</div>
                                </div>
                                <div className="col-6 md:col-3 text-center">
                                    <div className="text-2xl font-bold text-red-600">{systemHealth.errorJobs}</div>
                                    <div className="text-500">Error Jobs</div>
                                </div>
                            </div>
                            <Divider />
                            <div className="flex align-items-center gap-3">
                                <Badge 
                                    value={`${systemHealth.healthPercentage.toFixed(1)}% Overall Health`} 
                                    severity={getHealthSeverity(systemHealth.overallStatus)} 
                                    size="large"
                                />
                                <Badge value={systemHealth.overallStatus} severity={getHealthSeverity(systemHealth.overallStatus)} />
                            </div>
                        </div>
                        <div className="col-12 md:col-4">
                            <h4 className="mt-0">Health Trend</h4>
                            <Chart type="line" data={chartData} options={chartOptions} className="h-10rem" />
                        </div>
                    </div>
                </Card>
            )}

            {/* Key Projects Status */}
            <div className="grid mb-4">
                {fpsStatus && (
                    <div className="col-12 md:col-6">
                        <Card title="FPS Development" className="h-full">
                            <div className="flex align-items-center justify-content-between mb-3">
                                <Badge 
                                    value={fpsStatus.isHealthy ? 'Healthy' : 'Issues'} 
                                    severity={fpsStatus.isHealthy ? 'success' : 'warning'} 
                                />
                                <Badge value={fpsStatus.trend || 'stable'} severity={getTrendSeverity(fpsStatus.trend)} />
                            </div>
                            {fpsStatus.performance && (
                                <div className="grid text-center">
                                    <div className="col-4">
                                        <div className="text-xl font-bold text-blue-600">
                                            {fpsStatus.performance.successRate?.toFixed(1) || 0}%
                                        </div>
                                        <div className="text-500 text-sm">Success</div>
                                    </div>
                                    <div className="col-4">
                                        <div className="text-xl font-bold text-green-600">
                                            {fpsStatus.performance.last24HRuns || 0}
                                        </div>
                                        <div className="text-500 text-sm">24h Runs</div>
                                    </div>
                                    <div className="col-4">
                                        <div className="text-xl font-bold text-orange-600">
                                            {fpsStatus.performance.durationSeconds?.toFixed(1) || 0}s
                                        </div>
                                        <div className="text-500 text-sm">Avg Duration</div>
                                    </div>
                                </div>
                            )}
                            <Button 
                                label="View Details" 
                                size="small" 
                                text 
                                className="w-full mt-2"
                                onClick={() => onProjectSelect?.(fpsStatus.id || '123f7b62-a415-4f5c-b260-0292a0253986')}
                            />
                        </Card>
                    </div>
                )}

                {healthMonitorStatus && (
                    <div className="col-12 md:col-6">
                        <Card title="Health Monitor" className="h-full">
                            <div className="flex align-items-center justify-content-between mb-3">
                                <Badge 
                                    value={healthMonitorStatus.isHealthy ? 'Healthy' : 'Critical'} 
                                    severity={healthMonitorStatus.isHealthy ? 'success' : 'danger'} 
                                />
                                <Badge value="System Monitor" severity="info" />
                            </div>
                            {healthMonitorStatus.performance && (
                                <div className="grid text-center">
                                    <div className="col-4">
                                        <div className="text-xl font-bold text-blue-600">
                                            {healthMonitorStatus.performance.successRate?.toFixed(1) || 0}%
                                        </div>
                                        <div className="text-500 text-sm">Success</div>
                                    </div>
                                    <div className="col-4">
                                        <div className="text-xl font-bold text-green-600">
                                            {healthMonitorStatus.performance.last24HRuns || 0}
                                        </div>
                                        <div className="text-500 text-sm">24h Runs</div>
                                    </div>
                                    <div className="col-4">
                                        <div className="text-xl font-bold text-orange-600">
                                            {healthMonitorStatus.performance.durationSeconds?.toFixed(1) || 0}s
                                        </div>
                                        <div className="text-500 text-sm">Avg Duration</div>
                                    </div>
                                </div>
                            )}
                            <Button 
                                label="View Details" 
                                size="small" 
                                text 
                                className="w-full mt-2"
                                onClick={() => onProjectSelect?.(healthMonitorStatus.id || '8975e81b-daef-4984-aabb-0f03a79f47ee')}
                            />
                        </Card>
                    </div>
                )}
            </div>

            {/* All Projects Table */}
            <Card title="All Projects">
                <DataTable 
                    value={projects} 
                    loading={loading}
                    emptyMessage="No projects found"
                    paginator 
                    rows={10}
                    sortField="name"
                >
                    <Column field="name" header="Project Name" sortable />
                    <Column field="status" header="Status" body={projectStatusTemplate} sortable />
                    <Column header="Performance" body={projectPerformanceTemplate} />
                    <Column field="trend" header="Trend" body={projectTrendTemplate} />
                    <Column header="Health" body={projectHealthTemplate} />
                    <Column 
                        field="lastActivity" 
                        header="Last Activity" 
                        sortable 
                        body={(rowData) => new Date(rowData.lastActivity).toLocaleString()}
                    />
                    <Column header="Actions" body={projectActionsTemplate} />
                </DataTable>
            </Card>
        </div>
    )
}

export default LiveMonitoring