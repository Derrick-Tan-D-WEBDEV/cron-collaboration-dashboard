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

import './App.css'

// Types
interface ProjectStatus {
  jobId: string
  projectName: string
  status: 'running' | 'waiting' | 'complete' | 'error'
  currentPhase: string
  duration?: string
  progress: number
}

interface Suggestion {
  id: string
  content: string
  priority: 'High' | 'Medium' | 'Low'
  category: 'Direction' | 'Bugfix' | 'Feature' | 'Optimization'
  status: 'Pending' | 'Implementing' | 'Complete'
  submittedAt: Date
}

interface ActivityEvent {
  id: string
  timestamp: Date
  projectName: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectStatus[]>([
    {
      jobId: '123f7b62-a415-4f5c-b260-0292a0253986',
      projectName: 'FPS Development Cycle',
      status: 'running',
      currentPhase: 'Round 15 - WEEK 1 Parallel Processing',
      duration: '3m 24s',
      progress: 65
    },
    {
      jobId: '8975e81b-daef-4984-aabb-0f03a79f47ee',
      projectName: 'Health Monitor',
      status: 'waiting',
      currentPhase: 'Daily Health Check',
      progress: 100
    }
  ])

  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: '1',
      content: 'Focus on bug fixes instead of new features',
      priority: 'High',
      category: 'Direction',
      status: 'Complete',
      submittedAt: new Date()
    }
  ])

  const [activities, setActivities] = useState<ActivityEvent[]>([
    {
      id: '1',
      timestamp: new Date(),
      projectName: 'FPS Development',
      message: 'Starting build verification',
      type: 'info'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 60000),
      projectName: 'FPS Development',
      message: 'Fixing property references',
      type: 'warning'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 120000),
      projectName: 'Health Monitor',
      message: 'Daily health check completed',
      type: 'success'
    }
  ])

  const [newSuggestion, setNewSuggestion] = useState('')
  const [suggestionPriority, setSuggestionPriority] = useState('Medium')
  const [suggestionCategory, setSuggestionCategory] = useState('Direction')

  const priorityOptions = [
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' }
  ]

  const categoryOptions = [
    { label: 'Direction', value: 'Direction' },
    { label: 'Bugfix', value: 'Bugfix' },
    { label: 'Feature', value: 'Feature' },
    { label: 'Optimization', value: 'Optimization' }
  ]

  const getStatusBadge = (status: string) => {
    const severityMap: Record<string, any> = {
      running: 'info',
      waiting: 'warning',
      complete: 'success',
      error: 'danger'
    }
    return <Badge value={status.toUpperCase()} severity={severityMap[status]} />
  }

  const handleSubmitSuggestion = () => {
    if (!newSuggestion.trim()) return

    const suggestion: Suggestion = {
      id: Date.now().toString(),
      content: newSuggestion,
      priority: suggestionPriority as 'High' | 'Medium' | 'Low',
      category: suggestionCategory as 'Direction' | 'Bugfix' | 'Feature' | 'Optimization',
      status: 'Pending',
      submittedAt: new Date()
    }

    setSuggestions([...suggestions, suggestion])
    setNewSuggestion('')
  }

  const timelineEvents = activities.map(activity => ({
    status: activity.message,
    date: activity.timestamp.toLocaleTimeString(),
    icon: getActivityIcon(activity.type),
    color: getActivityColor(activity.type),
    project: activity.projectName
  }))

  function getActivityIcon(type: string) {
    switch (type) {
      case 'success': return 'pi pi-check'
      case 'warning': return 'pi pi-exclamation-triangle'
      case 'error': return 'pi pi-times'
      default: return 'pi pi-info-circle'
    }
  }

  function getActivityColor(type: string) {
    switch (type) {
      case 'success': return '#4CAF50'
      case 'warning': return '#FF9800'
      case 'error': return '#F44336'
      default: return '#2196F3'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🎯 Cron Collaboration Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time monitoring and collaboration with AI-powered cron jobs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <Panel header="📊 Active Projects" className="mb-6">
          <div className="space-y-4">
            {projects.map(project => (
              <Card key={project.jobId} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      🚀 {project.projectName}
                    </h3>
                    <p className="text-sm text-gray-600">{project.currentPhase}</p>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
                
                {project.status === 'running' && (
                  <>
                    <ProgressBar value={project.progress} className="mb-2" />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Progress: {project.progress}%</span>
                      <span>Duration: {project.duration}</span>
                    </div>
                  </>
                )}
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
                  {suggestion.category} • {suggestion.submittedAt.toLocaleTimeString()}
                </div>
              </Card>
            ))}
          </div>

          <Divider />

          {/* New Suggestion Form */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">📝 New Suggestion</h4>
            
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
              disabled={!newSuggestion.trim()}
            />
          </div>
        </Panel>

        {/* Live Activity Feed */}
        <Panel header="🔄 Live Activity Feed" className="lg:col-span-2">
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
        </Panel>
      </div>
    </div>
  )
}

export default App