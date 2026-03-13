import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Timeline } from 'primereact/timeline';
import { ProgressBar } from 'primereact/progressbar';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';

interface SuggestionImplementationStatus {
  suggestionId: string;
  projectId: string;
  injectedAt: string;
  expectedDelivery?: string;
  implementationStartedAt?: string;
  implementationCompletedAt?: string;
  implementationDetected: boolean;
  injectionMethod: string;
  trackingData: Record<string, any>;
  progressNotes: string[];
}

interface Suggestion {
  id: string;
  projectId: string;
  content: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  status: 'Pending' | 'Implementing' | 'Complete' | 'Declined';
  submittedBy: string;
  submittedAt: string;
  implementedAt?: string;
  implementationNotes?: string;
  impactDescription?: string;
}

interface SuggestionTrackingProps {
  suggestions: Suggestion[];
  onRefresh?: () => void;
  showProjectFilter?: boolean;
}

const SuggestionTracking: React.FC<SuggestionTrackingProps> = ({
  suggestions,
  onRefresh,
  showProjectFilter = false
}) => {
  const [trackingData, setTrackingData] = useState<Record<string, SuggestionImplementationStatus>>({});
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  useEffect(() => {
    loadTrackingData();
  }, [suggestions]);

  const loadTrackingData = async () => {
    setLoading(true);
    const trackingResults: Record<string, SuggestionImplementationStatus> = {};

    try {
      // Load tracking data for all suggestions
      for (const suggestion of suggestions) {
        if (suggestion.status === 'Implementing' || suggestion.status === 'Complete') {
          try {
            const response = await fetch(`/api/suggestiontracking/${suggestion.id}/status`);
            if (response.ok) {
              const status = await response.json();
              trackingResults[suggestion.id] = status;
            }
          } catch (err) {
            console.error(`Error loading tracking for ${suggestion.id}:`, err);
          }
        }
      }
    } finally {
      setTrackingData(trackingResults);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const severityMap: Record<string, any> = {
      Pending: 'info',
      Implementing: 'warning',
      Complete: 'success',
      Declined: 'danger'
    };
    return <Badge value={status} severity={severityMap[status]} />;
  };

  const getPriorityBadge = (priority: string) => {
    const severityMap: Record<string, any> = {
      High: 'danger',
      Medium: 'warning',
      Low: 'info'
    };
    return <Badge value={priority} severity={severityMap[priority]} />;
  };

  const getImplementationProgress = (suggestion: Suggestion, tracking?: SuggestionImplementationStatus): number => {
    if (suggestion.status === 'Complete') return 100;
    if (suggestion.status === 'Declined') return 0;
    if (suggestion.status === 'Pending') return 0;
    
    if (tracking) {
      if (tracking.implementationCompletedAt) return 100;
      if (tracking.implementationStartedAt) return 75;
      if (tracking.implementationDetected) return 50;
      if (tracking.injectedAt) return 25;
    }
    
    return 10; // Default for "Implementing" status
  };

  const getTimelineEvents = (suggestion: Suggestion, tracking?: SuggestionImplementationStatus) => {
    const events = [];

    // Submission
    events.push({
      status: 'Suggestion Submitted',
      date: new Date(suggestion.submittedAt).toLocaleString(),
      icon: 'pi pi-plus',
      color: '#2196F3'
    });

    if (tracking?.injectedAt) {
      events.push({
        status: `Injected via ${tracking.injectionMethod}`,
        date: new Date(tracking.injectedAt).toLocaleString(),
        icon: 'pi pi-send',
        color: '#FF9800'
      });
    }

    if (tracking?.implementationStartedAt) {
      events.push({
        status: 'Implementation Started',
        date: new Date(tracking.implementationStartedAt).toLocaleString(),
        icon: 'pi pi-play',
        color: '#4CAF50'
      });
    }

    if (tracking?.implementationCompletedAt || suggestion.implementedAt) {
      events.push({
        status: 'Implementation Completed',
        date: new Date(tracking?.implementationCompletedAt || suggestion.implementedAt!).toLocaleString(),
        icon: 'pi pi-check',
        color: '#4CAF50'
      });
    }

    return events;
  };

  const formatDuration = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d`;
  };

  const getInjectionMethodChip = (method: string) => {
    const methodLabels: Record<string, { label: string, className: string }> = {
      direct_injection: { label: 'Direct', className: 'bg-green-100 text-green-800' },
      context_injection: { label: 'Context', className: 'bg-blue-100 text-blue-800' },
      scheduled: { label: 'Scheduled', className: 'bg-orange-100 text-orange-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' }
    };

    const config = methodLabels[method] || { label: method, className: 'bg-gray-100 text-gray-800' };
    return <Chip label={config.label} className={`text-xs ${config.className}`} />;
  };

  const filteredSuggestions = selectedProjectId === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.projectId === selectedProjectId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <i className="pi pi-eye mr-2 text-blue-500"></i>
            Suggestion Tracking
          </h3>
          <p className="text-sm text-gray-500">
            Track implementation progress and delivery status
          </p>
        </div>
        <Button 
          label="Refresh"
          icon="pi pi-refresh"
          onClick={() => {
            loadTrackingData();
            onRefresh?.();
          }}
          size="small"
          outlined
        />
      </div>

      {/* Summary Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {suggestions.filter(s => s.status === 'Implementing').length}
            </div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {suggestions.filter(s => s.status === 'Complete').length}
            </div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {suggestions.filter(s => s.status === 'Pending').length}
            </div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {Object.keys(trackingData).length}
            </div>
            <div className="text-sm text-gray-500">Tracked</div>
          </div>
        </div>
      </Card>

      {/* Suggestion List with Tracking */}
      <div className="space-y-4">
        {filteredSuggestions.map(suggestion => {
          const tracking = trackingData[suggestion.id];
          const progress = getImplementationProgress(suggestion, tracking);
          const timelineEvents = getTimelineEvents(suggestion, tracking);

          return (
            <Panel 
              key={suggestion.id}
              header={
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center space-x-3">
                    {getPriorityBadge(suggestion.priority)}
                    {getStatusBadge(suggestion.status)}
                    <span className="font-medium">{suggestion.category}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDuration(suggestion.submittedAt, suggestion.implementedAt)}
                    {tracking && (
                      <span className="ml-2">
                        {getInjectionMethodChip(tracking.injectionMethod)}
                      </span>
                    )}
                  </div>
                </div>
              }
              toggleable
              className="suggestion-panel"
            >
              <div className="space-y-4">
                {/* Suggestion Content */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Suggestion Content:</h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded">{suggestion.content}</p>
                </div>

                {/* Implementation Progress */}
                {suggestion.status !== 'Pending' && suggestion.status !== 'Declined' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-800">Implementation Progress:</h4>
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} className="mb-2" />
                    
                    {tracking?.expectedDelivery && !tracking.implementationCompletedAt && (
                      <p className="text-sm text-gray-500">
                        Expected completion: {new Date(tracking.expectedDelivery).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Timeline */}
                {timelineEvents.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Implementation Timeline:</h4>
                    <Timeline 
                      value={timelineEvents}
                      align="left"
                      className="custom-timeline"
                      content={(item) => (
                        <div className="p-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-800">{item.status}</span>
                            <span className="text-sm text-gray-500">{item.date}</span>
                          </div>
                        </div>
                      )}
                    />
                  </div>
                )}

                {/* Tracking Details */}
                {tracking && (
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <i className="pi pi-info-circle mr-2 text-blue-500"></i>
                      Tracking Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Injection Method:</span>
                        <div className="mt-1">{getInjectionMethodChip(tracking.injectionMethod)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Detection Status:</span>
                        <div className="mt-1">
                          <Badge 
                            value={tracking.implementationDetected ? 'Detected' : 'Monitoring'} 
                            severity={tracking.implementationDetected ? 'success' : 'info'}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {tracking.progressNotes.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-sm">Progress Notes:</span>
                        <ul className="mt-1 text-sm text-gray-600">
                          {tracking.progressNotes.map((note, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <i className="pi pi-chevron-right text-xs mt-1"></i>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Implementation Notes */}
                {suggestion.implementationNotes && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Implementation Notes:</h4>
                    <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                      {suggestion.implementationNotes}
                    </p>
                  </div>
                )}

                {/* Impact Description */}
                {suggestion.impactDescription && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Impact Assessment:</h4>
                    <p className="text-sm text-gray-600 bg-green-50 p-3 rounded">
                      {suggestion.impactDescription}
                    </p>
                  </div>
                )}
              </div>
            </Panel>
          );
        })}

        {filteredSuggestions.length === 0 && (
          <Card className="p-8 text-center">
            <i className="pi pi-inbox text-4xl text-gray-400 mb-3"></i>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Suggestions Found</h3>
            <p className="text-gray-500">No suggestions available for tracking</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuggestionTracking;