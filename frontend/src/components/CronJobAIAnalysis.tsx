import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Card, Button, Chip, ProgressBar, Timeline, Badge } from 'primereact';

// GraphQL Mutation for AI Analysis
const ANALYZE_CRON_JOB = gql`
  mutation AnalyzeCronJob($jobId: ID!, $performanceData: JobPerformanceInput!) {
    analyzeCronJob(jobId: $jobId, performanceData: $performanceData) {
      success
      analysis {
        jobId
        recommendations
        optimizations
        predictions {
          type
          confidence  
          details
        }
        riskScore
        analyzedAt
      }
      error
    }
  }
`;

interface CronJobAIAnalysisProps {
  jobId: string;
  jobData: any;
}

export const CronJobAIAnalysis: React.FC<CronJobAIAnalysisProps> = ({ jobId, jobData }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [analyzeCronJob] = useMutation(ANALYZE_CRON_JOB);

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeCronJob({
        variables: {
          jobId,
          performanceData: {
            successRate: jobData.performance.successRate,
            avgDuration: jobData.performance.avgDuration,
            recentFailures: jobData.performance.recentFailures,
            cpuUsage: jobData.performance.cpuUsage,
            memoryUsage: jobData.performance.memoryUsage
          }
        }
      });

      if (result.data?.analyzeCronJob?.success) {
        setAnalysis(result.data.analyzeCronJob.analysis);
      } else {
        console.error('Analysis failed:', result.data?.analyzeCronJob?.error);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'success';
    if (score < 70) return 'warning';
    return 'danger';
  };

  return (
    <div className="ai-analysis-panel">
      <Card title="🤖 AI-Powered Analysis" className="mb-4">
        <div className="flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="m-0">{jobData.name}</h4>
            <p className="text-600 m-0">Schedule: {jobData.schedule}</p>
          </div>
          
          <Button
            label={isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
            icon={isAnalyzing ? 'pi pi-spin pi-spinner' : 'pi pi-brain'}
            onClick={handleAIAnalysis}
            disabled={isAnalyzing}
            className="p-button-success"
          />
        </div>

        {analysis && (
          <div className="analysis-results mt-4">
            {/* Risk Score */}
            <div className="mb-4">
              <div className="flex justify-content-between align-items-center mb-2">
                <span className="font-semibold">Risk Score</span>
                <Badge 
                  value={`${analysis.riskScore}/100`}
                  severity={getRiskColor(analysis.riskScore)}
                />
              </div>
              <ProgressBar 
                value={analysis.riskScore}
                color={getRiskColor(analysis.riskScore)}
                className="mb-2"
              />
            </div>

            {/* AI Recommendations */}
            <Card title="💡 AI Recommendations" className="mb-3">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="flex align-items-start mb-2">
                  <i className="pi pi-check-circle text-green-500 mr-2 mt-1"></i>
                  <span>{rec}</span>
                </div>
              ))}
            </Card>

            {/* Performance Optimizations */}
            <Card title="⚡ Performance Optimizations" className="mb-3">
              {analysis.optimizations.map((opt, index) => (
                <div key={index} className="flex align-items-start mb-2">
                  <i className="pi pi-bolt text-orange-500 mr-2 mt-1"></i>
                  <span>{opt}</span>
                </div>
              ))}
            </Card>

            {/* Predictions */}
            <Card title="🔮 AI Predictions" className="mb-3">
              <Timeline 
                value={analysis.predictions}
                content={(item) => (
                  <div className="prediction-item">
                    <div className="flex justify-content-between align-items-center mb-1">
                      <Chip 
                        label={item.type.replace('_', ' ').toUpperCase()}
                        className="mr-2"
                      />
                      <Badge 
                        value={`${Math.round(item.confidence * 100)}% confidence`}
                        severity="info"
                      />
                    </div>
                    <p className="text-600 m-0">{item.details}</p>
                  </div>
                )}
              />
            </Card>

            <div className="text-xs text-500 text-right">
              Analyzed: {new Date(analysis.analyzedAt).toLocaleString()}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CronJobAIAnalysis;