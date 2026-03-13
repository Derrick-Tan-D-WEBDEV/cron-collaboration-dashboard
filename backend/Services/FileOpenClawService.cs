using CronCollaboration.Api.Models;
using System.Text.Json;

namespace CronCollaboration.Api.Services;

/// <summary>
/// File-based OpenClaw service for development/demo purposes
/// </summary>
public class FileOpenClawService : IOpenClawService
{
    private readonly ILogger<FileOpenClawService> _logger;
    private readonly string _cronDataPath;
    private List<Dictionary<string, object>>? _cachedJobs;
    private DateTime _lastCacheTime = DateTime.MinValue;
    private readonly TimeSpan _cacheExpiry = TimeSpan.FromMinutes(1);

    public FileOpenClawService(ILogger<FileOpenClawService> logger)
    {
        _logger = logger;
        _cronDataPath = Path.Combine(Directory.GetCurrentDirectory(), "cron-data.json");
    }

    /// <summary>
    /// Get cron job status and information
    /// </summary>
    public async Task<Dictionary<string, object>?> GetCronJobStatusAsync(string jobId)
    {
        try
        {
            var jobs = await GetAllCronJobsAsync();
            return jobs.FirstOrDefault(j => j.ContainsKey("id") && j["id"].ToString() == jobId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cron job status for job ID: {JobId}", jobId);
            return null;
        }
    }

    /// <summary>
    /// Get cron job run history (simulated)
    /// </summary>
    public async Task<List<Dictionary<string, object>>> GetCronJobRunsAsync(string jobId, int limit = 10)
    {
        try
        {
            _logger.LogInformation("Simulating run history for job ID: {JobId}", jobId);
            
            var runs = new List<Dictionary<string, object>>();
            var random = new Random();
            var now = DateTime.UtcNow;
            
            // Generate simulated run history
            for (int i = 0; i < Math.Min(limit, 10); i++)
            {
                var runTime = now.AddHours(-i * 2 - random.NextDouble() * 0.5); // Every ~2 hours with some variation
                var isSuccess = random.NextDouble() > 0.1; // 90% success rate
                var duration = random.Next(300, 900) * 1000; // 5-15 minutes in milliseconds
                
                runs.Add(new Dictionary<string, object>
                {
                    { "id", Guid.NewGuid().ToString() },
                    { "jobId", jobId },
                    { "startedAtMs", ((DateTimeOffset)runTime).ToUnixTimeMilliseconds() },
                    { "finishedAtMs", ((DateTimeOffset)runTime.AddMilliseconds(duration)).ToUnixTimeMilliseconds() },
                    { "durationMs", duration },
                    { "status", isSuccess ? "ok" : "error" },
                    { "error", isSuccess ? null : "Simulated error" }
                });
            }
            
            return runs.OrderByDescending(r => (long)r["startedAtMs"]).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating simulated run history for job ID: {JobId}", jobId);
            return new List<Dictionary<string, object>>();
        }
    }

    /// <summary>
    /// Get AI agent memory from session (simulated)
    /// </summary>
    public async Task<Dictionary<string, object>?> GetAgentMemoryAsync(string sessionId)
    {
        try
        {
            _logger.LogInformation("Simulating agent memory for session ID: {SessionId}", sessionId);
            
            return new Dictionary<string, object>
            {
                { "sessionId", sessionId },
                { "messages", new List<Dictionary<string, object>>
                    {
                        new Dictionary<string, object>
                        {
                            { "role", "assistant" },
                            { "content", "Working on development tasks..." },
                            { "timestamp", DateTime.UtcNow.AddMinutes(-30) }
                        },
                        new Dictionary<string, object>
                        {
                            { "role", "system" },
                            { "content", "Build verification completed successfully" },
                            { "timestamp", DateTime.UtcNow.AddMinutes(-15) }
                        }
                    }
                },
                { "context", new Dictionary<string, object>
                    {
                        { "currentTask", "Phase 1 Development" },
                        { "progress", "Building OpenClaw integration" },
                        { "constraints", new[] { "Build must pass", "Performance targets required" } }
                    }
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error simulating agent memory for session ID: {SessionId}", sessionId);
            return null;
        }
    }

    /// <summary>
    /// Inject suggestion into cron job (simulated)
    /// </summary>
    public async Task<bool> InjectSuggestionAsync(string jobId, Suggestion suggestion)
    {
        try
        {
            _logger.LogInformation("Simulating suggestion injection for job {JobId}: {Content}", 
                jobId, suggestion.Content);
            
            // Simulate success with occasional failure
            var success = new Random().NextDouble() > 0.1; // 90% success rate
            
            if (success)
            {
                _logger.LogInformation("Successfully simulated suggestion injection for {SuggestionId}", 
                    suggestion.Id);
            }
            else
            {
                _logger.LogWarning("Simulated suggestion injection failure for {SuggestionId}", 
                    suggestion.Id);
            }
            
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error simulating suggestion injection for job {JobId}", jobId);
            return false;
        }
    }

    /// <summary>
    /// Get all cron jobs from file
    /// </summary>
    public async Task<List<Dictionary<string, object>>> GetAllCronJobsAsync()
    {
        try
        {
            // Check cache first
            if (_cachedJobs != null && DateTime.UtcNow - _lastCacheTime < _cacheExpiry)
            {
                return _cachedJobs;
            }

            _logger.LogInformation("Loading cron jobs from file: {FilePath}", _cronDataPath);
            
            if (!File.Exists(_cronDataPath))
            {
                _logger.LogWarning("Cron data file not found: {FilePath}", _cronDataPath);
                return new List<Dictionary<string, object>>();
            }

            var jsonContent = await File.ReadAllTextAsync(_cronDataPath);
            var cronResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonContent);

            if (cronResponse?.ContainsKey("jobs") == true)
            {
                var jobsElement = (JsonElement)cronResponse["jobs"];
                var jobs = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(jobsElement.GetRawText());
                
                _cachedJobs = jobs ?? new List<Dictionary<string, object>>();
                _lastCacheTime = DateTime.UtcNow;
                
                _logger.LogInformation("Loaded {Count} cron jobs from file", _cachedJobs.Count);
                return _cachedJobs;
            }

            return new List<Dictionary<string, object>>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading cron jobs from file");
            return new List<Dictionary<string, object>>();
        }
    }

    /// <summary>
    /// Calculate performance metrics from job runs
    /// </summary>
    public PerformanceMetrics CalculateMetrics(List<Dictionary<string, object>> runs)
    {
        var metrics = new PerformanceMetrics();
        
        if (!runs.Any())
        {
            return metrics;
        }

        var completedRuns = runs.Where(r => r.ContainsKey("status") && r["status"].ToString() == "ok").ToList();
        var errorRuns = runs.Where(r => r.ContainsKey("status") && r["status"].ToString() != "ok").ToList();

        metrics.Last24HRuns = runs.Count;
        metrics.SuccessRate = runs.Count > 0 ? (double)completedRuns.Count / runs.Count * 100 : 0;
        metrics.ErrorCount = errorRuns.Count;

        if (completedRuns.Any())
        {
            var durations = completedRuns
                .Where(r => r.ContainsKey("durationMs"))
                .Select(r => Convert.ToDouble(r["durationMs"]) / 1000.0) // Convert to seconds
                .Where(d => d > 0)
                .ToList();

            if (durations.Any())
            {
                metrics.DurationSeconds = durations.Average();
            }
        }

        // Calculate average delay (simplified for demo)
        metrics.AverageDelaySeconds = new Random().NextDouble() * 60; // 0-60 seconds random delay

        return metrics;
    }

    // === Phase 1 Enhanced Methods (Simulated) ===

    public async Task<Dictionary<string, object>?> GetFPSProjectStatusAsync()
    {
        var jobStatus = await GetCronJobStatusAsync("123f7b62-a415-4f5c-b260-0292a0253986");
        if (jobStatus == null) return null;

        var runs = await GetCronJobRunsAsync("123f7b62-a415-4f5c-b260-0292a0253986", 20);
        var metrics = CalculateMetrics(runs);

        return new Dictionary<string, object>(jobStatus)
        {
            ["projectType"] = "FPS Development",
            ["performance"] = metrics,
            ["recentRuns"] = runs.Take(5),
            ["isHealthy"] = metrics.SuccessRate >= 80,
            ["trend"] = "stable"
        };
    }

    public async Task<Dictionary<string, object>?> GetHealthMonitorStatusAsync()
    {
        var jobStatus = await GetCronJobStatusAsync("8975e81b-daef-4984-aabb-0f03a79f47ee");
        if (jobStatus == null) return null;

        var runs = await GetCronJobRunsAsync("8975e81b-daef-4984-aabb-0f03a79f47ee", 20);
        var metrics = CalculateMetrics(runs);

        return new Dictionary<string, object>(jobStatus)
        {
            ["projectType"] = "Health Monitor",
            ["performance"] = metrics,
            ["recentRuns"] = runs.Take(5),
            ["isHealthy"] = metrics.SuccessRate >= 95,
            ["trend"] = "stable"
        };
    }

    public async Task<Dictionary<string, object>> GetLiveProjectStatusAsync()
    {
        var fps = await GetFPSProjectStatusAsync();
        var health = await GetHealthMonitorStatusAsync();

        return new Dictionary<string, object>
        {
            ["timestamp"] = DateTime.UtcNow,
            ["fps"] = fps,
            ["healthMonitor"] = health,
            ["systemHealth"] = new Dictionary<string, object>
            {
                ["totalJobs"] = 5,
                ["activeJobs"] = 3,
                ["healthyJobs"] = 3,
                ["errorJobs"] = 0,
                ["healthPercentage"] = 100.0,
                ["overallStatus"] = "excellent"
            }
        };
    }

    public async Task<Dictionary<string, object>?> GetProjectAnalyticsAsync(string jobId, int daysPeriod = 7)
    {
        var runs = await GetCronJobRunsAsync(jobId, daysPeriod * 24);

        if (!runs.Any())
        {
            return new Dictionary<string, object>
            {
                ["jobId"] = jobId,
                ["period"] = daysPeriod,
                ["totalRuns"] = 0,
                ["message"] = "No run history available"
            };
        }

        var analytics = new Dictionary<string, object>
        {
            ["jobId"] = jobId,
            ["period"] = daysPeriod,
            ["totalRuns"] = runs.Count,
            ["successfulRuns"] = runs.Count(r => r.ContainsKey("status") && r["status"]?.ToString() == "ok"),
            ["failedRuns"] = runs.Count(r => r.ContainsKey("status") && r["status"]?.ToString() != "ok"),
            ["successRate"] = runs.Count > 0 ? runs.Count(r => r.ContainsKey("status") && r["status"]?.ToString() == "ok") / (double)runs.Count * 100 : 0,
            ["trend"] = "stable"
        };

        return analytics;
    }
}