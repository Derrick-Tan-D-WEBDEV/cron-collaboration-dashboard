import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { ProgressBar } from 'primereact/progressbar';
import { Knob } from 'primereact/knob';

interface CollaborationMetrics {
  totalSuggestions: number;
  implementedSuggestions: number;
  pendingSuggestions: number;
  implementationRate: number;
  averageResponseTimeMinutes: number;
  suggestionImpactScore: number;
  activeProjects: number;
  lastCalculated: string;
}

interface InteractionTrends {
  periodDays: number;
  suggestionTrends: Record<string, number>;
  memoryExtractionTrends: Record<string, number>;
  collaborationQuality: number;
  generatedAt: string;
}

interface CollaborationAnalyticsProps {
  refreshInterval?: number;
}

const CollaborationAnalytics: React.FC<CollaborationAnalyticsProps> = ({ 
  refreshInterval = 300000 // 5 minutes default
}) => {
  const [metrics, setMetrics] = useState<CollaborationMetrics | null>(null);
  const [trends, setTrends] = useState<InteractionTrends | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [chartOptions, setChartOptions] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
    
    // Set up auto-refresh
    const interval = setInterval(loadAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  useEffect(() => {
    if (trends) {
      setupCharts();
    }
  }, [trends]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsResponse, trendsResponse] = await Promise.all([
        fetch('/api/collaborationanalytics/effectiveness'),
        fetch('/api/collaborationanalytics/trends?daysBack=30')
      ]);

      if (metricsResponse.ok && trendsResponse.ok) {
        const [metricsData, trendsData] = await Promise.all([
          metricsResponse.json(),
          trendsResponse.json()
        ]);

        setMetrics(metricsData);
        setTrends(trendsData);
      } else {
        throw new Error('Failed to load analytics data');
      }
    } catch (err) {
      setError('Error loading collaboration analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupCharts = () => {
    if (!trends) return;

    // Suggestion trends chart
    const suggestionChartData = {
      labels: Object.keys(trends.suggestionTrends),
      datasets: [{
        label: 'Suggestions by Category',
        data: Object.values(trends.suggestionTrends),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ],
        borderWidth: 1
      }]
    };

    const suggestionChartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        title: {
          display: true,
          text: 'Suggestions by Category (Last 30 Days)'
        }
      }
    };

    setChartData(suggestionChartData);
    setChartOptions(suggestionChartOptions);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number): any => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'danger';
  };

  const formatResponseTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes.toFixed(1)}m`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = hours / 24;
    return `${days.toFixed(1)}d`;
  };

  const getImplementationRateColor = (rate: number): string => {
    if (rate >= 80) return '#4CAF50';
    if (rate >= 60) return '#FF9800';
    return '#F44336';
  };

  if (loading && !metrics) {
    return (
      <div className="text-center p-8">
        <i className="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
        <h3 className="text-lg font-semibold text-gray-700">Loading Analytics...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-4xl text-red-500 mb-3"></i>
          <h3 className="text-lg font-semibold mb-2">Analytics Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            label="Retry" 
            icon="pi pi-refresh"
            onClick={loadAnalytics}
          />
        </div>
      </Card>
    );
  }

  if (!metrics || !trends) {
    return (
      <Card className="p-6 text-center">
        <i className="pi pi-chart-line text-4xl text-gray-400 mb-3"></i>
        <p className="text-gray-500">No analytics data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <i className="pi pi-chart-line mr-3 text-blue-500"></i>
            Collaboration Analytics
          </h2>
          <p className="text-gray-600 mt-1">
            Human-AI collaboration effectiveness and trends
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Last updated: {new Date(metrics.lastCalculated).toLocaleString()}</p>
          <Button 
            label="Refresh"
            icon="pi pi-refresh"
            size="small"
            outlined
            onClick={loadAnalytics}
            loading={loading}
            className="mt-2"
          />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Implementation Rate */}
        <Card className="p-4">
          <div className="text-center">
            <div className="mb-3">
              <Knob 
                value={metrics.implementationRate} 
                size={80}
                valueColor={getImplementationRateColor(metrics.implementationRate)}
                rangeColor="#e5e7eb"
                textColor="#374151"
              />
            </div>
            <h3 className="font-semibold text-gray-800">Implementation Rate</h3>
            <p className="text-sm text-gray-500">{metrics.implementedSuggestions}/{metrics.totalSuggestions} completed</p>
          </div>
        </Card>

        {/* Response Time */}
        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatResponseTime(metrics.averageResponseTimeMinutes)}
            </div>
            <h3 className="font-semibold text-gray-800">Avg Response Time</h3>
            <p className="text-sm text-gray-500">From submission to implementation</p>
          </div>
        </Card>

        {/* Impact Score */}
        <Card className="p-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className={`text-3xl font-bold mr-2 ${getScoreColor(metrics.suggestionImpactScore)}`}>
                {metrics.suggestionImpactScore.toFixed(1)}
              </div>
              <Badge 
                value="/10" 
                severity={getScoreBadge(metrics.suggestionImpactScore)}
              />
            </div>
            <h3 className="font-semibold text-gray-800">Impact Score</h3>
            <p className="text-sm text-gray-500">Suggestion effectiveness rating</p>
          </div>
        </Card>

        {/* Active Projects */}
        <Card className="p-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {metrics.activeProjects}
            </div>
            <h3 className="font-semibold text-gray-800">Active Projects</h3>
            <p className="text-sm text-gray-500">Currently monitored</p>
          </div>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suggestion Statistics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <i className="pi pi-list mr-2 text-purple-500"></i>
            Suggestion Statistics
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Suggestions</span>
              <Badge value={metrics.totalSuggestions} severity="info" />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Implemented</span>
              <Badge value={metrics.implementedSuggestions} severity="success" />
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Pending</span>
              <Badge value={metrics.pendingSuggestions} severity="warning" />
            </div>

            <Divider />

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm">{metrics.implementationRate.toFixed(1)}%</span>
              </div>
              <ProgressBar 
                value={metrics.implementationRate} 
                color={getImplementationRateColor(metrics.implementationRate)}
              />
            </div>
          </div>
        </Card>

        {/* Memory Analytics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <i className="pi pi-brain mr-2 text-pink-500"></i>
            Memory Analytics
          </h3>
          
          <div className="space-y-3">
            {Object.entries(trends.memoryExtractionTrends).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <Badge value={value.toFixed(1)} severity="info" />
              </div>
            ))}

            <Divider />

            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(trends.collaborationQuality)}`}>
                {trends.collaborationQuality.toFixed(1)}/10
              </div>
              <p className="text-sm text-gray-500">Collaboration Quality</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      {chartData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <i className="pi pi-chart-pie mr-2 text-orange-500"></i>
            Suggestion Categories Breakdown
          </h3>
          
          <div className="h-80">
            <Chart 
              type="doughnut" 
              data={chartData} 
              options={chartOptions}
              className="w-full h-full"
            />
          </div>
        </Card>
      )}

      {/* Trends Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <i className="pi pi-trending-up mr-2 text-green-500"></i>
          30-Day Trends Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <i className="pi pi-lightbulb text-2xl text-blue-500 mb-2"></i>
            <h4 className="font-semibold text-blue-800">Most Active Category</h4>
            <p className="text-sm text-blue-600">
              {Object.entries(trends.suggestionTrends)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <i className="pi pi-clock text-2xl text-green-500 mb-2"></i>
            <h4 className="font-semibold text-green-800">Response Trend</h4>
            <p className="text-sm text-green-600">
              {metrics.averageResponseTimeMinutes < 30 ? 'Fast' : 
               metrics.averageResponseTimeMinutes < 120 ? 'Good' : 'Slow'}
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <i className="pi pi-star text-2xl text-purple-500 mb-2"></i>
            <h4 className="font-semibold text-purple-800">Quality Trend</h4>
            <p className="text-sm text-purple-600">
              {trends.collaborationQuality >= 8 ? 'Excellent' :
               trends.collaborationQuality >= 6 ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CollaborationAnalytics;