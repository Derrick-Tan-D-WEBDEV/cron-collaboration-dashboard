import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Performance metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');

// Test configuration
export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 500 }, // Ramp up to 500 users
    { duration: '5m', target: 500 }, // Stay at 500 users
    { duration: '10m', target: 1000 }, // Ramp up to 1000 users
    { duration: '10m', target: 1000 }, // Stay at 1000 users
    { duration: '5m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'], // Error rate should be below 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:4000';
const API_URL = `${BASE_URL}/api`;
const GRAPHQL_URL = `${BASE_URL}/graphql`;

// Test data
const testUser = {
  email: 'loadtest@example.com',
  password: 'LoadTest123!'
};

let authToken = '';

export function setup() {
  // Setup phase - authenticate once
  const loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify(testUser), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (loginResponse.status === 200) {
    const body = JSON.parse(loginResponse.body);
    return { token: body.token };
  }
  
  console.error('Setup failed: Unable to authenticate');
  return {};
}

export default function(data) {
  if (!data.token) {
    console.error('No auth token available');
    return;
  }

  authToken = data.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  };

  // Test 1: Dashboard API Performance
  testDashboardAPI(headers);
  sleep(1);

  // Test 2: Cron Jobs API Performance
  testCronJobsAPI(headers);
  sleep(1);

  // Test 3: Analytics API Performance
  testAnalyticsAPI(headers);
  sleep(1);

  // Test 4: GraphQL Performance
  testGraphQLAPI(headers);
  sleep(1);

  // Test 5: WebSocket Simulation
  testWebSocketSimulation(headers);
  sleep(1);

  // Test 6: Heavy Data Operations
  testHeavyDataOperations(headers);
  sleep(2);
}

function testDashboardAPI(headers) {
  const start = Date.now();
  
  // Dashboard overview
  const dashboardResponse = http.get(`${API_URL}/dashboard`, { headers });
  
  const duration = Date.now() - start;
  responseTime.add(duration);
  
  const success = check(dashboardResponse, {
    'Dashboard API status is 200': (r) => r.status === 200,
    'Dashboard API response time < 200ms': (r) => r.timings.duration < 200,
    'Dashboard API has required data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.metrics && body.trends;
      } catch {
        return false;
      }
    }
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testCronJobsAPI(headers) {
  const start = Date.now();
  
  // List cron jobs with pagination
  const jobsResponse = http.get(`${API_URL}/jobs?page=1&limit=20`, { headers });
  
  const duration = Date.now() - start;
  responseTime.add(duration);
  
  const success = check(jobsResponse, {
    'Jobs API status is 200': (r) => r.status === 200,
    'Jobs API response time < 150ms': (r) => r.timings.duration < 150,
    'Jobs API has pagination': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.pagination && Array.isArray(body.items);
      } catch {
        return false;
      }
    }
  });
  
  if (!success) {
    errorRate.add(1);
  }

  // Test job creation (simulate)
  const newJob = {
    name: `Load Test Job ${Math.random()}`,
    schedule: '0 */6 * * *',
    command: 'echo "load test"',
    environment: 'development',
    priority: 'low'
  };

  const createResponse = http.post(`${API_URL}/jobs`, JSON.stringify(newJob), { headers });
  
  check(createResponse, {
    'Create Job API status is 201': (r) => r.status === 201,
    'Create Job API response time < 300ms': (r) => r.timings.duration < 300
  });
}

function testAnalyticsAPI(headers) {
  const start = Date.now();
  
  // Analytics data with time range
  const analyticsResponse = http.get(
    `${API_URL}/analytics?start=2024-01-01&end=2024-01-31`, 
    { headers }
  );
  
  const duration = Date.now() - start;
  responseTime.add(duration);
  
  const success = check(analyticsResponse, {
    'Analytics API status is 200': (r) => r.status === 200,
    'Analytics API response time < 500ms': (r) => r.timings.duration < 500,
    'Analytics API has metrics': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.metrics && body.trends && body.predictions;
      } catch {
        return false;
      }
    }
  });
  
  if (!success) {
    errorRate.add(1);
  }

  // Test predictions endpoint
  const predictionsResponse = http.get(`${API_URL}/predictions`, { headers });
  
  check(predictionsResponse, {
    'Predictions API status is 200': (r) => r.status === 200,
    'Predictions API response time < 400ms': (r) => r.timings.duration < 400
  });
}

function testGraphQLAPI(headers) {
  const start = Date.now();
  
  // GraphQL query for dashboard data
  const query = {
    query: `
      query {
        cronJobs(pagination: { limit: 10 }) {
          items {
            id
            name
            status
            lastRun
            nextRun
            statistics {
              totalRuns
              successfulRuns
              uptimePercentage
            }
          }
        }
        analytics(timeRange: { start: "2024-01-01", end: "2024-01-31" }) {
          metrics {
            totalJobs
            activeJobs
            successRate
            averageRuntime
          }
        }
      }
    `
  };

  const graphqlResponse = http.post(GRAPHQL_URL, JSON.stringify(query), { headers });
  
  const duration = Date.now() - start;
  responseTime.add(duration);
  
  const success = check(graphqlResponse, {
    'GraphQL status is 200': (r) => r.status === 200,
    'GraphQL response time < 300ms': (r) => r.timings.duration < 300,
    'GraphQL has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.cronJobs && body.data.analytics;
      } catch {
        return false;
      }
    },
    'GraphQL no errors': (r) => {
      try {
        const body = JSON.parse(r.body);
        return !body.errors;
      } catch {
        return false;
      }
    }
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

function testWebSocketSimulation(headers) {
  // Simulate WebSocket load by making multiple concurrent requests
  const start = Date.now();
  
  // Simulate real-time data requests
  const requests = [
    http.get(`${API_URL}/executions/recent`, { headers }),
    http.get(`${API_URL}/alerts/unread`, { headers }),
    http.get(`${API_URL}/notifications`, { headers })
  ];

  const responses = http.batch(requests);
  const duration = Date.now() - start;
  responseTime.add(duration);
  
  const success = responses.every(response => 
    check(response, {
      'Real-time API status is 200': (r) => r.status === 200,
      'Real-time API response time < 100ms': (r) => r.timings.duration < 100
    })
  );
  
  if (!success) {
    errorRate.add(1);
  }
}

function testHeavyDataOperations(headers) {
  const start = Date.now();
  
  // Test report generation (CPU intensive)
  const reportRequest = {
    type: 'performance',
    timeRange: {
      start: '2024-01-01',
      end: '2024-01-31'
    },
    format: 'pdf'
  };

  const reportResponse = http.post(
    `${API_URL}/reports/generate`, 
    JSON.stringify(reportRequest), 
    { headers }
  );
  
  // Test bulk operations
  const bulkJobUpdate = {
    jobIds: ['job1', 'job2', 'job3'],
    action: 'pause'
  };

  const bulkResponse = http.post(
    `${API_URL}/jobs/bulk`, 
    JSON.stringify(bulkJobUpdate), 
    { headers }
  );
  
  const duration = Date.now() - start;
  responseTime.add(duration);
  
  const success = check(reportResponse, {
    'Report generation accepts request': (r) => r.status === 202 || r.status === 200,
    'Report generation response time < 1000ms': (r) => r.timings.duration < 1000
  }) && check(bulkResponse, {
    'Bulk operation status is 200': (r) => r.status === 200,
    'Bulk operation response time < 500ms': (r) => r.timings.duration < 500
  });
  
  if (!success) {
    errorRate.add(1);
  }
}

// Test different load patterns
export function testConcurrentUsers() {
  // Simulate concurrent user actions
  const userScenarios = [
    () => testDashboardAPI(),
    () => testCronJobsAPI(),
    () => testAnalyticsAPI()
  ];

  // Execute random scenario
  const scenario = userScenarios[Math.floor(Math.random() * userScenarios.length)];
  scenario();
}

// Memory usage simulation
export function testMemoryUsage() {
  // Simulate memory-intensive operations
  const largeDataRequest = http.get(
    `${API_URL}/analytics/detailed?days=365&includeAll=true`,
    { headers: { 'Authorization': `Bearer ${authToken}` } }
  );
  
  check(largeDataRequest, {
    'Large data request completes': (r) => r.status === 200,
    'Large data request under 2s': (r) => r.timings.duration < 2000
  });
}

export function handleSummary(data) {
  // Custom summary with performance insights
  const summary = {
    'performance_test_results.json': JSON.stringify(data, null, 2),
  };
  
  // Performance thresholds check
  const avgResponseTime = data.metrics.http_req_duration.values.avg;
  const errorRate = data.metrics.http_req_failed.values.rate;
  const p95ResponseTime = data.metrics.http_req_duration.values['p(95)'];
  
  console.log(`
    Performance Test Summary:
    ========================
    Average Response Time: ${avgResponseTime.toFixed(2)}ms
    95th Percentile: ${p95ResponseTime.toFixed(2)}ms
    Error Rate: ${(errorRate * 100).toFixed(2)}%
    
    Performance Goals:
    - ✅ 95th percentile < 500ms: ${p95ResponseTime < 500 ? 'PASS' : 'FAIL'}
    - ✅ Error rate < 10%: ${errorRate < 0.1 ? 'PASS' : 'FAIL'}
    - ✅ Avg response < 200ms: ${avgResponseTime < 200 ? 'PASS' : 'FAIL'}
  `);

  return summary;
}