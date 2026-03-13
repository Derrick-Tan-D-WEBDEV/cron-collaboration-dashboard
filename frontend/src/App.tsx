import React, { useState, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Panel } from 'primereact/panel'
import { Badge } from 'primereact/badge'
import { Button } from 'primereact/button'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { Timeline } from 'primereact/timeline'
import { ProgressBar } from 'primereact/progressbar'
import { Divider } from 'primereact/divider'
import { Toast } from 'primereact/toast'
import { TabView, TabPanel } from 'primereact/tabview'
import { Sidebar } from 'primereact/sidebar'

import './App.css'

// Import API services
import { 
  cronApi, 
  ProjectOverview, 
  Suggestion, 
  ActivityEvent, 
  CreateSuggestionRequest,
  handleApiError 
} from './api'
import { signalRService } from './signalr'

// Import new Phase 2 components
import MemoryViewer from './components/MemoryViewer'
import SuggestionTracking from './components/SuggestionTracking'
import CollaborationAnalytics from './components/CollaborationAnalytics'

// Import Phase 1 component
import LiveMonitoring from './components/LiveMonitoring'

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectOverview[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastRef, setToastRef] = useState<any>(null)

  const [newSuggestion, setNewSuggestion] = useState('')
  const [suggestionPriority, setSuggestionPriority] = useState('Medium')
  const [suggestionCategory, setSuggestionCategory] = useState('Direction')
  const [selectedProjectId, setSelectedProjectId] = useState('')

  // Phase 2 state
  const [selectedProject, setSelectedProject] = useState<ProjectOverview | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [memoryViewerOpen, setMemoryViewerOpen] = useState(false)

  const priorityOptions = [
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' }
  ]

  const categoryOptions = [
    { label: 'Direction', value: 'Direction' },
    { label: 'Bugfix', value: 'Bugfix' },
    { label: 'Feature', value: 'Feature' },
    { label: 'Optimization', value: 'Optimization' },
    { label: 'Quality', value: 'Quality' }
  ]

  // Initialize data and SignalR connection
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true)
        
        // Load initial data
        const [projectsData, suggestionsData, activitiesData] = await Promise.all([
          cronApi.getProjects(),
          cronApi.getAllSuggestions(),
          cronApi.getRecentActivities(20)
        ])

        setProjects(projectsData.projects)
        setSuggestions(suggestionsData.suggestions)
        setActivities(activitiesData)

        // Set default project for suggestions
        if (projectsData.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projectsData.projects[0].jobId)
        }

        // Initialize SignalR connection
        await signalRService.start()
        setupSignalRHandlers()

      } catch (err) {
        console.error('Error initializing app:', err)
        setError(handleApiError(err))
      } finally {
        setLoading(false)
      }
    }

    initializeApp()

    // Cleanup on unmount
    return () => {
      signalRService.stop()
    }
  }, [])

  // Set up SignalR event handlers
  const setupSignalRHandlers = () => {
    // Handle activity updates
    const handleActivityUpdate = (activity: ActivityEvent) => {
      setActivities(prev => [activity, ...prev.slice(0, 19)]) // Keep latest 20
      
      if (toastRef) {
        toastRef.show({
          severity: getToastSeverity(activity.eventType),
          summary: activity.eventType.replace('_', ' ').toUpperCase(),
          detail: activity.message,
          life: 3000
        })
      }
    }

    // Handle project updates
    const handleProjectUpdate = (updateData: any) => {
      // Refresh projects data
      refreshProjects()
    }

    // Handle suggestion updates
    const handleSuggestionUpdate = (suggestion: Suggestion) => {
      setSuggestions(prev => {
        const updated = prev.map(s => s.id === suggestion.id ? suggestion : s)
        if (!updated.find(s => s.id === suggestion.id)) {
          updated.unshift(suggestion)
        }
        return updated
      })
    }

    // Handle status changes
    const handleStatusChange = (statusUpdate: any) => {
      setProjects(prev => prev.map(p => 
        p.jobId === statusUpdate.ProjectId 
          ? { ...p, status: statusUpdate.NewStatus }
          : p
      ))
    }

    // Register handlers
    signalRService.onActivityUpdate(handleActivityUpdate)
    signalRService.onProjectUpdate(handleProjectUpdate)
    signalRService.onSuggestionUpdate(handleSuggestionUpdate)
    signalRService.onStatusChange(handleStatusChange)
  }

  // Refresh projects data
  const refreshProjects = async () => {
    try {
      const projectsData = await cronApi.getProjects()
      setProjects(projectsData.projects)
    } catch (err) {
      console.error('Error refreshing projects:', err)
    }
  }

  // Get appropriate toast severity for activity type
  const getToastSeverity = (eventType: string): 'success' | 'info' | 'warn' | 'error' => {
    if (eventType.includes('success') || eventType.includes('complete')) return 'success'
    if (eventType.includes('error') || eventType.includes('failed')) return 'error'
    if (eventType.includes('warning') || eventType.includes('delay')) return 'warn'
    return 'info'
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const severityMap: Record<string, any> = {
      Running: 'info',
      Waiting: 'warning', 
      Complete: 'success',
      Error: 'danger',
      Scheduled: 'secondary'
    }
    return <Badge value={status.toUpperCase()} severity={severityMap[status]} />
  }

  // Handle suggestion submission
  const handleSubmitSuggestion = async () => {
    if (!newSuggestion.trim() || !selectedProjectId) return

    try {
      const request: CreateSuggestionRequest = {
        projectId: selectedProjectId,
        content: newSuggestion,
        priority: suggestionPriority as 'High' | 'Medium' | 'Low',
        category: suggestionCategory as any
      }

      const suggestion = await cronApi.createSuggestion(request)
      setSuggestions(prev => [suggestion, ...prev])
      setNewSuggestion('')

      if (toastRef) {
        toastRef.show({
          severity: 'success',
          summary: 'Suggestion Submitted',
          detail: 'Your suggestion has been sent to the AI agent',
          life: 3000
        })
      }
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
      
      if (toastRef) {
        toastRef.show({
          severity: 'error',
          summary: 'Submission Failed',
          detail: errorMessage,
          life: 5000
        })
      }
    }
  }

  // Format duration from seconds
  const formatDuration = (durationSeconds: number): string => {
    if (durationSeconds < 60) return `${Math.round(durationSeconds)}s`
    if (durationSeconds < 3600) return `${Math.round(durationSeconds / 60)}m ${Math.round(durationSeconds % 60)}s`
    return `${Math.round(durationSeconds / 3600)}h ${Math.round((durationSeconds % 3600) / 60)}m`
  }

  // Timeline events for activities
  const timelineEvents = activities.map(activity => ({
    status: activity.message,
    date: new Date(activity.timestamp).toLocaleTimeString(),
    icon: getActivityIcon(activity.eventType),
    color: getActivityColor(activity.eventType),
    project: getProjectName(activity.projectId)
  }))

  function getProjectName(projectId: string): string {
    const project = projects.find(p => p.jobId === projectId)
    return project?.projectName || 'Unknown Project'
  }

  function getActivityIcon(type: string) {
    if (type.includes('success') || type.includes('complete')) return 'pi pi-check'
    if (type.includes('error') || type.includes('failed')) return 'pi pi-times'
    if (type.includes('warning')) return 'pi pi-exclamation-triangle'
    return 'pi pi-info-circle'
  }

  function getActivityColor(type: string) {
    if (type.includes('success') || type.includes('complete')) return '#4CAF50'
    if (type.includes('error') || type.includes('failed')) return '#F44336'
    if (type.includes('warning')) return '#FF9800'
    return '#2196F3'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-700">Loading Dashboard...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center">
            <i className="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              label="Retry" 
              icon="pi pi-refresh"
              onClick={() => window.location.reload()}
            />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Toast ref={(el) => setToastRef(el)} />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🧠 Cron Collaboration Dashboard - Phase 2
        </h1>
        <p className="text-gray-600">
          AI Memory Visualization & Human-AI Collaboration Analytics
        </p>
        
        {/* Connection status */}
        <div className="flex items-center mt-2">
          <i className={`pi ${signalRService.connected ? 'pi-circle-fill text-green-500' : 'pi-circle-fill text-red-500'} mr-2`}></i>
          <span className="text-sm text-gray-500">
            {signalRService.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Phase 2 Tabbed Interface */}
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        
        {/* Phase 1 Live Monitoring Tab */}
        <TabPanel header="📡 Live Monitoring" leftIcon="pi pi-desktop mr-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Real-time Project Monitoring</h2>
              <p className="text-gray-600">Live status, performance metrics, and health monitoring for all cron projects</p>
            </div>
            
            <LiveMonitoring 
              onProjectSelect={(projectId) => {
                const project = projects.find(p => p.jobId === projectId);
                if (project) {
                  setSelectedProject(project);
                  setActiveTab(1); // Switch to Project Overview tab
                }
              }}
            />
          </div>
        </TabPanel>
        
        {/* Project Overview Tab */}
        <TabPanel header="📊 Project Overview" leftIcon="pi pi-chart-bar mr-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Active Projects */}
            <Panel header="📊 Active Projects" className="mb-6">
              <div className="space-y-4">
                {projects.map(project => (
                  <Card key={project.jobId} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" 
                        onClick={() => setSelectedProject(project)}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          🚀 {project.projectName}
                        </h3>
                        <p className="text-sm text-gray-600">{project.currentPhase}</p>
                        <p className="text-xs text-gray-500 mt-1">{project.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(project.status)}
                        <Button 
                          icon="pi pi-brain" 
                          size="small" 
                          outlined
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProject(project);
                            setMemoryViewerOpen(true);
                          }}
                          tooltip="View AI Memory"
                        />
                      </div>
                    </div>
                    
                    {project.status === 'Running' && (
                      <>
                        <ProgressBar value={project.progress.progressPercentage} className="mb-2" />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Progress: {project.progress.progressPercentage}%</span>
                          <span>Success Rate: {project.performance.successRate.toFixed(1)}%</span>
                        </div>
                      </>
                    )}
                    
                    {/* Performance metrics */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Runs (24h): {project.performance.last24HRuns}</div>
                      <div>Avg Duration: {formatDuration(project.performance.durationSeconds)}</div>
                      <div>Success Rate: {project.performance.successRate.toFixed(1)}%</div>
                      <div>Errors: {project.performance.errorCount}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </Panel>

            {/* Suggestions */}
            <Panel header="💡 Suggestions & Feedback" className="mb-6">
              {/* Recent Suggestions */}
              <div className="space-y-3 mb-4">
                {suggestions.slice(0, 3).map(suggestion => (
                  <Card key={suggestion.id} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge value={suggestion.priority} 
                             severity={suggestion.priority === 'High' ? 'danger' : 
                                     suggestion.priority === 'Medium' ? 'warning' : 'info'} />
                      <Badge value={suggestion.status} 
                             severity={suggestion.status === 'Complete' ? 'success' : 
                                     suggestion.status === 'Implementing' ? 'warning' : 'info'} />
                    </div>
                    <p className="text-sm text-gray-700">{suggestion.content}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {suggestion.category} • {new Date(suggestion.submittedAt).toLocaleTimeString()}
                    </div>
                  </Card>
                ))}
              </div>

              <Divider />

              {/* New Suggestion Form */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">📝 New Suggestion</h4>
                
                {/* Project selection */}
                <Dropdown 
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.value)}
                  options={projects.map(p => ({ label: p.projectName, value: p.jobId }))}
                  placeholder="Select Project"
                  className="w-full"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <Dropdown 
                    value={suggestionPriority} 
                    onChange={(e) => setSuggestionPriority(e.value)}
                    options={priorityOptions} 
                    placeholder="Priority"
                    className="w-full"
                  />
                  <Dropdown 
                    value={suggestionCategory} 
                    onChange={(e) => setSuggestionCategory(e.value)}
                    options={categoryOptions} 
                    placeholder="Category"
                    className="w-full"
                  />
                </div>

                <InputTextarea 
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  placeholder="Enter your suggestion for the AI agents..."
                  rows={3}
                  className="w-full"
                />
                
                <Button 
                  label="Submit Suggestion" 
                  icon="pi pi-send"
                  onClick={handleSubmitSuggestion}
                  className="w-full"
                  disabled={!newSuggestion.trim() || !selectedProjectId}
                />
              </div>
            </Panel>

            {/* Live Activity Feed */}
            <Panel header="🔄 Live Activity Feed" className="lg:col-span-2">
              {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activities</p>
              ) : (
                <Timeline 
                  value={timelineEvents} 
                  align="left"
                  className="custom-timeline"
                  content={(item) => (
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-800">{item.project}</span>
                        <span className="text-sm text-gray-500">{item.date}</span>
                      </div>
                      <p className="text-sm text-gray-600">{item.status}</p>
                    </div>
                  )}
                />
              )}
            </Panel>
          </div>
        </TabPanel>

        {/* AI Memory Viewer Tab */}
        <TabPanel header="🧠 AI Memory" leftIcon="pi pi-brain mr-2">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">AI Memory Visualization</h2>
                <p className="text-gray-600">Explore AI agent thinking process and memory state</p>
              </div>
              <Dropdown 
                value={selectedProject?.jobId || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.jobId === e.value);
                  setSelectedProject(project || null);
                }}
                options={projects.map(p => ({ label: p.projectName, value: p.jobId }))}
                placeholder="Select Project"
                className="w-72"
              />
            </div>
            
            {selectedProject ? (
              <MemoryViewer 
                projectId={selectedProject.jobId}
                showAnalysis={true}
                onMemoryUpdate={(memory) => console.log('Memory updated:', memory)}
              />
            ) : (
              <Card className="p-8 text-center">
                <i className="pi pi-info-circle text-4xl text-blue-400 mb-3"></i>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Project</h3>
                <p className="text-gray-500">Choose a project from the dropdown to view its AI memory</p>
              </Card>
            )}
          </div>
        </TabPanel>

        {/* Suggestion Tracking Tab */}
        <TabPanel header="📋 Suggestion Tracking" leftIcon="pi pi-eye mr-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Suggestion Implementation Tracking</h2>
              <p className="text-gray-600">Monitor suggestion delivery and implementation progress</p>
            </div>
            
            <SuggestionTracking 
              suggestions={suggestions}
              onRefresh={() => {
                // Refresh suggestions data
                cronApi.getAllSuggestions().then(data => setSuggestions(data.suggestions));
              }}
              showProjectFilter={true}
            />
          </div>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel header="📈 Analytics" leftIcon="pi pi-chart-line mr-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Collaboration Analytics</h2>
              <p className="text-gray-600">Human-AI collaboration effectiveness and performance metrics</p>
            </div>
            
            <CollaborationAnalytics refreshInterval={300000} />
          </div>
        </TabPanel>
      </TabView>

      {/* Memory Viewer Sidebar */}
      <Sidebar 
        visible={memoryViewerOpen} 
        onHide={() => setMemoryViewerOpen(false)}
        position="right"
        style={{ width: '50vw' }}
        header={selectedProject ? `AI Memory - ${selectedProject.projectName}` : 'AI Memory'}
      >
        {selectedProject && (
          <MemoryViewer 
            projectId={selectedProject.jobId}
            showAnalysis={true}
            onMemoryUpdate={(memory) => console.log('Sidebar memory updated:', memory)}
          />
        )}
      </Sidebar>
    </div>
  )
}

export default App