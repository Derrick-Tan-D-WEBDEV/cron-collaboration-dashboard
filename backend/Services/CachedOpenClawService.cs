using CronCollaboration.Api.Models;
using System.Text.Json;
using System.Diagnostics;

namespace CronCollaboration.Api.Services;

/// <summary>
/// Efficient cached OpenClaw service for Phase 1 - reduces API calls
/// </summary>
public class CachedOpenClawService : IOpenClawService
{
    private readonly ILogger<CachedOpenClawService> _logger;
    private static readonly Dictionary<string, object> _cachedData = new();
    private static DateTime _lastCacheUpdate = DateTime.MinValue;
    private static readonly TimeSpan CacheExpiry = TimeSpan.FromMinutes(5);

    // Phase 1 job IDs
    public static readonly string FPS_JOB_ID = "123f7b62-a415-4f5c-b260-0292a0253986";
    public static readonly string HEALTH_MONITOR_JOB_ID = "8975e81b-daef-4984-aabb-0f03a79f47ee";
    public static readonly string PHASE1_JOB_ID = "559261a8-f5cd-4384-bfe0-a405aea22e23";

    public CachedOpenClawService(ILogger<CachedOpenClawService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Safely extract value from JsonElement
    /// </summary>
    private static object? ExtractJsonValue(object? value)
    {
        if (value is JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.String => element.GetString(),
                JsonValueKind.Number => element.TryGetInt64(out var l) ? l : element.GetDouble(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                JsonValueKind.Array => element.EnumerateArray().Select(e => ExtractJsonValue(e)).ToArray(),
                JsonValueKind.Object => JsonSerializer.Deserialize<Dictionary<string, object>>(element.GetRawText()),
                JsonValueKind.Null => null,
                _ => element.GetRawText()
            };
        }
        return value;
    }

    /// <summary>
    /// Clean JsonElement objects from dictionary
    /// </summary>
    private static Dictionary<string, object> CleanJsonElements(Dictionary<string, object> dict)
    {
        var cleaned = new Dictionary<string, object>();
        foreach (var kvp in dict)
        {
            cleaned[kvp.Key] = ExtractJsonValue(kvp.Value) ?? kvp.Value;
        }
        return cleaned;
    }

    /// <summary>
    /// Execute openclaw command efficiently
    /// </summary>
    private async Task<string> ExecuteOpenClawCommand(string arguments)
    {
        try
        {
            var processInfo = new ProcessStartInfo
            {
                FileName = "openclaw",
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(processInfo);
            if (process == null)
            {
                throw new InvalidOperationException("Failed to start openclaw process");
            }

            var outputTask = process.StandardOutput.ReadToEndAsync();
            var errorTask = process.StandardError.ReadToEndAsync();
            
            await process.WaitForExitAsync();

            var output = await outputTask;
            var error = await errorTask;

            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException($"openclaw command failed: {error}");
            }

            return output;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing openclaw command: {Arguments}", arguments);
            throw;
        }
    }

    /// <summary>
    /// Update cache if expired
    /// </summary>
    private async Task UpdateCacheIfNeeded()
    {
        if (DateTime.UtcNow - _lastCacheUpdate < CacheExpiry && _cachedData.Any())
        {
            return; // Cache still valid
        }

        try
        {
            _logger.LogInformation("Updating OpenClaw data cache");

            // Get all jobs
            var jobsOutput = await ExecuteOpenClawCommand("cron list");
            var jobsResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(jobsOutput);
            
            List<Dictionary<string, object>> allJobs = new();
            if (jobsResponse?.ContainsKey("jobs") == true)
            {
                var jobsElement = (JsonElement)jobsResponse["jobs"];
                allJobs = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(jobsElement.GetRawText())
                    ?.Select(CleanJsonElements).ToList() ?? new();
            }

            _cachedData["allJobs"] = allJobs;

            // Get runs for key projects
            foreach (var jobId in new[] { FPS_JOB_ID, HEALTH_MONITOR_JOB_ID, PHASE1_JOB_ID })
            {
                try
                {
                    var runsOutput = await ExecuteOpenClawCommand($"cron runs --id {jobId} --limit 10");
                    var runsResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(runsOutput);
                    
                    List<Dictionary<string, object>> runs = new();
                    if (runsResponse?.ContainsKey("entries") == true)
                    {
                        var runsElement = (JsonElement)runsResponse["entries"];
                        runs = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(runsElement.GetRawText())
                            ?.Select(CleanJsonElements).ToList() ?? new();
                    }

                    _cachedData[$"runs_{jobId}"] = runs;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get runs for job {JobId}", jobId);
                    _cachedData[$"runs_{jobId}"] = new List<Dictionary<string, object>>();
                }
            }

            _lastCacheUpdate = DateTime.UtcNow;
            _logger.LogInformation("Cache updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cache");
            // Don't throw - use existing cache or defaults
        }
    }

    public async Task<Dictionary<string, object>?> GetCronJobStatusAsync(string jobId)
    {
        await UpdateCacheIfNeeded();

        if (_cachedData.TryGetValue("allJobs", out var jobsObj) && 
            jobsObj is List<Dictionary<string, object>> jobs)
        {
            return jobs.FirstOrDefault(j => 
                j.ContainsKey("id") && 
                ExtractJsonValue(j["id"])?.ToString() == jobId);
        }

        return null;
    }

    public async Task<List<Dictionary<string, object>>> GetCronJobRunsAsync(string jobId, int limit = 10)
    {
        await UpdateCacheIfNeeded();

        if (_cachedData.TryGetValue($"runs_{jobId}", out var runsObj) &&
            runsObj is List<Dictionary<string, object>> runs)
        {
            return runs.Take(limit).ToList();
        }

        return new List<Dictionary<string, object>>();
    }

    public async Task<List<Dictionary<string, object>>> GetAllCronJobsAsync()
    {
        await UpdateCacheIfNeeded();

        if (_cachedData.TryGetValue("allJobs", out var jobsObj) && 
            jobsObj is List<Dictionary<string, object>> jobs)
        {
            return jobs;
        }

        return new List<Dictionary<string, object>>();
    }

    public PerformanceMetrics CalculateMetrics(List<Dictionary<string, object>> runs)
    {
        var metrics = new PerformanceMetrics();
        
        if (!runs.Any())
        {
            return metrics;
        }

        var completedRuns = runs.Where(r => 
            r.ContainsKey("status") && 
            ExtractJsonValue(r["status"])?.ToString() == "ok"
        ).ToList();
        
        var errorRuns = runs.Where(r => 
            r.ContainsKey("status") && 
            ExtractJsonValue(r["status"])?.ToString() != "ok"
        ).ToList();

        metrics.Last24HRuns = runs.Count;
        metrics.SuccessRate = runs.Count > 0 ? (double)completedRuns.Count / runs.Count * 100 : 0;
        metrics.ErrorCount = errorRuns.Count;

        if (completedRuns.Any())
        {
            var durations = completedRuns
                .Where(r => r.ContainsKey("durationMs"))
                .Select(r => {
                    var durationValue = ExtractJsonValue(r["durationMs"]);
                    return durationValue != null ? Convert.ToDouble(durationValue) / 1000.0 : 0.0;
                })
                .Where(d => d > 0)
                .ToList();

            if (durations.Any())
            {
                metrics.DurationSeconds = durations.Average();
            }
        }

        metrics.AverageDelaySeconds = 0;
        return metrics;
    }

    public async Task<Dictionary<string, object>?> GetAgentMemoryAsync(string sessionId)
    {
        // Simplified implementation for Phase 1
        return new Dictionary<string, object>
        {
            ["sessionId"] = sessionId,
            ["status"] = "Phase 1 - Memory service not implemented",
            ["timestamp"] = DateTime.UtcNow
        };
    }

    public async Task<bool> InjectSuggestionAsync(string jobId, Suggestion suggestion)
    {
        // Simplified implementation for Phase 1
        _logger.LogInformation("Phase 1: Suggestion injection not fully implemented for job {JobId}", jobId);
        return true;
    }

    // Phase 1 specific methods
    public async Task<Dictionary<string, object>?> GetFPSProjectStatusAsync()
    {
        var jobStatus = await GetCronJobStatusAsync(FPS_JOB_ID);
        if (jobStatus == null) return null;

        var runs = await GetCronJobRunsAsync(FPS_JOB_ID, 20);
        var metrics = CalculateMetrics(runs);

        var fpsStatus = new Dictionary<string, object>(jobStatus)
        {
            ["projectType"] = "FPS Development",
            ["performance"] = metrics,
            ["recentRuns"] = runs.Take(5),
            ["isHealthy"] = metrics.SuccessRate >= 80,
            ["trend"] = CalculateTrend(runs)
        };

        return fpsStatus;
    }

    public async Task<Dictionary<string, object>?> GetHealthMonitorStatusAsync()
    {
        var jobStatus = await GetCronJobStatusAsync(HEALTH_MONITOR_JOB_ID);
        if (jobStatus == null) return null;

        var runs = await GetCronJobRunsAsync(HEALTH_MONITOR_JOB_ID, 10);
        var metrics = CalculateMetrics(runs);

        var monitorStatus = new Dictionary<string, object>(jobStatus)
        {
            ["projectType"] = "Health Monitor",
            ["performance"] = metrics,
            ["recentRuns"] = runs.Take(3),
            ["isHealthy"] = metrics.SuccessRate >= 95,
            ["lastCheck"] = runs.FirstOrDefault()
        };

        return monitorStatus;
    }

    public async Task<Dictionary<string, object>> GetLiveProjectStatusAsync()
    {
        try
        {
            var fpsTask = GetFPSProjectStatusAsync();
            var healthTask = GetHealthMonitorStatusAsync();
            
            await Task.WhenAll(fpsTask, healthTask);

            var liveStatus = new Dictionary<string, object>
            {
                ["timestamp"] = DateTime.UtcNow,
                ["fps"] = fpsTask.Result,
                ["healthMonitor"] = healthTask.Result,
                ["systemHealth"] = await CalculateSystemHealthAsync()
            };

            return liveStatus;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching live project status");
            return new Dictionary<string, object>
            {
                ["timestamp"] = DateTime.UtcNow,
                ["error"] = ex.Message,
                ["status"] = "Phase 1 - Partial functionality"
            };
        }
    }

    private async Task<Dictionary<string, object>> CalculateSystemHealthAsync()
    {
        try
        {
            var allJobs = await GetAllCronJobsAsync();
            var activeJobs = allJobs.Count(j => 
                j.ContainsKey("enabled") && 
                Convert.ToBoolean(ExtractJsonValue(j["enabled"]) ?? false));

            return new Dictionary<string, object>
            {
                ["totalJobs"] = allJobs.Count,
                ["activeJobs"] = activeJobs,
                ["healthyJobs"] = activeJobs, // Simplified for Phase 1
                ["healthPercentage"] = activeJobs > 0 ? 90.0 : 0, // Estimated
                ["overallStatus"] = "operational"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating system health");
            return new Dictionary<string, object>
            {
                ["error"] = ex.Message,
                ["status"] = "unknown"
            };
        }
    }

    private string CalculateTrend(List<Dictionary<string, object>> runs)
    {
        if (runs.Count < 3) return "insufficient_data";

        var recentSuccess = runs.Take(2).Count(r => 
            r.ContainsKey("status") && 
            ExtractJsonValue(r["status"])?.ToString() == "ok");
        var olderSuccess = runs.Skip(2).Take(2).Count(r => 
            r.ContainsKey("status") && 
            ExtractJsonValue(r["status"])?.ToString() == "ok");

        if (recentSuccess > olderSuccess) return "improving";
        if (recentSuccess < olderSuccess) return "declining";
        return "stable";
    }

    public async Task<Dictionary<string, object>?> GetProjectAnalyticsAsync(string jobId, int daysPeriod = 7)
    {
        try
        {
            var runs = await GetCronJobRunsAsync(jobId, Math.Min(daysPeriod * 24, 50)); // Limit for Phase 1
            
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

            var metrics = CalculateMetrics(runs);
            
            return new Dictionary<string, object>
            {
                ["jobId"] = jobId,
                ["period"] = daysPeriod,
                ["totalRuns"] = runs.Count,
                ["successfulRuns"] = runs.Count(r => 
                    r.ContainsKey("status") && 
                    ExtractJsonValue(r["status"])?.ToString() == "ok"),
                ["failedRuns"] = runs.Count(r => 
                    r.ContainsKey("status") && 
                    ExtractJsonValue(r["status"])?.ToString() != "ok"),
                ["successRate"] = metrics.SuccessRate,
                ["averageDuration"] = metrics.DurationSeconds,
                ["trend"] = CalculateTrend(runs),
                ["lastUpdate"] = _lastCacheUpdate
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics for project {JobId}", jobId);
            return null;
        }
    }
}