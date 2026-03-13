using CronCollaboration.Api.Models;
using System.Text.Json;

namespace CronCollaboration.Api.Services;

/// <summary>
/// Service for managing projects and integrating with OpenClaw
/// </summary>
public class ProjectService : IProjectService
{
    private readonly IOpenClawService _openClawService;
    private readonly ILogger<ProjectService> _logger;
    private readonly Dictionary<string, ProjectOverview> _projectCache = new();
    private DateTime _lastCacheUpdate = DateTime.MinValue;
    private readonly TimeSpan _cacheExpiry = TimeSpan.FromMinutes(2);

    // Known project job IDs (these would typically come from configuration or database)
    private readonly Dictionary<string, string> _knownProjects = new()
    {
        { "123f7b62-a415-4f5c-b260-0292a0253986", "FPS Development" },
        { "8975e81b-daef-4984-aabb-0f03a79f47ee", "Health Monitor" },
        { "559261a8-f5cd-4384-bfe0-a405aea22e23", "Collaboration Platform Phase 1" },
        { "2f4ae195-3eb7-47fe-8ad5-6bdb5c1d9e3d", "Collaboration Platform Phase 2" },
        { "b211dbb4-ba08-41d3-adbd-588de1c65065", "Collaboration Platform Phase 3" }
    };

    public ProjectService(IOpenClawService openClawService, ILogger<ProjectService> logger)
    {
        _openClawService = openClawService;
        _logger = logger;
    }

    /// <summary>
    /// Get all projects with real-time data from OpenClaw
    /// </summary>
    public async Task<ProjectListResponse> GetAllProjectsAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all projects from OpenClaw");

            // Check cache validity
            if (DateTime.UtcNow - _lastCacheUpdate < _cacheExpiry && _projectCache.Any())
            {
                _logger.LogInformation("Returning cached project data");
                return CreateProjectListResponse(_projectCache.Values.ToList());
            }

            var allCronJobs = await _openClawService.GetAllCronJobsAsync();
            var projects = new List<ProjectOverview>();

            foreach (var jobData in allCronJobs)
            {
                var project = await ConvertCronJobToProject(jobData);
                if (project != null)
                {
                    projects.Add(project);
                    _projectCache[project.JobId] = project;
                }
            }

            _lastCacheUpdate = DateTime.UtcNow;
            _logger.LogInformation("Fetched {Count} projects from OpenClaw", projects.Count);

            return CreateProjectListResponse(projects);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all projects");
            return new ProjectListResponse { Projects = new List<ProjectOverview>() };
        }
    }

    /// <summary>
    /// Get specific project details
    /// </summary>
    public async Task<ProjectOverview?> GetProjectAsync(string projectId)
    {
        try
        {
            _logger.LogInformation("Fetching project details for ID: {ProjectId}", projectId);

            // Check cache first
            if (_projectCache.ContainsKey(projectId) && DateTime.UtcNow - _lastCacheUpdate < _cacheExpiry)
            {
                return _projectCache[projectId];
            }

            var jobData = await _openClawService.GetCronJobStatusAsync(projectId);
            if (jobData == null)
            {
                return null;
            }

            var project = await ConvertCronJobToProject(jobData);
            if (project != null)
            {
                _projectCache[projectId] = project;
            }

            return project;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching project {ProjectId}", projectId);
            return null;
        }
    }

    /// <summary>
    /// Get AI agent memory for project
    /// </summary>
    public async Task<AgentMemory?> GetAgentMemoryAsync(string projectId)
    {
        try
        {
            _logger.LogInformation("Fetching agent memory for project: {ProjectId}", projectId);

            var jobData = await _openClawService.GetCronJobStatusAsync(projectId);
            if (jobData?.ContainsKey("sessionKey") != true)
            {
                return null;
            }

            var sessionKey = jobData["sessionKey"].ToString();
            var memoryData = await _openClawService.GetAgentMemoryAsync(sessionKey ?? "");

            if (memoryData == null)
            {
                return null;
            }

            var agentMemory = new AgentMemory
            {
                SessionId = sessionKey ?? "",
                ProjectId = projectId,
                CurrentContext = memoryData,
                LastExtracted = DateTime.UtcNow
            };

            // Extract meaningful data from session history
            if (memoryData.ContainsKey("messages"))
            {
                var messagesElement = (JsonElement)memoryData["messages"];
                var messages = JsonSerializer.Deserialize<List<Dictionary<string, object>>>(messagesElement.GetRawText());
                
                if (messages != null)
                {
                    // Extract recent learnings and constraints from messages
                    agentMemory.RecentLearnings = ExtractLearningsFromMessages(messages);
                    agentMemory.ActiveConstraints = ExtractConstraintsFromMessages(messages);
                    agentMemory.DecisionProcess = ExtractDecisionProcessFromMessages(messages);
                }
            }

            return agentMemory;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching agent memory for project {ProjectId}", projectId);
            return null;
        }
    }

    /// <summary>
    /// Get project suggestions (placeholder - would integrate with database)
    /// </summary>
    public async Task<SuggestionListResponse> GetProjectSuggestionsAsync(string projectId)
    {
        // This would typically query a database of suggestions
        // For now, return empty response
        return new SuggestionListResponse
        {
            Suggestions = new List<Suggestion>(),
            PendingCount = 0,
            ImplementedCount = 0,
            TotalCount = 0
        };
    }

    /// <summary>
    /// Get project analytics
    /// </summary>
    public async Task<AnalyticsData?> GetProjectAnalyticsAsync(string projectId)
    {
        try
        {
            _logger.LogInformation("Fetching analytics for project: {ProjectId}", projectId);

            var runs = await _openClawService.GetCronJobRunsAsync(projectId, 50);
            var metrics = _openClawService.CalculateMetrics(runs);

            var analytics = new AnalyticsData
            {
                ProjectId = projectId,
                TimePeriod = "Last 24 hours",
                GeneratedAt = DateTime.UtcNow
            };

            // Populate metrics
            analytics.Metrics = new Dictionary<string, double>
            {
                { "SuccessRate", metrics.SuccessRate },
                { "AverageDuration", metrics.DurationSeconds },
                { "TotalRuns", metrics.Last24HRuns },
                { "ErrorCount", metrics.ErrorCount },
                { "AverageDelay", metrics.AverageDelaySeconds }
            };

            // Generate trends
            analytics.Trends = GenerateTrends(runs);

            // Generate recommendations
            analytics.Recommendations = GenerateRecommendations(metrics);

            return analytics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching analytics for project {ProjectId}", projectId);
            return null;
        }
    }

    // PRIVATE HELPER METHODS

    private async Task<ProjectOverview?> ConvertCronJobToProject(Dictionary<string, object> jobData)
    {
        try
        {
            if (!jobData.ContainsKey("id") || !jobData.ContainsKey("name"))
            {
                return null;
            }

            var jobId = jobData["id"].ToString() ?? "";
            var jobName = jobData["name"].ToString() ?? "";

            // Get run history for performance metrics
            var runs = await _openClawService.GetCronJobRunsAsync(jobId, 20);
            var metrics = _openClawService.CalculateMetrics(runs);

            var project = new ProjectOverview
            {
                JobId = jobId,
                ProjectName = jobName,
                Description = ExtractDescription(jobData),
                CurrentPhase = ExtractCurrentPhase(jobData),
                Status = ExtractStatus(jobData),
                Performance = metrics,
                CreatedAt = ExtractCreatedAt(jobData),
                LastUpdated = DateTime.UtcNow,
                Progress = ExtractProgress(jobData, runs)
            };

            return project;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting cron job to project");
            return null;
        }
    }

    private ProjectStatus ExtractStatus(Dictionary<string, object> jobData)
    {
        if (!jobData.ContainsKey("enabled"))
        {
            return ProjectStatus.Error;
        }

        bool enabled;
        if (jobData["enabled"] is JsonElement enabledElement)
        {
            enabled = enabledElement.GetBoolean();
        }
        else
        {
            enabled = Convert.ToBoolean(jobData["enabled"]);
        }

        if (!enabled)
        {
            return ProjectStatus.Error;
        }

        if (jobData.ContainsKey("state"))
        {
            Dictionary<string, object>? state = null;
            
            if (jobData["state"] is JsonElement stateElement)
            {
                state = JsonSerializer.Deserialize<Dictionary<string, object>>(stateElement.GetRawText());
            }
            else if (jobData["state"] is Dictionary<string, object> stateDict)
            {
                state = stateDict;
            }
            
            if (state?.ContainsKey("runningAtMs") == true)
            {
                return ProjectStatus.Running;
            }
            
            if (state?.ContainsKey("nextRunAtMs") == true)
            {
                long nextRunMs;
                if (state["nextRunAtMs"] is JsonElement nextRunElement)
                {
                    nextRunMs = nextRunElement.GetInt64();
                }
                else
                {
                    nextRunMs = Convert.ToInt64(state["nextRunAtMs"]);
                }
                
                var nextRun = DateTimeOffset.FromUnixTimeMilliseconds(nextRunMs).DateTime;
                
                if (nextRun > DateTime.UtcNow)
                {
                    return ProjectStatus.Waiting;
                }
            }
        }

        return ProjectStatus.Scheduled;
    }

    private string ExtractDescription(Dictionary<string, object> jobData)
    {
        if (jobData.ContainsKey("payload"))
        {
            Dictionary<string, object>? payload = null;
            
            if (jobData["payload"] is JsonElement payloadElement)
            {
                payload = JsonSerializer.Deserialize<Dictionary<string, object>>(payloadElement.GetRawText());
            }
            else if (jobData["payload"] is Dictionary<string, object> payloadDict)
            {
                payload = payloadDict;
            }
            
            if (payload?.ContainsKey("message") == true)
            {
                var message = payload["message"]?.ToString() ?? "";
                // Extract first line or first few words as description
                var lines = message.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                return lines.Length > 0 ? lines[0].Trim() : "";
            }
        }

        return "Automated cron job process";
    }

    private string ExtractCurrentPhase(Dictionary<string, object> jobData)
    {
        var name = jobData["name"]?.ToString() ?? "";
        
        if (name.Contains("Phase 1"))
            return "Phase 1: Basic Implementation";
        if (name.Contains("Phase 2"))
            return "Phase 2: AI Memory & Suggestions";
        if (name.Contains("Phase 3"))
            return "Phase 3: Advanced Features";
        if (name.Contains("FPS"))
            return "Continuous Development";
        if (name.Contains("Health"))
            return "Monitoring & Health Check";
            
        return "Active Development";
    }

    private DateTime ExtractCreatedAt(Dictionary<string, object> jobData)
    {
        if (jobData.ContainsKey("createdAtMs"))
        {
            long createdMs;
            if (jobData["createdAtMs"] is JsonElement createdElement)
            {
                createdMs = createdElement.GetInt64();
            }
            else
            {
                createdMs = Convert.ToInt64(jobData["createdAtMs"]);
            }
            return DateTimeOffset.FromUnixTimeMilliseconds(createdMs).DateTime;
        }
        
        return DateTime.UtcNow.AddDays(-1); // Default fallback
    }

    private ProjectProgress ExtractProgress(Dictionary<string, object> jobData, List<Dictionary<string, object>> runs)
    {
        var progress = new ProjectProgress
        {
            CurrentStep = "In Progress",
            CompletedSteps = new List<string>(),
            NextSteps = new List<string>(),
            ProgressPercentage = 0
        };

        // Calculate progress based on successful runs
        if (runs.Any())
        {
            var successfulRuns = runs.Count(r => r.ContainsKey("status") && r["status"].ToString() == "ok");
            progress.ProgressPercentage = Math.Min(100, (successfulRuns * 5)); // Each successful run = 5% progress
        }

        // Extract steps from job message if available
        if (jobData.ContainsKey("payload"))
        {
            try
            {
                Dictionary<string, object>? payload = null;
                
                if (jobData["payload"] is JsonElement payloadElement)
                {
                    payload = JsonSerializer.Deserialize<Dictionary<string, object>>(payloadElement.GetRawText());
                }
                else if (jobData["payload"] is Dictionary<string, object> payloadDict)
                {
                    payload = payloadDict;
                }
                
                if (payload?.ContainsKey("message") == true)
                {
                    var message = payload["message"]?.ToString() ?? "";
                    progress.NextSteps = ExtractStepsFromMessage(message);
                }
            }
            catch
            {
                // Ignore extraction errors
            }
        }

        return progress;
    }

    private List<string> ExtractStepsFromMessage(string message)
    {
        var steps = new List<string>();
        var lines = message.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        
        foreach (var line in lines)
        {
            if (line.Trim().StartsWith('-') || line.Trim().StartsWith('*') || char.IsDigit(line.Trim().FirstOrDefault()))
            {
                var step = line.Trim().TrimStart('-', '*', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', ' ');
                if (!string.IsNullOrWhiteSpace(step) && step.Length > 10)
                {
                    steps.Add(step);
                }
            }
        }
        
        return steps.Take(5).ToList(); // Limit to 5 steps
    }

    private List<string> ExtractLearningsFromMessages(List<Dictionary<string, object>> messages)
    {
        // Extract learnings from recent messages - simplified implementation
        return new List<string> { "Processing development cycles", "Monitoring performance metrics" };
    }

    private List<string> ExtractConstraintsFromMessages(List<Dictionary<string, object>> messages)
    {
        // Extract constraints from recent messages - simplified implementation
        return new List<string> { "Build verification required", "Performance targets must be met" };
    }

    private Dictionary<string, object> ExtractDecisionProcessFromMessages(List<Dictionary<string, object>> messages)
    {
        // Extract decision process from recent messages - simplified implementation
        return new Dictionary<string, object>
        {
            { "currentFocus", "Implementation and testing" },
            { "lastDecision", "Proceeding with Phase 1 development" },
            { "nextMilestone", "Complete OpenClaw integration" }
        };
    }

    private ProjectListResponse CreateProjectListResponse(List<ProjectOverview> projects)
    {
        var activeCount = projects.Count(p => p.Status == ProjectStatus.Running || p.Status == ProjectStatus.Waiting);
        var healthyCount = projects.Count(p => p.Performance.SuccessRate >= 90);

        return new ProjectListResponse
        {
            Projects = projects,
            TotalCount = projects.Count,
            ActiveCount = activeCount,
            HealthyCount = healthyCount
        };
    }

    private Dictionary<string, object> GenerateTrends(List<Dictionary<string, object>> runs)
    {
        // Generate trend analysis - simplified implementation
        return new Dictionary<string, object>
        {
            { "performanceTrend", "stable" },
            { "errorTrend", "decreasing" },
            { "durationTrend", "improving" }
        };
    }

    private List<string> GenerateRecommendations(PerformanceMetrics metrics)
    {
        var recommendations = new List<string>();

        if (metrics.SuccessRate < 90)
        {
            recommendations.Add("Consider adding error handling improvements");
        }

        if (metrics.DurationSeconds > 600) // 10 minutes
        {
            recommendations.Add("Optimize execution time for better performance");
        }

        if (metrics.ErrorCount > 2)
        {
            recommendations.Add("Investigate recurring error patterns");
        }

        if (!recommendations.Any())
        {
            recommendations.Add("Performance looks good - maintain current approach");
        }

        return recommendations;
    }
}