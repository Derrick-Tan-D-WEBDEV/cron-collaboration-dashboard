using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using CronCollaboration.Api.Models;
using CronCollaboration.Api.Services;
using CronCollaboration.Api.Hubs;

namespace CronCollaboration.Api.Controllers;

/// <summary>
/// Real-time monitoring controller for Phase 1 implementation
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MonitoringController : ControllerBase
{
    private readonly IOpenClawService _openClawService;
    private readonly IHubContext<CollaborationHub> _hubContext;
    private readonly ILogger<MonitoringController> _logger;

    public MonitoringController(
        IOpenClawService openClawService, 
        IHubContext<CollaborationHub> hubContext,
        ILogger<MonitoringController> logger)
    {
        _openClawService = openClawService;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Simple health check endpoint for Phase 1 testing
    /// </summary>
    [HttpGet("health")]
    public ActionResult<object> GetHealth()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            message = "Phase 1 Monitoring API is operational",
            version = "1.0"
        });
    }

    /// <summary>
    /// Test endpoint with mock data for Phase 1 verification
    /// </summary>
    [HttpGet("live-status-test")]
    public ActionResult<object> GetLiveStatusTest()
    {
        try
        {
            var mockData = new
            {
                timestamp = DateTime.UtcNow,
                fps = new
                {
                    id = "123f7b62-a415-4f5c-b260-0292a0253986",
                    name = "FPS.SimulatorService Health Check",
                    enabled = true,
                    projectType = "FPS Development",
                    performance = new
                    {
                        durationSeconds = 45.2,
                        successRate = 87.5,
                        averageDelaySeconds = 2.1,
                        errorCount = 2,
                        last24HRuns = 12
                    },
                    recentRuns = new[]
                    {
                        new { status = "ok", timestamp = DateTime.UtcNow.AddHours(-1), duration = 43000 },
                        new { status = "ok", timestamp = DateTime.UtcNow.AddHours(-3), duration = 47000 },
                        new { status = "error", timestamp = DateTime.UtcNow.AddHours(-5), duration = 0 }
                    },
                    isHealthy = true,
                    trend = "stable"
                },
                healthMonitor = new
                {
                    id = "8975e81b-daef-4984-aabb-0f03a79f47ee",
                    name = "FPS Cron Monitor - Daily Health Check",
                    enabled = true,
                    projectType = "Health Monitor",
                    performance = new
                    {
                        durationSeconds = 12.3,
                        successRate = 100.0,
                        averageDelaySeconds = 0.5,
                        errorCount = 0,
                        last24HRuns = 1
                    },
                    recentRuns = new[]
                    {
                        new { status = "ok", timestamp = DateTime.UtcNow.AddHours(-9), duration = 12300 }
                    },
                    isHealthy = true,
                    lastCheck = DateTime.UtcNow.AddHours(-9)
                },
                systemHealth = new
                {
                    totalJobs = 5,
                    activeJobs = 5,
                    healthyJobs = 4,
                    errorJobs = 1,
                    healthPercentage = 80.0,
                    overallStatus = "operational"
                }
            };

            return Ok(mockData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in test live status");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    /// <summary>
    /// Get live status of all key projects
    /// </summary>
    [HttpGet("live-status")]
    public async Task<ActionResult<Dictionary<string, object>>> GetLiveStatus()
    {
        try
        {
            var liveStatus = await _openClawService.GetLiveProjectStatusAsync();
            
            // Send live update to connected clients
            await _hubContext.Clients.Group("monitoring_feed").SendAsync("LiveStatusUpdate", liveStatus);
            
            return Ok(liveStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting live status");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get FPS project detailed status
    /// </summary>
    [HttpGet("fps-status")]
    public async Task<ActionResult<Dictionary<string, object>>> GetFPSStatus()
    {
        try
        {
            var fpsStatus = await _openClawService.GetFPSProjectStatusAsync();
            
            if (fpsStatus == null)
            {
                return NotFound("FPS project not found");
            }

            return Ok(fpsStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting FPS status");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get Health Monitor status
    /// </summary>
    [HttpGet("health-monitor-status")]
    public async Task<ActionResult<Dictionary<string, object>>> GetHealthMonitorStatus()
    {
        try
        {
            var healthStatus = await _openClawService.GetHealthMonitorStatusAsync();
            
            if (healthStatus == null)
            {
                return NotFound("Health Monitor project not found");
            }

            return Ok(healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Health Monitor status");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get detailed analytics for a specific project
    /// </summary>
    [HttpGet("analytics/{jobId}")]
    public async Task<ActionResult<Dictionary<string, object>>> GetProjectAnalytics(string jobId, [FromQuery] int days = 7)
    {
        try
        {
            var analytics = await _openClawService.GetProjectAnalyticsAsync(jobId, days);
            
            if (analytics == null)
            {
                return NotFound($"Analytics not available for project {jobId}");
            }

            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics for project {JobId}", jobId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get real-time performance metrics for all projects
    /// </summary>
    [HttpGet("performance-metrics")]
    public async Task<ActionResult<Dictionary<string, object>>> GetPerformanceMetrics()
    {
        try
        {
            _logger.LogInformation("Fetching real-time performance metrics for all projects");

            var allJobs = await _openClawService.GetAllCronJobsAsync();
            var metrics = new Dictionary<string, object>();

            foreach (var job in allJobs)
            {
                if (job.ContainsKey("id") && job.ContainsKey("name"))
                {
                    var jobId = job["id"]?.ToString() ?? "";
                    var jobName = job["name"]?.ToString() ?? "";

                    var runs = await _openClawService.GetCronJobRunsAsync(jobId, 10);
                    var performance = _openClawService.CalculateMetrics(runs);

                    metrics[jobId] = new
                    {
                        JobName = jobName,
                        Performance = performance,
                        LastRun = runs.FirstOrDefault(),
                        Status = ExtractJobStatus(job),
                        Trend = CalculateTrend(runs)
                    };
                }
            }

            return Ok(new
            {
                Timestamp = DateTime.UtcNow,
                ProjectMetrics = metrics,
                Summary = CalculateSummary(metrics)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting performance metrics");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Trigger real-time monitoring update
    /// </summary>
    [HttpPost("trigger-update")]
    public async Task<ActionResult> TriggerMonitoringUpdate()
    {
        try
        {
            _logger.LogInformation("Manually triggering monitoring update");

            var liveStatus = await _openClawService.GetLiveProjectStatusAsync();
            
            // Broadcast update to all monitoring clients
            await _hubContext.Clients.Group("monitoring_feed").SendAsync("ForcedUpdate", new
            {
                Timestamp = DateTime.UtcNow,
                Trigger = "Manual",
                Status = liveStatus
            });

            return Ok(new { message = "Monitoring update triggered", timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering monitoring update");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get cron job run history with enhanced details
    /// </summary>
    [HttpGet("runs/{jobId}")]
    public async Task<ActionResult<List<Dictionary<string, object>>>> GetJobRuns(string jobId, [FromQuery] int limit = 20)
    {
        try
        {
            var runs = await _openClawService.GetCronJobRunsAsync(jobId, limit);
            
            // Enhance run data with additional insights
            var enhancedRuns = runs.Select(run => {
                var enhanced = new Dictionary<string, object>(run);
                
                if (run.ContainsKey("durationMs"))
                {
                    enhanced["durationSeconds"] = Convert.ToDouble(run["durationMs"]) / 1000.0;
                }
                
                if (run.ContainsKey("startedAtMs"))
                {
                    enhanced["startedAt"] = DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(run["startedAtMs"])).ToString("O");
                }
                
                if (run.ContainsKey("finishedAtMs"))
                {
                    enhanced["finishedAt"] = DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(run["finishedAtMs"])).ToString("O");
                }

                return enhanced;
            }).ToList();

            return Ok(enhancedRuns);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting job runs for {JobId}", jobId);
            return StatusCode(500, "Internal server error");
        }
    }

    // PRIVATE HELPER METHODS

    private string ExtractJobStatus(Dictionary<string, object> job)
    {
        if (job.ContainsKey("enabled") && !Convert.ToBoolean(job["enabled"]))
        {
            return "disabled";
        }

        if (job.ContainsKey("state"))
        {
            // Extract state information
            var state = job["state"];
            if (state != null)
            {
                // Add state parsing logic here
                return "active";
            }
        }

        return "unknown";
    }

    private string CalculateTrend(List<Dictionary<string, object>> runs)
    {
        if (runs.Count < 3)
            return "insufficient_data";

        var recentSuccess = runs.Take(2).Count(r => r.ContainsKey("status") && r["status"]?.ToString() == "ok");
        var olderSuccess = runs.Skip(2).Take(2).Count(r => r.ContainsKey("status") && r["status"]?.ToString() == "ok");

        if (recentSuccess > olderSuccess)
            return "improving";
        if (recentSuccess < olderSuccess)
            return "declining";
        
        return "stable";
    }

    private object CalculateSummary(Dictionary<string, object> metrics)
    {
        var totalProjects = metrics.Count;
        var healthyProjects = 0;
        var runningProjects = 0;
        
        foreach (var metric in metrics.Values)
        {
            // This would need proper implementation based on the actual metric structure
            healthyProjects++; // Placeholder
        }

        return new
        {
            TotalProjects = totalProjects,
            HealthyProjects = healthyProjects,
            RunningProjects = runningProjects,
            HealthPercentage = totalProjects > 0 ? (double)healthyProjects / totalProjects * 100 : 0
        };
    }
}