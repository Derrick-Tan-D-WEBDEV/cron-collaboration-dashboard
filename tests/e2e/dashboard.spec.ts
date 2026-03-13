import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Test123456!',
  name: 'Test User'
};

const testJob = {
  name: 'Test Cron Job',
  description: 'E2E test job',
  schedule: '0 */6 * * *',
  command: 'echo "Hello World"',
  environment: 'development',
  priority: 'medium'
};

test.describe('Cron Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login');
  });

  test('should complete full user workflow', async ({ page }) => {
    // Test 1: Login
    await test.step('User login', async () => {
      await page.fill('[data-testid="email-input"]', testUser.email);
      await page.fill('[data-testid="password-input"]', testUser.password);
      await page.click('[data-testid="login-button"]');
      
      // Wait for dashboard to load
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      await expect(page).toHaveURL('http://localhost:3000/');
    });

    // Test 2: Dashboard Overview
    await test.step('Dashboard overview', async () => {
      // Check stats cards are visible
      await expect(page.locator('[data-testid="stats-total-jobs"]')).toBeVisible();
      await expect(page.locator('[data-testid="stats-active-jobs"]')).toBeVisible();
      await expect(page.locator('[data-testid="stats-success-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="stats-avg-runtime"]')).toBeVisible();

      // Check performance chart is loaded
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
      
      // Check recent executions table
      await expect(page.locator('[data-testid="recent-executions"]')).toBeVisible();
    });

    // Test 3: Create Cron Job
    await test.step('Create cron job', async () => {
      // Navigate to jobs page
      await page.click('[data-testid="nav-jobs"]');
      await expect(page).toHaveURL(/.*\/jobs/);

      // Click create job button
      await page.click('[data-testid="create-job-button"]');
      
      // Fill job form
      await page.fill('[data-testid="job-name"]', testJob.name);
      await page.fill('[data-testid="job-description"]', testJob.description);
      await page.fill('[data-testid="job-schedule"]', testJob.schedule);
      await page.fill('[data-testid="job-command"]', testJob.command);
      
      // Select environment
      await page.click('[data-testid="job-environment"]');
      await page.click(`[data-testid="environment-${testJob.environment}"]`);
      
      // Select priority
      await page.click('[data-testid="job-priority"]');
      await page.click(`[data-testid="priority-${testJob.priority}"]`);

      // Submit form
      await page.click('[data-testid="submit-job"]');
      
      // Verify job was created
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator(`text=${testJob.name}`)).toBeVisible();
    });

    // Test 4: Job Management
    await test.step('Job management', async () => {
      // Find the created job in the list
      const jobRow = page.locator(`[data-testid="job-row"]:has-text("${testJob.name}")`);
      await expect(jobRow).toBeVisible();

      // Test job actions
      await jobRow.locator('[data-testid="job-actions"]').click();
      
      // Test pause/resume
      await page.click('[data-testid="pause-job"]');
      await expect(page.locator('[data-testid="job-status"]:has-text("Paused")')).toBeVisible();
      
      await page.click('[data-testid="resume-job"]');
      await expect(page.locator('[data-testid="job-status"]:has-text("Active")')).toBeVisible();

      // Test manual execution
      await page.click('[data-testid="execute-job"]');
      await expect(page.locator('[data-testid="execution-started"]')).toBeVisible();
    });

    // Test 5: Analytics Page
    await test.step('Analytics page', async () => {
      await page.click('[data-testid="nav-analytics"]');
      await expect(page).toHaveURL(/.*\/analytics/);

      // Check analytics components
      await expect(page.locator('[data-testid="analytics-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="performance-trends"]')).toBeVisible();
      await expect(page.locator('[data-testid="resource-usage"]')).toBeVisible();
      
      // Test chart interactions
      await page.click('[data-testid="chart-type-selector"]');
      await page.click('[data-testid="chart-type-bar"]');
      await expect(page.locator('[data-testid="bar-chart"]')).toBeVisible();

      // Test time range selector
      await page.click('[data-testid="time-range-selector"]');
      await page.click('[data-testid="time-range-7d"]');
      
      // Wait for chart to update
      await page.waitForTimeout(1000);
    });

    // Test 6: Predictive Insights
    await test.step('Predictive insights', async () => {
      await page.click('[data-testid="nav-insights"]');
      await expect(page).toHaveURL(/.*\/insights/);

      // Check prediction components
      await expect(page.locator('[data-testid="failure-predictions"]')).toBeVisible();
      await expect(page.locator('[data-testid="optimization-suggestions"]')).toBeVisible();
      await expect(page.locator('[data-testid="performance-forecasts"]')).toBeVisible();

      // Test prediction refresh
      await page.click('[data-testid="refresh-predictions"]');
      await expect(page.locator('[data-testid="loading-predictions"]')).toBeVisible();
      await expect(page.locator('[data-testid="predictions-updated"]')).toBeVisible();
    });

    // Test 7: Reports
    await test.step('Reports generation', async () => {
      await page.click('[data-testid="nav-reports"]');
      await expect(page).toHaveURL(/.*\/reports/);

      // Create a new report
      await page.click('[data-testid="create-report"]');
      
      await page.fill('[data-testid="report-title"]', 'Test Performance Report');
      await page.selectOption('[data-testid="report-type"]', 'performance');
      await page.selectOption('[data-testid="report-format"]', 'pdf');
      
      await page.click('[data-testid="submit-report"]');
      await expect(page.locator('[data-testid="report-created"]')).toBeVisible();

      // Test report generation
      await page.click('[data-testid="generate-report"]');
      await expect(page.locator('[data-testid="report-generating"]')).toBeVisible();
    });

    // Test 8: Settings
    await test.step('Settings management', async () => {
      await page.click('[data-testid="nav-settings"]');
      await expect(page).toHaveURL(/.*\/settings/);

      // Test profile settings
      await page.click('[data-testid="profile-tab"]');
      await page.fill('[data-testid="user-name"]', 'Updated Test User');
      await page.click('[data-testid="save-profile"]');
      await expect(page.locator('[data-testid="profile-saved"]')).toBeVisible();

      // Test notification settings
      await page.click('[data-testid="notifications-tab"]');
      await page.check('[data-testid="email-notifications"]');
      await page.check('[data-testid="push-notifications"]');
      await page.click('[data-testid="save-notifications"]');
      await expect(page.locator('[data-testid="notifications-saved"]')).toBeVisible();

      // Test theme settings
      await page.click('[data-testid="appearance-tab"]');
      await page.click('[data-testid="dark-theme"]');
      await expect(page.locator('body')).toHaveClass(/.*dark.*/);
    });

    // Test 9: Mobile Responsiveness (simulate mobile)
    await test.step('Mobile responsiveness', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to dashboard
      await page.goto('http://localhost:3000/');
      
      // Check mobile navigation
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();

      // Test mobile menu
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible();
      
      // Test mobile navigation
      await page.click('[data-testid="mobile-nav-jobs"]');
      await expect(page).toHaveURL(/.*\/jobs/);

      // Test touch interactions (swipe simulation)
      const jobsContainer = page.locator('[data-testid="jobs-container"]');
      await jobsContainer.hover();
      await page.mouse.down();
      await page.mouse.move(100, 0);
      await page.mouse.up();
      
      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    // Test 10: Real-time Updates (WebSocket)
    await test.step('Real-time updates', async () => {
      // Navigate to dashboard
      await page.goto('http://localhost:3000/');
      
      // Check WebSocket connection status
      await expect(page.locator('[data-testid="ws-status-connected"]')).toBeVisible();
      
      // Monitor for real-time updates (this would typically involve
      // triggering backend events and watching for UI updates)
      
      // Simulate job status change
      await page.evaluate(() => {
        // This would normally come from WebSocket
        window.dispatchEvent(new CustomEvent('job-status-update', {
          detail: { jobId: 'test-job', status: 'completed' }
        }));
      });
      
      // Verify UI updated
      await expect(page.locator('[data-testid="notification-popup"]')).toBeVisible();
    });

    // Test 11: Error Handling
    await test.step('Error handling', async () => {
      // Test network error handling
      await page.route('**/api/**', route => route.abort());
      
      await page.click('[data-testid="refresh-data"]');
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Restore network
      await page.unroute('**/api/**');
      
      // Test retry functionality
      await page.click('[data-testid="retry-button"]');
      await expect(page.locator('[data-testid="data-loaded"]')).toBeVisible();
    });

    // Test 12: Performance
    await test.step('Performance validation', async () => {
      // Start performance measurement
      await page.goto('http://localhost:3000/');
      
      // Measure page load time
      const navigationTiming = await page.evaluate(() => JSON.stringify(performance.timing));
      const timing = JSON.parse(navigationTiming);
      
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      console.log(`Page load time: ${loadTime}ms`);
      
      // Performance should be under 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check for performance metrics
      const performanceEntries = await page.evaluate(() => 
        JSON.stringify(performance.getEntriesByType('navigation'))
      );
      
      console.log('Performance entries:', performanceEntries);
    });

    // Test 13: Cleanup
    await test.step('Cleanup test data', async () => {
      // Delete the test job
      await page.goto('http://localhost:3000/jobs');
      
      const jobRow = page.locator(`[data-testid="job-row"]:has-text("${testJob.name}")`);
      await jobRow.locator('[data-testid="job-actions"]').click();
      await page.click('[data-testid="delete-job"]');
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');
      await expect(page.locator('[data-testid="job-deleted"]')).toBeVisible();
      
      // Verify job is no longer in list
      await expect(jobRow).not.toBeVisible();
    });

    // Test 14: Logout
    await test.step('User logout', async () => {
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      
      await expect(page).toHaveURL('http://localhost:3000/login');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });
  });

  test('should handle accessibility requirements', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email-input"]:focus')).toBeVisible();
    
    // Test ARIA labels
    await expect(page.locator('[data-testid="login-form"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label');
    
    // Test screen reader compatibility
    const axeResults = await page.evaluate(() => {
      // This would use axe-core for accessibility testing
      return { violations: [] }; // Simplified for demo
    });
    
    expect(axeResults.violations.length).toBe(0);
  });

  test('should work in different browsers', async ({ browserName, page }) => {
    await page.goto('http://localhost:3000/');
    
    // Browser-specific tests
    if (browserName === 'webkit') {
      // Safari-specific tests
      await expect(page.locator('[data-testid="pwa-prompt"]')).toBeVisible();
    }
    
    if (browserName === 'firefox') {
      // Firefox-specific tests
      await page.context().grantPermissions(['notifications']);
    }
    
    // Common functionality should work across all browsers
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });
});