import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Button, Card, ProgressSpinner, Toast } from 'primereact';

// GraphQL Mutations for Telegram Bridge
const REQUEST_CRON_ANALYSIS = gql`
  mutation RequestCronAnalysis($jobData: JobDataInput!) {
    requestCronAnalysis(jobData: $jobData) {
      success
      requestId
      message
      estimatedWaitTime
    }
  }
`;

const WAIT_FOR_RESULT = gql`
  mutation WaitForAnalysisResult($requestId: ID!, $timeoutSeconds: Int) {
    waitForAnalysisResult(requestId: $requestId, timeoutSeconds: $timeoutSeconds) {
      success
      result {
        requestId
        analysis
        completedAt
      }
      message
      timeout
    }
  }
`;

export const TelegramBridgeDemo: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [requestId, setRequestId] = useState('');

  const [requestAnalysis] = useMutation(REQUEST_CRON_ANALYSIS);
  const [waitForResult] = useMutation(WAIT_FOR_RESULT);

  const handleTelegramAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      // Step 1: Send analysis request via Telegram
      const request = await requestAnalysis({
        variables: {
          jobData: {
            name: 'Daily Database Backup',
            schedule: '0 2 * * *',
            performance: {
              successRate: 85,
              avgDuration: 720,
              recentFailures: ['timeout', 'timeout', 'disk_full'],
              cpuUsage: 'high'
            }
          }
        }
      });

      if (request.data?.requestCronAnalysis?.success) {
        const reqId = request.data.requestCronAnalysis.requestId;
        setRequestId(reqId);
        
        console.log('📤 Analysis request sent via Telegram:', reqId);
        
        // Step 2: Wait for OpenClaw agent response
        const result = await waitForResult({
          variables: {
            requestId: reqId,
            timeoutSeconds: 60
          }
        });

        if (result.data?.waitForAnalysisResult?.success) {
          setAnalysisResult(result.data.waitForAnalysisResult.result);
          console.log('📥 AI Analysis received from OpenClaw!');
        } else {
          console.log('⏰ Analysis timed out, check Telegram for manual response');
        }
      }
    } catch (error) {
      console.error('Telegram bridge error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="telegram-bridge-demo">
      <Card title="🌉 Telegram Bridge Integration Demo">
        <div className="mb-4">
          <p>Test the Telegram message bridge pattern:</p>
          <ol>
            <li>Dashboard sends analysis request</li>
            <li>Request goes via Telegram message</li>
            <li>OpenClaw agent processes request</li>
            <li>AI analysis comes back via Telegram</li>
            <li>Dashboard displays results</li>
          </ol>
        </div>

        <Button
          label={isAnalyzing ? 'Analyzing via Telegram...' : 'Test Telegram Bridge'}
          icon={isAnalyzing ? 'pi pi-spin pi-spinner' : 'pi pi-telegram'}
          onClick={handleTelegramAnalysis}
          disabled={isAnalyzing}
          className="p-button-info mb-3"
        />

        {isAnalyzing && (
          <div className="flex align-items-center mb-3">
            <ProgressSpinner className="mr-2" />
            <span>Sending request via Telegram to OpenClaw agent...</span>
          </div>
        )}

        {requestId && (
          <div className="mb-3 p-3 bg-blue-50 border-round">
            <strong>Request ID:</strong> {requestId}
            <br />
            <small>Check Telegram group for OpenClaw agent response</small>
          </div>
        )}

        {analysisResult && (
          <Card title="🤖 AI Analysis Result (via Telegram)" className="mt-3">
            <pre className="text-sm bg-gray-50 p-3 border-round overflow-auto">
              {JSON.stringify(analysisResult.analysis, null, 2)}
            </pre>
            <small className="text-500">
              Completed: {new Date(analysisResult.completedAt).toLocaleString()}
            </small>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default TelegramBridgeDemo;