using CronCollaboration.Api.Services;
using CronCollaboration.Api.Hubs;
using CronCollaboration.Api.Models;
using Microsoft.AspNetCore.SignalR;

namespace CronCollaboration.Api.Services;

/// <summary>
/// Enhanced Background service for Phase 1 real-time monitoring and notifications
/// </summary>
public class RealTimeMonitoringService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RealTimeMonitoringService> _logger;
    private readonly TimeSpan _monitoringInterval = TimeSpan.FromMinutes(5); // Reduced frequency for Phase 1 stability
    
    private readonly Dictionary<string, ProjectStatus> _lastKnownStatuses = new();
    private readonly Dictionary<string, DateTime> _lastKnownActivity = new();
    private readonly Dictionary<string, PerformanceMetrics> _lastKnownMetrics = new();

    // Phase 1 specific tracking
    private DateTime _lastFPSCheck = DateTime.MinValue;
    private DateTime _lastHealthCheck = DateTime.MinValue;
    private Dictionary<string, object>? _lastSystemHealth = null;

    public RealTimeMonitoringService(IServiceProvider serviceProvider, ILogger<RealTimeMonitoringService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Phase 1 Enhanced Real-time monitoring service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PerformEnhancedMonitoringCycle();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during enhanced monitoring cycle");
            }

            await Task.Delay(_monitoringInterval, stoppingToken);
        }
    }

    private async Task PerformEnhancedMonitoringCycle()
    {
        using var scope = _serviceProvider.CreateScope();
        var projectService = scope.ServiceProvider.GetRequiredService<IProjectService>();
        var openClawService = scope.ServiceProvider.GetRequiredService<IOpenClawService>();
        var activityService = scope.ServiceProvider.GetRequiredService<IActivityService>();
        var hubContext = scope.ServiceProvider.GetRequiredService<IHubContext<CollaborationHub>>();

        try
        {
            _logger.LogDebug("Starting Phase 1 enhanced monitoring cycle");

            // Phase 1 Specific Monitoring
            await MonitorFPSProject(openClawService, activityService, hubContext);
            await MonitorHealthMonitor(openClawService, activityService, hubContext);
            await MonitorSystemHealth(openClawService, hubContext);

            // General project monitoring
            var projectsResponse = await projectService.GetAllProjectsAsync();
            var projects = projectsResponse.Projects;

            foreach (var project in projects)
            {
                await CheckProjectStatusChange(project, activityService, hubContext);
                await CheckProjectActivity(project, activityService, hubContext);
                await CheckPerformanceChanges(project, openClawService, hubContext);
            }

            // Send comprehensive monitoring update
            await SendLiveMonitoringUpdate(openClawService, hubContext, projects);

            _logger.LogDebug("Enhanced monitoring cycle completed - {ProjectCount} projects monitored", projects.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in enhanced monitoring cycle");
        }
    }

    private async Task MonitorFPSProject(IOpenClawService openClawService, IActivityService activityService, IHubContext<CollaborationHub> hubContext)
    {
        try
        {
            // Check FPS project every 2 minutes
            if (DateTime.UtcNow - _lastFPSCheck < TimeSpan.FromMinutes(2))
                return;

            _logger.LogDebug("Monitoring FPS Project status");

            var fpsStatus = await openClawService.GetFPSProjectStatusAsync();
            if (fpsStatus != null)
            {
                // Send FPS-specific updates
                await hubContext.Clients.Group("fps_monitoring").SendAsync("FPSStatusUpdate", new
                {
                    Timestamp = DateTime.UtcNow,
                    Status = fpsStatus,
                    ProjectType = "FPS Development"
                });

                // Check for significant changes
                var isHealthy = fpsStatus.ContainsKey("isHealthy") && Convert.ToBoolean(fpsStatus["isHealthy"]);
                var trend = fpsStatus.ContainsKey("trend") ? fpsStatus["trend"]?.ToString() : "unknown";

                if (!isHealthy || trend == "declining")
                {
                    await activityService.LogActivityAsync(new ActivityEvent
                    {
                        Id = Guid.NewGuid().ToString(),
                        ProjectId = OpenClawService.FPS_JOB_ID,
                        EventType = "Alert",
                        Message = $"FPS Project health issue detected: {(!isHealthy ? "Unhealthy" : "Performance declining")}",
                        Timestamp = DateTime.UtcNow,
                        Details = fpsStatus
                    });
                }
            }

            _lastFPSCheck = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error monitoring FPS project");
        }
    }

    private async Task MonitorHealthMonitor(IOpenClawService openClawService, IActivityService activityService, IHubContext<CollaborationHub> hubContext)
    {
        try
        {
            // Check Health Monitor every 3 minutes
            if (DateTime.UtcNow - _lastHealthCheck < TimeSpan.FromMinutes(3))
                return;

            _logger.LogDebug("Monitoring Health Monitor status");

            var healthStatus = await openClawService.GetHealthMonitorStatusAsync();
            if (healthStatus != null)
            {
                await hubContext.Clients.Group("health_monitoring").SendAsync("HealthMonitorUpdate", new
                {
                    Timestamp = DateTime.UtcNow,
                    Status = healthStatus,
                    ProjectType = "Health Monitor"
                });

                // Health Monitor should have higher standards
                var isHealthy = healthStatus.ContainsKey("isHealthy") && Convert.ToBoolean(healthStatus["isHealthy"]);
                
                if (!isHealthy)
                {
                    await activityService.LogActivityAsync(new ActivityEvent
                    {
                        Id = Guid.NewGuid().ToString(),
                        ProjectId = OpenClawService.HEALTH_MONITOR_JOB_ID,
                        EventType = "Critical Alert",
                        Message = "Health Monitor is reporting unhealthy status - system monitoring compromised",
                        Timestamp = DateTime.UtcNow,
                        Details = healthStatus
                    });
                }
            }

            _lastHealthCheck = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error monitoring Health Monitor");
        }
    }

    private async Task MonitorSystemHealth(IOpenClawService openClawService, IHubContext<CollaborationHub> hubContext)
    {
        try
        {
            var liveStatus = await openClawService.GetLiveProjectStatusAsync();
            
            if (liveStatus.ContainsKey("systemHealth"))
            {
                var systemHealth = (Dictionary<string, object>)liveStatus["systemHealth"];
                
                // Compare with previous system health
                if (_lastSystemHealth != null)
                {
                    var healthChanged = HasSystemHealthChanged(_lastSystemHealth, systemHealth);
                    if (healthChanged)
                    {
                        await hubContext.Clients.Group("system_monitoring").SendAsync("SystemHealthChange", new
                        {
                            Timestamp = DateTime.UtcNow,
                            PreviousHealth = _lastSystemHealth,
                            CurrentHealth = systemHealth,
                            OverallStatus = systemHealth.ContainsKey("overallStatus") ? systemHealth["overallStatus"] : "unknown"
                        });
                    }
                }

                _lastSystemHealth = systemHealth;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error monitoring system health");
        }
    }

    private async Task CheckPerformanceChanges(ProjectOverview project, IOpenClawService openClawService, IHubContext<CollaborationHub> hubContext)
    {
        try
        {
            var projectId = project.JobId;
            var currentMetrics = project.Performance;

            if (_lastKnownMetrics.ContainsKey(projectId))
            {
                var lastMetrics = _lastKnownMetrics[projectId];
                
                // Check for significant performance changes
                var successRateChange = Math.Abs(currentMetrics.SuccessRate - lastMetrics.SuccessRate);
                var durationChange = Math.Abs(currentMetrics.DurationSeconds - lastMetrics.DurationSeconds);

                if (successRateChange > 20 || durationChange > 30) // Thresholds for significant change
                {
                    await hubContext.Clients.Group($"project_{projectId}").SendAsync("PerformanceAlert", new
                    {
                        ProjectId = projectId,
                        ProjectName = project.ProjectName,
                        PreviousMetrics = lastMetrics,
                        CurrentMetrics = currentMetrics,
                        SuccessRateChange = currentMetrics.SuccessRate - lastMetrics.SuccessRate,
                        DurationChange = currentMetrics.DurationSeconds - lastMetrics.DurationSeconds,
                        Timestamp = DateTime.UtcNow
                    });
                }
            }

            _lastKnownMetrics[projectId] = currentMetrics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking performance changes for project {ProjectId}", project.JobId);
        }
    }

    private async Task SendLiveMonitoringUpdate(IOpenClawService openClawService, IHubContext<CollaborationHub> hubContext, List<ProjectOverview> projects)
    {
        try
        {
            var liveStatus = await openClawService.GetLiveProjectStatusAsync();
            
            await hubContext.Clients.Group("monitoring_feed").SendAsync("LiveMonitoringUpdate", new
            {
                Timestamp = DateTime.UtcNow,
                ProjectCount = projects.Count,
                ActiveCount = projects.Count(p => p.Status == ProjectStatus.Running),
                HealthyCount = projects.Count(p => p.Performance.SuccessRate >= 80),
                CriticalCount = projects.Count(p => p.Performance.SuccessRate < 50),
                SystemHealth = liveStatus.ContainsKey("systemHealth") ? liveStatus["systemHealth"] : null,
                FPSStatus = liveStatus.ContainsKey("fps") ? liveStatus["fps"] : null,
                HealthMonitorStatus = liveStatus.ContainsKey("healthMonitor") ? liveStatus["healthMonitor"] : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending live monitoring update");
        }
    }

    private bool HasSystemHealthChanged(Dictionary<string, object> previous, Dictionary<string, object> current)
    {
        try
        {
            // Check key health metrics for changes
            var prevStatus = previous.ContainsKey("overallStatus") ? previous["overallStatus"]?.ToString() : "";
            var currStatus = current.ContainsKey("overallStatus") ? current["overallStatus"]?.ToString() : "";
            
            if (prevStatus != currStatus)
                return true;

            var prevHealthPercentage = previous.ContainsKey("healthPercentage") ? Convert.ToDouble(previous["healthPercentage"]) : 0;
            var currHealthPercentage = current.ContainsKey("healthPercentage") ? Convert.ToDouble(current["healthPercentage"]) : 0;
            
            // Consider 10% change as significant
            return Math.Abs(prevHealthPercentage - currHealthPercentage) > 10;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error comparing system health");
            return false;
        }
    }

    private async Task CheckProjectStatusChange(ProjectOverview project, IActivityService activityService, IHubContext<CollaborationHub> hubContext)
    {
        try
        {
            var projectId = project.JobId;
            
            if (_lastKnownStatuses.ContainsKey(projectId))
            {
                var lastStatus = _lastKnownStatuses[projectId];
                if (lastStatus != project.Status)
                {
                    _logger.LogInformation("Status change detected for project {ProjectId}: {OldStatus} -> {NewStatus}", 
                        projectId, lastStatus, project.Status);

                    // Log the status change
                    await activityService.LogStatusChangeAsync(projectId, lastStatus, project.Status);

                    // Send real-time notification
                    await hubContext.Clients.Group($"project_{projectId}").SendAsync("ProjectUpdate", new
                    {
                        ProjectId = projectId,
                        Status = project.Status.ToString(),
                        Performance = project.Performance,
                        Progress = project.Progress,
                        Timestamp = DateTime.UtcNow
                    });

                    // Send status change notification
                    await hubContext.Clients.Group($"project_{projectId}").SendAsync("StatusChange", new
                    {
                        ProjectId = projectId,
                        OldStatus = lastStatus.ToString(),
                        NewStatus = project.Status.ToString(),
                        Timestamp = DateTime.UtcNow
                    });
                }
            }

            _lastKnownStatuses[projectId] = project.Status;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking status change for project {ProjectId}", project.JobId);
        }
    }

    private async Task CheckProjectActivity(ProjectOverview project, IActivityService activityService, IHubContext<CollaborationHub> hubContext)
    {
        try
        {
            var projectId = project.JobId;
            var currentActivity = project.LastUpdated;

            if (_lastKnownActivity.ContainsKey(projectId))
            {
                var lastActivity = _lastKnownActivity[projectId];
                if (currentActivity > lastActivity)
                {
                    _logger.LogDebug("New activity detected for project {ProjectId}", projectId);

                    // Check if this represents a new execution
                    if (project.Status == ProjectStatus.Running)
                    {
                        await activityService.LogJobExecutionAsync(
                            projectId, 
                            project.ProjectName, 
                            project.Performance.SuccessRate > 0, 
                            project.Performance.DurationSeconds
                        );
                    }

                    // Send performance update
                    await hubContext.Clients.Group($"project_{projectId}").SendAsync("PerformanceUpdate", new
                    {
                        ProjectId = projectId,
                        Performance = project.Performance,
                        Timestamp = DateTime.UtcNow
                    });
                }
            }

            _lastKnownActivity[projectId] = currentActivity;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking activity for project {ProjectId}", project.JobId);
        }
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Phase 1 Enhanced real-time monitoring service stopping");
        await base.StopAsync(stoppingToken);
    }
}