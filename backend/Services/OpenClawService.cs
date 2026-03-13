using CronCollaboration.Api.Models;
using System.Text;
using System.Text.Json;

namespace CronCollaboration.Api.Services;

/// <summary>
/// Service for integrating with OpenClaw cron API - Phase 1 Enhanced Version
/// </summary>
public class OpenClawService : IOpenClawService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenClawService> _logger;
    private readonly string _baseUrl;
    
    // Phase 1 specific job IDs from the actual cron list
    public static readonly string FPS_JOB_ID = "123f7b62-a415-4f5c-b260-0292a0253986";
    public static readonly string HEALTH_MONITOR_JOB_ID = "8975e81b-daef-4984-aabb-0f03a79f47ee";
    public static readonly string PHASE1_JOB_ID = "559261a8-f5cd-4384-bfe0-a405aea22e23";
    public static readonly string PHASE2_JOB_ID = "2f4ae195-3eb7-47fe-8ad5-6bdb5c1d9e3d";
    public static readonly string PHASE3_JOB_ID = "b211dbb4-ba08-41d3-adbd-588de1c65065";

    public OpenClawService(HttpClient httpClient, ILogger<OpenClawService> logger, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        
        // Get OpenClaw Gateway URL from configuration or use localhost (corrected port)
        _baseUrl = configuration["OpenClaw:BaseUrl"] ?? "http://localhost:18789";
        
        // Configure HttpClient for OpenClaw API - use proper endpoint structure
        _httpClient.BaseAddress = new Uri(_baseUrl);
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
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
            
            var requestBody = new
            {
                action = "list",
                includeDisabled = true
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/cron", content);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch cron jobs. Status: {StatusCode}", response.StatusCode);
                return null;
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var cronResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);

            if (cronResponse?.ContainsKey("jobs") == true)
            {
                var jobsElement = (JsonElement)cronResponse["jobs"];
                var jobs = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(jobsElement.GetRawText());
                
                var job = jobs?.FirstOrDefault(j => j.ContainsKey("id") && j["id"].ToString() == jobId);
                return job != null ? CleanJsonElements(job) : null;
            }

            return null;
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
            
            var requestBody = new
            {
                action = "runs",
                jobId = jobId
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/cron", content);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch cron job runs. Status: {StatusCode}", response.StatusCode);
                return new List<Dictionary<string, object>>();
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var runResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);

            if (runResponse?.ContainsKey("entries") == true)
            {
                var runsElement = (JsonElement)runResponse["entries"];
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
            
            var requestBody = new
            {
                action = "history",
                sessionKey = sessionId,
                limit = 10,
                includeTools = true
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/sessions", content);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch session history. Status: {StatusCode}", response.StatusCode);
                return null;
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var sessionResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);

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
            var suggestionMessage = $"HUMAN SUGGESTION RECEIVED:\n\n" +
                                  $"**Priority:** {suggestion.Priority}\n" +
                                  $"**Category:** {suggestion.Category}\n" +
                                  $"**Content:** {suggestion.Content}\n\n" +
                                  $"Please incorporate this feedback into your next development cycle.";

            // Send suggestion to the session - use sessionKey from job if available
            var sessionKey = jobStatus.ContainsKey("sessionKey") ? jobStatus["sessionKey"].ToString() : "agent:main:main";
            
            var requestBody = new
            {
                action = "send",
                sessionKey = sessionKey,
                message = suggestionMessage
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/sessions", content);
            
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully injected suggestion {SuggestionId} into job {JobId}", suggestion.Id, jobId);
                return true;
            }
            else
            {
                _logger.LogWarning("Failed to inject suggestion. Status: {StatusCode}", response.StatusCode);
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
            _logger.LogInformation("Fetching all cron jobs");
            
            var requestBody = new
            {
                action = "list",
                includeDisabled = true
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/cron", content);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch cron jobs. Status: {StatusCode}", response.StatusCode);
                return new List<Dictionary<string, object>>();
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var cronResponse = JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);

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

        // Safely extract status values
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

    // === PHASE 1 ENHANCED METHODS ===

    /// <summary>
    /// Get FPS project real-time status and metrics
    /// </summary>
    public async Task<Dictionary<string, object>?> GetFPSProjectStatusAsync()
    {
        try
        {
            _logger.LogInformation("Fetching FPS project status (Job ID: {JobId})", FPS_JOB_ID);
            
            var jobStatus = await GetCronJobStatusAsync(FPS_JOB_ID);
            if (jobStatus == null)
            {
                _logger.LogWarning("FPS job not found");
                return null;
            }

            // Get recent run history for performance analysis
            var runs = await GetCronJobRunsAsync(FPS_JOB_ID, 30);
            var metrics = CalculateMetrics(runs);

            // Enhance with FPS-specific information
            var fpsStatus = new Dictionary<string, object>(jobStatus)
            {
                ["projectType"] = "FPS Development",
                ["performance"] = metrics,
                ["recentRuns"] = runs.Take(10),
                ["isHealthy"] = metrics.SuccessRate >= 80,
                ["trend"] = CalculateTrend(runs)
            };

            return fpsStatus;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching FPS project status");
            return null;
        }
    }

    /// <summary>
    /// Get Health Monitor project status
    /// </summary>
    public async Task<Dictionary<string, object>?> GetHealthMonitorStatusAsync()
    {
        try
        {
            _logger.LogInformation("Fetching Health Monitor status (Job ID: {JobId})", HEALTH_MONITOR_JOB_ID);
            
            var jobStatus = await GetCronJobStatusAsync(HEALTH_MONITOR_JOB_ID);
            if (jobStatus == null)
            {
                _logger.LogWarning("Health Monitor job not found");
                return null;
            }

            // Get recent run history
            var runs = await GetCronJobRunsAsync(HEALTH_MONITOR_JOB_ID, 20);
            var metrics = CalculateMetrics(runs);

            var monitorStatus = new Dictionary<string, object>(jobStatus)
            {
                ["projectType"] = "Health Monitor",
                ["performance"] = metrics,
                ["recentRuns"] = runs.Take(5),
                ["isHealthy"] = metrics.SuccessRate >= 95, // Higher standard for monitor
                ["lastCheck"] = runs.FirstOrDefault()
            };

            return monitorStatus;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Health Monitor status");
            return null;
        }
    }

    /// <summary>
    /// Get real-time status of all key projects
    /// </summary>
    public async Task<Dictionary<string, object>> GetLiveProjectStatusAsync()
    {
        try
        {
            _logger.LogInformation("Fetching live status for all key projects");

            var fpsTask = GetFPSProjectStatusAsync();
            var healthTask = GetHealthMonitorStatusAsync();
            var phase1Task = GetCronJobStatusAsync(PHASE1_JOB_ID);
            var phase2Task = GetCronJobStatusAsync(PHASE2_JOB_ID);
            var phase3Task = GetCronJobStatusAsync(PHASE3_JOB_ID);

            await Task.WhenAll(fpsTask, healthTask, phase1Task, phase2Task, phase3Task);

            var liveStatus = new Dictionary<string, object>
            {
                ["timestamp"] = DateTime.UtcNow,
                ["fps"] = fpsTask.Result,
                ["healthMonitor"] = healthTask.Result,
                ["phase1"] = phase1Task.Result,
                ["phase2"] = phase2Task.Result,
                ["phase3"] = phase3Task.Result,
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
                ["error"] = ex.Message
            };
        }
    }

    /// <summary>
    /// Calculate overall system health based on all projects
    /// </summary>
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
                if (job.ContainsKey("enabled") && Convert.ToBoolean(ExtractJsonValue(job["enabled"]) ?? false))
                {
                    activeJobs++;

                    var jobIdValue = ExtractJsonValue(job["id"]);
                    var jobId = jobIdValue?.ToString() ?? "";
                    
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

    /// <summary>
    /// Calculate performance trend from recent runs
    /// </summary>
    private string CalculateTrend(List<Dictionary<string, object>> runs)
    {
        if (runs.Count < 3)
            return "insufficient_data";

        var recentRuns = runs.Take(3).ToList();
        var olderRuns = runs.Skip(3).Take(3).ToList();

        if (!olderRuns.Any())
            return "stable";

        var recentSuccessRate = recentRuns.Count(r => 
            r.ContainsKey("status") && 
            ExtractJsonValue(r["status"])?.ToString() == "ok"
        ) / (double)recentRuns.Count;
        
        var olderSuccessRate = olderRuns.Count(r => 
            r.ContainsKey("status") && 
            ExtractJsonValue(r["status"])?.ToString() == "ok"
        ) / (double)olderRuns.Count;

        var difference = recentSuccessRate - olderSuccessRate;

        return difference switch
        {
            > 0.1 => "improving",
            < -0.1 => "declining", 
            _ => "stable"
        };
    }

    /// <summary>
    /// Determine overall system status
    /// </summary>
    private string DetermineOverallStatus(int healthyJobs, int activeJobs, int errorJobs)
    {
        if (activeJobs == 0)
            return "inactive";

        var healthPercentage = (double)healthyJobs / activeJobs;

        return healthPercentage switch
        {
            >= 0.9 => "excellent",
            >= 0.7 => "good",
            >= 0.5 => "fair",
            _ => "poor"
        };
    }

    /// <summary>
    /// Get detailed project analytics for a specific project
    /// </summary>
    public async Task<Dictionary<string, object>?> GetProjectAnalyticsAsync(string jobId, int daysPeriod = 7)
    {
        try
        {
            _logger.LogInformation("Getting analytics for project {JobId} over {Days} days", jobId, daysPeriod);

            // Get extended run history
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
                ["successfulRuns"] = runs.Count(r => r.ContainsKey("status") && r["status"]?.ToString() == "ok"),
                ["failedRuns"] = runs.Count(r => r.ContainsKey("status") && r["status"]?.ToString() != "ok"),
                ["successRate"] = runs.Count > 0 ? runs.Count(r => r.ContainsKey("status") && r["status"]?.ToString() == "ok") / (double)runs.Count * 100 : 0
            };

            // Calculate duration statistics
            var durations = runs
                .Where(r => r.ContainsKey("durationMs"))
                .Select(r => Convert.ToDouble(r["durationMs"]) / 1000.0)
                .Where(d => d > 0)
                .ToList();

            if (durations.Any())
            {
                analytics["averageDuration"] = durations.Average();
                analytics["minDuration"] = durations.Min();
                analytics["maxDuration"] = durations.Max();
                analytics["medianDuration"] = durations.OrderBy(x => x).Skip(durations.Count / 2).First();
            }

            // Daily breakdown
            var dailyStats = runs
                .Where(r => r.ContainsKey("startedAtMs"))
                .GroupBy(r => DateTimeOffset.FromUnixTimeMilliseconds(Convert.ToInt64(r["startedAtMs"])).Date)
                .Select(g => new {
                    Date = g.Key,
                    TotalRuns = g.Count(),
                    SuccessfulRuns = g.Count(r => r.ContainsKey("status") && r["status"]?.ToString() == "ok"),
                    AvgDuration = g.Where(r => r.ContainsKey("durationMs"))
                               .Select(r => Convert.ToDouble(r["durationMs"]) / 1000.0)
                               .DefaultIfEmpty(0)
                               .Average()
                })
                .OrderBy(x => x.Date)
                .ToList();

            analytics["dailyBreakdown"] = dailyStats;
            analytics["trend"] = CalculateTrend(runs);
            
            return analytics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project analytics for {JobId}", jobId);
            return null;
        }
    }
}