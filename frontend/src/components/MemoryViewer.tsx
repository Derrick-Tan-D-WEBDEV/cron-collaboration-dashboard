import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Panel } from 'primereact/panel';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Timeline } from 'primereact/timeline';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Chip } from 'primereact/chip';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';

interface AgentMemory {
  sessionId: string;
  projectId: string;
  currentContext: Record<string, any>;
  decisionProcess: Record<string, any>;
  recentLearnings: string[];
  activeConstraints: string[];
  lastExtracted: string;
}

interface MemoryAnalysis {
  projectId: string;
  analysisPeriod: string;
  generatedAt: string;
  currentContextSize: number;
  activeConstraintsCount: number;
  recentLearningsCount: number;
  decisionPatterns: string[];
  learningTrends: string[];
}

interface MemoryViewerProps {
  projectId?: string;
  showAnalysis?: boolean;
  onMemoryUpdate?: (memory: AgentMemory) => void;
}

const MemoryViewer: React.FC<MemoryViewerProps> = ({ 
  projectId, 
  showAnalysis = true, 
  onMemoryUpdate 
}) => {
  const [memory, setMemory] = useState<AgentMemory | null>(null);
  const [analysis, setAnalysis] = useState<MemoryAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadMemory();
      if (showAnalysis) {
        loadAnalysis();
      }
    }
  }, [projectId, showAnalysis]);

  const loadMemory = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/memory/${projectId}`);
      if (response.ok) {
        const memoryData = await response.json();
        setMemory(memoryData);
        onMemoryUpdate?.(memoryData);
      } else if (response.status === 404) {
        setMemory(null);
        setError('No AI memory found for this project');
      } else {
        throw new Error('Failed to fetch memory');
      }
    } catch (err) {
      setError('Error loading AI memory');
      console.error('Memory load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/memory/${projectId}/analysis`);
      if (response.ok) {
        const analysisData = await response.json();
        setAnalysis(analysisData);
      }
    } catch (err) {
      console.error('Analysis load error:', err);
    }
  };

  const refreshMemory = async () => {
    if (!projectId) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`/api/memory/${projectId}/refresh`, { method: 'POST' });
      if (response.ok) {
        const memoryData = await response.json();
        setMemory(memoryData);
        onMemoryUpdate?.(memoryData);
        if (showAnalysis) {
          await loadAnalysis();
        }
      }
    } catch (err) {
      console.error('Memory refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatContextValue = (value: any): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getContextIcon = (key: string) => {
    if (key.includes('goal') || key.includes('task')) return 'pi pi-target';
    if (key.includes('message') || key.includes('chat')) return 'pi pi-comment';
    if (key.includes('error') || key.includes('problem')) return 'pi pi-exclamation-triangle';
    if (key.includes('data') || key.includes('file')) return 'pi pi-file';
    return 'pi pi-info-circle';
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <ProgressSpinner />
        <p className="mt-2 text-gray-600">Loading AI memory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
          <h3 className="text-lg font-semibold mb-2">Memory Not Available</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            label="Retry" 
            icon="pi pi-refresh"
            onClick={loadMemory}
            size="small"
          />
        </div>
      </Card>
    );
  }

  if (!memory) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          <i className="pi pi-brain text-4xl mb-3"></i>
          <p>No AI memory data available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Memory Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <i className="pi pi-brain mr-2 text-blue-500"></i>
            AI Agent Memory
          </h3>
          <p className="text-sm text-gray-500">
            Session: {memory.sessionId} • Last updated: {formatTimestamp(memory.lastExtracted)}
          </p>
        </div>
        <Button 
          label="Refresh"
          icon="pi pi-refresh"
          loading={refreshing}
          onClick={refreshMemory}
          size="small"
          outlined
        />
      </div>

      {/* Memory Overview */}
      {showAnalysis && analysis && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3 flex items-center">
            <i className="pi pi-chart-line mr-2 text-green-500"></i>
            Memory Analysis
          </h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analysis.currentContextSize}</div>
              <div className="text-sm text-gray-500">Context Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analysis.recentLearningsCount}</div>
              <div className="text-sm text-gray-500">Recent Learnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{analysis.activeConstraintsCount}</div>
              <div className="text-sm text-gray-500">Active Constraints</div>
            </div>
          </div>
          
          {analysis.decisionPatterns.length > 0 && (
            <div className="mb-3">
              <h5 className="text-sm font-semibold mb-2">Decision Patterns:</h5>
              <div className="flex flex-wrap gap-1">
                {analysis.decisionPatterns.map((pattern, index) => (
                  <Chip key={index} label={pattern} className="text-xs" />
                ))}
              </div>
            </div>
          )}
          
          {analysis.learningTrends.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold mb-2">Learning Trends:</h5>
              <div className="flex flex-wrap gap-1">
                {analysis.learningTrends.map((trend, index) => (
                  <Chip key={index} label={trend} className="text-xs" />
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Memory Details */}
      <Accordion multiple activeIndex={[0, 1, 2]}>
        {/* Current Context */}
        <AccordionTab 
          header={
            <div className="flex items-center">
              <i className="pi pi-sitemap mr-2 text-purple-500"></i>
              Current Context ({Object.keys(memory.currentContext).length} items)
            </div>
          }
        >
          {Object.keys(memory.currentContext).length === 0 ? (
            <p className="text-gray-500 italic">No context data available</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(memory.currentContext).map(([key, value]) => (
                <Card key={key} className="p-3">
                  <div className="flex items-start space-x-3">
                    <i className={`${getContextIcon(key)} text-gray-400 mt-1`}></i>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-800 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h5>
                      <pre className="text-sm text-gray-600 mt-1 whitespace-pre-wrap overflow-x-auto">
                        {formatContextValue(value)}
                      </pre>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </AccordionTab>

        {/* Recent Learnings */}
        <AccordionTab 
          header={
            <div className="flex items-center">
              <i className="pi pi-lightbulb mr-2 text-yellow-500"></i>
              Recent Learnings ({memory.recentLearnings.length} items)
            </div>
          }
        >
          {memory.recentLearnings.length === 0 ? (
            <p className="text-gray-500 italic">No recent learnings recorded</p>
          ) : (
            <Timeline 
              value={memory.recentLearnings.map((learning, index) => ({
                learning,
                index: memory.recentLearnings.length - index
              }))}
              align="left"
              content={(item) => (
                <div className="p-3">
                  <div className="flex items-start space-x-2">
                    <Badge value={item.index} className="bg-yellow-500" />
                    <p className="text-sm text-gray-700">{item.learning}</p>
                  </div>
                </div>
              )}
            />
          )}
        </AccordionTab>

        {/* Active Constraints */}
        <AccordionTab 
          header={
            <div className="flex items-center">
              <i className="pi pi-lock mr-2 text-red-500"></i>
              Active Constraints ({memory.activeConstraints.length} items)
            </div>
          }
        >
          {memory.activeConstraints.length === 0 ? (
            <p className="text-gray-500 italic">No active constraints</p>
          ) : (
            <div className="space-y-2">
              {memory.activeConstraints.map((constraint, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 rounded">
                  <i className="pi pi-exclamation-circle text-red-500 mt-1"></i>
                  <p className="text-sm text-gray-700">{constraint}</p>
                </div>
              ))}
            </div>
          )}
        </AccordionTab>

        {/* Decision Process */}
        <AccordionTab 
          header={
            <div className="flex items-center">
              <i className="pi pi-cog mr-2 text-blue-500"></i>
              Decision Process ({Object.keys(memory.decisionProcess).length} items)
            </div>
          }
        >
          {Object.keys(memory.decisionProcess).length === 0 ? (
            <p className="text-gray-500 italic">No decision process data available</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(memory.decisionProcess).map(([key, value]) => (
                <Card key={key} className="p-3">
                  <div className="flex items-start space-x-3">
                    <i className="pi pi-arrow-right text-blue-400 mt-1"></i>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-800 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h5>
                      <pre className="text-sm text-gray-600 mt-1 whitespace-pre-wrap overflow-x-auto">
                        {formatContextValue(value)}
                      </pre>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </AccordionTab>
      </Accordion>
    </div>
  );
};

export default MemoryViewer;