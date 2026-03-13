import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import './App.css';

// Mock real OpenClaw data structure based on actual response
const mockCronJobs = {
  "jobs": [
    {
      "id": "559261a8-f5cd-4384-bfe0-a405aea22e23",
      "name": "Collaboration Platform - Phase 1 Development",
      "enabled": true,
      "schedule": {
        "everyMs": 7200000,
        "kind": "every"
      },
      "state": {
        "nextRunAtMs": 1773340800006,
        "lastRunAtMs": 1773333600006,
        "lastRunStatus": "ok",
        "lastDurationMs": 666750,
        "consecutiveErrors": 0
      }
    },
    {
      "id": "123f7b62-a415-4f5c-b260-0292a0253986",
      "name": "FPS.SimulatorService - Continuous Improvement Cycle",
      "enabled": true,
      "schedule": {
        "kind": "every",
        "everyMs": 7200000
      },
      "state": {
        "nextRunAtMs": 1773345060043,
        "lastRunAtMs": 1773337860043,
        "lastRunStatus": "ok",
        "lastDurationMs": 62943,
        "consecutiveErrors": 0
      }
    },
    {
      "id": "8975e81b-daef-4984-aabb-0f03a79f47ee",
      "name": "FPS Cron Monitor - Daily Health Check",
      "enabled": true,
      "schedule": {
        "kind": "cron",
        "expr": "0 9 * * *"
      },
      "state": {
        "nextRunAtMs": 1773363600000,
        "lastRunStatus": null,
        "consecutiveErrors": 0
      }
    }
  ]
};

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate loading real OpenClaw data
    setLoading(true);
    setTimeout(() => {
      const transformedProjects = mockCronJobs.jobs.map(job => ({
        id: job.id,
        projectName: job.name,
        status: getJobStatus(job),
        progress: calculateProgress(job),
        lastUpdated: new Date(job.state.lastRunAtMs || Date.now()),
        nextRun: new Date(job.state.nextRunAtMs || Date.now() + 3600000),
        performance: calculatePerformance(job),
        enabled: job.enabled
      }));
      setProjects(transformedProjects);
      setLoading(false);
    }, 1000);
  }, []);

  const getJobStatus = (job) => {
    if (!job.enabled) return 'Disabled';
    if (job.state.runningAtMs) return 'Running';
    if (job.state.consecutiveErrors > 0) return 'Error';
    if (job.state.lastRunStatus === 'ok') return 'Completed';
    return 'Pending';
  };

  const calculateProgress = (job) => {
    if (!job.enabled) return 0;
    if (job.state.runningAtMs) return 75; // Assume running jobs are 75% complete
    if (job.state.lastRunStatus === 'ok') return 100;
    return 0;
  };

  const calculatePerformance = (job) => {
    const duration = job.state.lastDurationMs || 0;
    const successRate = job.state.consecutiveErrors > 0 ? 85 : 98;
    
    return {
      successRate,
      durationSeconds: Math.round(duration / 1000),
      errorCount: job.state.consecutiveErrors,
      last24HRuns: 12 // Mock value
    };
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Running': 'info',
      'Completed': 'success', 
      'Error': 'danger',
      'Pending': 'warning',
      'Disabled': 'secondary'
    };
    return <Badge value={status} severity={statusMap[status]} />;
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const ProjectCard = ({ project }) => (
    <Card 
      title={project.projectName}
      subTitle={`ID: ${project.id.substring(0, 8)}...`}
      className="mb-4"
      header={
        <div className="p-4 bg-primary-50">
          <div className="flex justify-content-between align-items-center">
            {getStatusBadge(project.status)}
            <Button 
              icon="pi pi-refresh" 
              rounded 
              text 
              severity="secondary" 
              onClick={() => console.log('Refresh project', project.id)}
            />
          </div>
        </div>
      }
    >
      <div className="grid">
        <div className="col-12 md:col-6">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Progress</label>
            <ProgressBar value={project.progress} />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Last Updated</label>
            <div className="text-sm text-color-secondary">
              {formatTime(project.lastUpdated)}
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Next Run</label>
            <div className="text-sm text-color-secondary">
              {formatTime(project.nextRun)}
            </div>
          </div>
        </div>
        <div className="col-12 md:col-6">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Success Rate</label>
            <div className="flex align-items-center">
              <span className="font-semibold mr-2">{project.performance.successRate}%</span>
              <ProgressBar value={project.performance.successRate} className="flex-1" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Duration</label>
            <div className="text-sm">{formatDuration(project.performance.durationSeconds)}</div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Errors</label>
            <div className="text-sm">{project.performance.errorCount} errors</div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex gap-2">
        <Button 
          label="View Details" 
          icon="pi pi-eye" 
          size="small" 
          outlined
          onClick={() => console.log('View details', project.id)}
        />
        <Button 
          label="Send Suggestion" 
          icon="pi pi-comment" 
          size="small"
          onClick={() => console.log('Send suggestion', project.id)}
        />
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤝 Cron Collaboration Dashboard
          </h1>
          <p className="text-gray-600">
            Live monitoring and collaboration with OpenClaw cron jobs
          </p>
        </div>

        {loading ? (
          <div className="text-center p-8">
            <i className="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
            <div className="text-lg">Loading real OpenClaw data...</div>
          </div>
        ) : (
          <>
            <div className="grid mb-6">
              <div className="col-12 lg:col-3">
                <Card className="bg-blue-50 border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{projects.length}</div>
                  <div className="text-sm text-blue-700">Total Projects</div>
                </Card>
              </div>
              <div className="col-12 lg:col-3">
                <Card className="bg-green-50 border-green-200">
                  <div className="text-2xl font-bold text-green-900">
                    {projects.filter(p => p.status === 'Running' || p.status === 'Completed').length}
                  </div>
                  <div className="text-sm text-green-700">Active Jobs</div>
                </Card>
              </div>
              <div className="col-12 lg:col-3">
                <Card className="bg-orange-50 border-orange-200">
                  <div className="text-2xl font-bold text-orange-900">
                    {Math.round(projects.reduce((acc, p) => acc + p.performance.successRate, 0) / projects.length)}%
                  </div>
                  <div className="text-sm text-orange-700">Avg Success Rate</div>
                </Card>
              </div>
              <div className="col-12 lg:col-3">
                <Card className="bg-purple-50 border-purple-200">
                  <div className="text-2xl font-bold text-purple-900">
                    {projects.reduce((acc, p) => acc + p.performance.errorCount, 0)}
                  </div>
                  <div className="text-sm text-purple-700">Total Errors</div>
                </Card>
              </div>
            </div>

            <div className="grid">
              {projects.map(project => (
                <div key={project.id} className="col-12 lg:col-6 xl:col-4">
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Card title="📊 Live Activity Feed" className="w-full">
                <div className="text-center p-4 text-gray-500">
                  🔄 Real-time updates will appear here via SignalR
                  <br />
                  <small>Phase 1: Core functionality demonstrated with actual OpenClaw data structure</small>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;