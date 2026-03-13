using CronCollaboration.Api.Models;
using System.Text.Json;
using System.Diagnostics;

namespace CronCollaboration.Api.Services;

/// <summary>
/// Service for integrating with OpenClaw via command line (fallback implementation)
/// </summary>
public class CommandLineOpenClawService : IOpenClawService
{
    private readonly ILogger<CommandLineOpenClawService> _logger;

    public CommandLineOpenClawService(ILogger<CommandLineOpenClawService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Safely extract value from JsonElement avoiding valueKind issues
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
    /// Get cron job status and information
    /// </summary>
    public async Task<Dictionary<string, object>?> GetCronJobStatusAsync(string jobId)
    {
        try
        {
            _logger.LogInformation("Fetching cron job status for job ID: {JobId}", jobId);
            
            var allJobs = await GetAllCronJobsAsync();
            var job = allJobs.FirstOrDefault(j => j.ContainsKey("id") && ExtractJsonValue(j["id"])?.ToString() == jobId);
            return job != null ? CleanJsonElements(job) : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cron job status for job ID: {JobId}", jobId);
            return null;
        }
    }

    /// <summary>
    /// Get cron job run history
    /// </summary>
    public async Task<List<Dictionary<string, object>>> GetCronJobRunsAsync(string jobId, int limit = 10)
    {
        try
        {
            _logger.LogInformation("Fetching run history for job ID: {JobId}, limit: {Limit}", jobId, limit);
            
            var processInfo = new ProcessStartInfo
            {
                FileName = "openclaw",
                Arguments = $"cron runs --id {jobId} --limit {limit}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(processInfo);
            if (process == null)
            {
                _logger.LogError("Failed to start openclaw process");
                return new List<Dictionary<string, object>>();
            }

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("openclaw cron runs command failed with exit code {ExitCode}: {Error}", 
                    process.ExitCode, error);
                return new List<Dictionary<string, object>>();
            }

            if (string.IsNullOrWhiteSpace(output))
            {
                return new List<Dictionary<string, object>>();
            }

            var cronResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(output);
            
            if (cronResponse?.ContainsKey("entries") == true)
            {
                var runsElement = (JsonElement)cronResponse["entries"];
                var runs = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(runsElement.GetRawText());
                return runs?.Take(limit).Select(CleanJsonElements).ToList() ?? new List<Dictionary<string, object>>();
            }

            return new List<Dictionary<string, object>>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching cron job runs for job ID: {JobId}", jobId);
            return new List<Dictionary<string, object>>();
        }
    }

    /// <summary>
    /// Get AI agent memory from session
    /// </summary>
    public async Task<Dictionary<string, object>?> GetAgentMemoryAsync(string sessionId)
    {
        try
        {
            _logger.LogInformation("Fetching agent memory for session ID: {SessionId}", sessionId);
            
            var processInfo = new ProcessStartInfo
            {
                FileName = "openclaw",
                Arguments = $"sessions history {sessionId} --limit 10",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(processInfo);
            if (process == null)
            {
                _logger.LogError("Failed to start openclaw process");
                return null;
            }

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("openclaw sessions history command failed with exit code {ExitCode}: {Error}", 
                    process.ExitCode, error);
                return null;
            }

            if (string.IsNullOrWhiteSpace(output))
            {
                return null;
            }

            var sessionResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(output);
            return sessionResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching agent memory for session ID: {SessionId}", sessionId);
            return null;
        }
    }

    /// <summary>
    /// Inject suggestion into cron job
    /// </summary>
    public async Task<bool> InjectSuggestionAsync(string jobId, Suggestion suggestion)
    {
        try
        {
            _logger.LogInformation("Injecting suggestion {SuggestionId} into job {JobId}", suggestion.Id, jobId);

            // Get current job configuration
            var jobStatus = await GetCronJobStatusAsync(jobId);
            if (jobStatus == null)
            {
                _logger.LogWarning("Cannot inject suggestion - job {JobId} not found", jobId);
                return false;
            }

            // Create suggestion injection message
            var suggestionMessage = $"HUMAN SUGGESTION RECEIVED:\\n\\n" +
                                  $"**Priority:** {suggestion.Priority}\\n" +
                                  $"**Category:** {suggestion.Category}\\n" +
                                  $"**Content:** {suggestion.Content}\\n\\n" +
                                  $"Please incorporate this feedback into your next development cycle.";

            // Send suggestion to the session - use sessionKey from job if available
            var sessionKey = jobStatus.ContainsKey("sessionKey") ? jobStatus["sessionKey"].ToString() : "agent:main:main";
            
            var processInfo = new ProcessStartInfo
            {
                FileName = "openclaw",
                Arguments = $"sessions send \"{sessionKey}\" \"{suggestionMessage}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(processInfo);
            if (process == null)
            {
                _logger.LogError("Failed to start openclaw process");
                return false;
            }

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            
            await process.WaitForExitAsync();

            if (process.ExitCode == 0)
            {
                _logger.LogInformation("Successfully injected suggestion {SuggestionId} into job {JobId}", suggestion.Id, jobId);
                return true;
            }
            else
            {
                _logger.LogWarning("Failed to inject suggestion. Exit code: {ExitCode}, Error: {Error}", 
                    process.ExitCode, error);
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error injecting suggestion {SuggestionId} into job {JobId}", suggestion.Id, jobId);
            return false;
        }
    }

    /// <summary>
    /// Get all cron jobs for dashboard overview
    /// </summary>
    public async Task<List<Dictionary<string, object>>> GetAllCronJobsAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all cron jobs via command line");
            
            var processInfo = new ProcessStartInfo
            {
                FileName = "openclaw",
                Arguments = "cron list --all --json",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(processInfo);
            if (process == null)
            {
                _logger.LogError("Failed to start openclaw process");
                return new List<Dictionary<string, object>>();
            }

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();
            
            await process.WaitForExitAsync();

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("openclaw cron list command failed with exit code {ExitCode}: {Error}", 
                    process.ExitCode, error);
                return new List<Dictionary<string, object>>();
            }

            if (string.IsNullOrWhiteSpace(output))
            {
                return new List<Dictionary<string, object>>();
            }

            var cronResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(output);

            if (cronResponse?.ContainsKey("jobs") == true)
            {
                var jobsElement = (JsonElement)cronResponse["jobs"];
                var jobs = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(jobsElement.GetRawText());
                return jobs?.Select(CleanJsonElements).ToList() ?? new List<Dictionary<string, object>>();
            }

            return new List<Dictionary<string, object>>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all cron jobs");
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

        // Calculate average delay (this would need more complex logic based on schedule vs actual run time)
        metrics.AverageDelaySeconds = 0; // TODO: Implement delay calculation

        return metrics;
    }

    // === Phase 1 Enhanced Methods ===

    public async Task<Dictionary<string, object>?> GetFPSProjectStatusAsync()
    {
        var jobStatus = await GetCronJobStatusAsync("123f7b62-a415-4f5c-b260-0292a0253986");
        if (jobStatus == null) return null;

        var runs = await GetCronJobRunsAsync("123f7b62-a415-4f5c-b260-0292a0253986", 30);
        var metrics = CalculateMetrics(runs);

        return new Dictionary<string, object>(jobStatus)
        {
            ["projectType"] = "FPS Development",
            ["performance"] = metrics,
            ["recentRuns"] = runs.Take(10),
            ["isHealthy"] = metrics.SuccessRate >= 80,
            ["trend"] = CalculateTrend(runs)
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
            ["lastCheck"] = runs.FirstOrDefault()
        };
    }

    public async Task<Dictionary<string, object>> GetLiveProjectStatusAsync()
    {
        var fpsTask = GetFPSProjectStatusAsync();
        var healthTask = GetHealthMonitorStatusAsync();

        await Task.WhenAll(fpsTask, healthTask);

        // Calculate system health from all jobs
        var systemHealth = await CalculateSystemHealthAsync();

        return new Dictionary<string, object>
        {
            ["timestamp"] = DateTime.UtcNow,
            ["fps"] = fpsTask.Result,
            ["healthMonitor"] = healthTask.Result,
            ["systemHealth"] = systemHealth
        };
    }

    public async Task<Dictionary<string, object>?> GetProjectAnalyticsAsync(string jobId, int daysPeriod = 7)
    {
        var runs = await GetCronJobRunsAsync(jobId, daysPeriod * 24); // Assume hourly runs max

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
            ["successfulRuns"] = runs.Count(r => r.ContainsKey("status") && GetStatusString(r["status"]) == "ok"),
            ["failedRuns"] = runs.Count(r => r.ContainsKey("status") && GetStatusString(r["status"]) != "ok"),
            ["successRate"] = runs.Count > 0 ? runs.Count(r => r.ContainsKey("status") && GetStatusString(r["status"]) == "ok") / (double)runs.Count * 100 : 0,
            ["trend"] = CalculateTrend(runs)
        };

        return analytics;
    }

    // Helper methods
    private async Task<Dictionary<string, object>> CalculateSystemHealthAsync()
    {
        try
        {
            var allJobs = await GetAllCronJobsAsync();
            var totalJobs = allJobs.Count;
            var activeJobs = 0;
            var healthyJobs = 0;
            var errorJobs = 0;

            foreach (var job in allJobs)
            {
                if (job.ContainsKey("enabled") && Convert.ToBoolean(job["enabled"]))
                {
                    activeJobs++;

                    var jobId = job["id"]?.ToString() ?? "";
                    var runs = await GetCronJobRunsAsync(jobId, 5);
                    var metrics = CalculateMetrics(runs);

                    if (metrics.SuccessRate >= 80)
                        healthyJobs++;
                    else if (metrics.ErrorCount > 0)
                        errorJobs++;
                }
            }

            return new Dictionary<string, object>
            {
                ["totalJobs"] = totalJobs,
                ["activeJobs"] = activeJobs,
                ["healthyJobs"] = healthyJobs,
                ["errorJobs"] = errorJobs,
                ["healthPercentage"] = activeJobs > 0 ? (double)healthyJobs / activeJobs * 100 : 0,
                ["overallStatus"] = DetermineOverallStatus(healthyJobs, activeJobs, errorJobs)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating system health");
            return new Dictionary<string, object>
            {
                ["error"] = ex.Message
            };
        }
    }

    private string CalculateTrend(List<Dictionary<string, object>> runs)
    {
        if (runs.Count < 3) return "insufficient_data";

        var recentRuns = runs.Take(3).ToList();
        var olderRuns = runs.Skip(3).Take(3).ToList();

        if (!olderRuns.Any()) return "stable";

        var recentSuccessRate = recentRuns.Count(r => r.ContainsKey("status") && GetStatusString(r["status"]) == "ok") / (double)recentRuns.Count;
        var olderSuccessRate = olderRuns.Count(r => r.ContainsKey("status") && GetStatusString(r["status"]) == "ok") / (double)olderRuns.Count;

        var difference = recentSuccessRate - olderSuccessRate;

        return difference switch
        {
            > 0.1 => "improving",
            < -0.1 => "declining",
            _ => "stable"
        };
    }

    private string GetStatusString(object? status)
    {
        if (status is JsonElement statusElement)
        {
            return statusElement.GetString() ?? "";
        }
        return status?.ToString() ?? "";
    }

    private string DetermineOverallStatus(int healthyJobs, int activeJobs, int errorJobs)
    {
        if (activeJobs == 0) return "inactive";

        var healthPercentage = (double)healthyJobs / activeJobs;

        return healthPercentage switch
        {
            >= 0.9 => "excellent",
            >= 0.7 => "good",
            >= 0.5 => "fair",
            _ => "poor"
        };
    }
}