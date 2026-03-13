using CronCollaboration.Api.Models;
using System.Text.Json;

namespace CronCollaboration.Api.Services;

/// <summary>
/// Enhanced service for managing human suggestions with injection and tracking
/// </summary>
public class SuggestionService : ISuggestionService
{
    private readonly IOpenClawService _openClawService;
    private readonly IActivityService _activityService;
    private readonly ILogger<SuggestionService> _logger;
    private readonly List<Suggestion> _suggestions = new(); // In production, this would be a database
    private readonly Dictionary<string, SuggestionImplementationStatus> _implementationTracking = new();

    public SuggestionService(
        IOpenClawService openClawService, 
        IActivityService activityService,
        ILogger<SuggestionService> logger)
    {
        _openClawService = openClawService;
        _activityService = activityService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new suggestion with enhanced injection and tracking
    /// </summary>
    public async Task<Suggestion> CreateSuggestionAsync(CreateSuggestionRequest request)
    {
        _logger.LogInformation("Creating new suggestion for project {ProjectId}", request.ProjectId);

        var suggestion = new Suggestion
        {
            ProjectId = request.ProjectId,
            Content = request.Content,
            Priority = request.Priority,
            Category = request.Category,
            Status = SuggestionStatus.Pending,
            SubmittedBy = "User", // In production, get from authentication context
            SubmittedAt = DateTime.UtcNow
        };

        // Store suggestion (in production, save to database)
        _suggestions.Add(suggestion);

        // Log the suggestion activity
        await _activityService.LogSuggestionAsync(suggestion);

        // Attempt to inject suggestion into the cron job with enhanced tracking
        try
        {
            var injectionResult = await InjectSuggestionWithTrackingAsync(suggestion);
            
            if (injectionResult.Success)
            {
                suggestion.Status = SuggestionStatus.Implementing;
                suggestion.ImplementationNotes = $"Injected at {DateTime.UtcNow:HH:mm:ss}";
                
                // Track implementation status
                _implementationTracking[suggestion.Id] = new SuggestionImplementationStatus
                {
                    SuggestionId = suggestion.Id,
                    ProjectId = suggestion.ProjectId,
                    InjectedAt = DateTime.UtcNow,
                    ExpectedDelivery = DateTime.UtcNow.AddMinutes(injectionResult.EstimatedMinutes),
                    InjectionMethod = injectionResult.Method,
                    TrackingData = injectionResult.TrackingData
                };

                _logger.LogInformation("Successfully injected suggestion {SuggestionId} into project {ProjectId} via {Method}", 
                    suggestion.Id, request.ProjectId, injectionResult.Method);

                // Log injection success
                await _activityService.LogActivityAsync(new ActivityEvent
                {
                    ProjectId = suggestion.ProjectId,
                    EventType = "suggestion_injected",
                    Message = $"Suggestion successfully injected into active job execution",
                    Source = "system",
                    Details = new Dictionary<string, object>
                    {
                        { "suggestionId", suggestion.Id },
                        { "method", injectionResult.Method },
                        { "estimatedMinutes", injectionResult.EstimatedMinutes }
                    }
                });
            }
            else
            {
                suggestion.ImplementationNotes = $"Injection failed: {injectionResult.ErrorMessage}";
                _logger.LogWarning("Failed to inject suggestion {SuggestionId} into project {ProjectId}: {Error}", 
                    suggestion.Id, request.ProjectId, injectionResult.ErrorMessage);

                // Log injection failure
                await _activityService.LogActivityAsync(new ActivityEvent
                {
                    ProjectId = suggestion.ProjectId,
                    EventType = "suggestion_injection_failed",
                    Message = $"Could not inject suggestion: {injectionResult.ErrorMessage}",
                    Source = "system",
                    Details = new Dictionary<string, object>
                    {
                        { "suggestionId", suggestion.Id },
                        { "error", injectionResult.ErrorMessage }
                    }
                });
            }
        }
        catch (Exception ex)
        {
            suggestion.ImplementationNotes = $"Injection error: {ex.Message}";
            _logger.LogError(ex, "Error injecting suggestion {SuggestionId} into project {ProjectId}", 
                suggestion.Id, request.ProjectId);
        }

        return suggestion;
    }

    /// <summary>
    /// Inject suggestion with enhanced tracking
    /// </summary>
    private async Task<SuggestionInjectionResult> InjectSuggestionWithTrackingAsync(Suggestion suggestion)
    {
        try
        {
            // First, try direct injection via OpenClaw API
            var directInjection = await TryDirectInjectionAsync(suggestion);
            if (directInjection.Success)
            {
                return directInjection;
            }

            // If direct injection fails, try context injection
            var contextInjection = await TryContextInjectionAsync(suggestion);
            if (contextInjection.Success)
            {
                return contextInjection;
            }

            // If both fail, schedule for next execution
            return await ScheduleForNextExecutionAsync(suggestion);
        }
        catch (Exception ex)
        {
            return new SuggestionInjectionResult
            {
                Success = false,
                ErrorMessage = $"Injection failed: {ex.Message}",
                Method = "failed"
            };
        }
    }

    /// <summary>
    /// Try direct injection into running job
    /// </summary>
    private async Task<SuggestionInjectionResult> TryDirectInjectionAsync(Suggestion suggestion)
    {
        try
        {
            var success = await _openClawService.InjectSuggestionAsync(suggestion.ProjectId, suggestion);
            
            if (success)
            {
                return new SuggestionInjectionResult
                {
                    Success = true,
                    Method = "direct_injection",
                    EstimatedMinutes = 5,
                    TrackingData = new Dictionary<string, object>
                    {
                        { "injectionTime", DateTime.UtcNow },
                        { "targetProject", suggestion.ProjectId }
                    }
                };
            }

            return new SuggestionInjectionResult
            {
                Success = false,
                ErrorMessage = "Direct injection not available",
                Method = "direct_injection"
            };
        }
        catch (Exception ex)
        {
            return new SuggestionInjectionResult
            {
                Success = false,
                ErrorMessage = ex.Message,
                Method = "direct_injection"
            };
        }
    }

    /// <summary>
    /// Try context injection into job memory
    /// </summary>
    private async Task<SuggestionInjectionResult> TryContextInjectionAsync(Suggestion suggestion)
    {
        try
        {
            // Get job status to see if it's running
            var jobStatus = await _openClawService.GetCronJobStatusAsync(suggestion.ProjectId);
            if (jobStatus == null)
            {
                return new SuggestionInjectionResult
                {
                    Success = false,
                    ErrorMessage = "Job not found or not accessible",
                    Method = "context_injection"
                };
            }

            // Check if job is in a state that accepts context injection
            if (jobStatus.TryGetValue("status", out var statusObj) && statusObj?.ToString() == "Running")
            {
                // Try to inject into job's context/memory
                var contextPayload = CreateContextPayload(suggestion);
                
                // This would be the actual context injection implementation
                // For now, we'll simulate it
                var contextSuccess = await SimulateContextInjectionAsync(suggestion.ProjectId, contextPayload);
                
                if (contextSuccess)
                {
                    return new SuggestionInjectionResult
                    {
                        Success = true,
                        Method = "context_injection",
                        EstimatedMinutes = 10,
                        TrackingData = new Dictionary<string, object>
                        {
                            { "injectionTime", DateTime.UtcNow },
                            { "contextPayload", contextPayload }
                        }
                    };
                }
            }

            return new SuggestionInjectionResult
            {
                Success = false,
                ErrorMessage = "Job not in suitable state for context injection",
                Method = "context_injection"
            };
        }
        catch (Exception ex)
        {
            return new SuggestionInjectionResult
            {
                Success = false,
                ErrorMessage = ex.Message,
                Method = "context_injection"
            };
        }
    }

    /// <summary>
    /// Schedule suggestion for next job execution
    /// </summary>
    private async Task<SuggestionInjectionResult> ScheduleForNextExecutionAsync(Suggestion suggestion)
    {
        try
        {
            // Get job schedule to estimate next run time
            var jobStatus = await _openClawService.GetCronJobStatusAsync(suggestion.ProjectId);
            var nextRunMinutes = 30; // Default estimate

            if (jobStatus != null && jobStatus.TryGetValue("nextRun", out var nextRunObj))
            {
                if (DateTime.TryParse(nextRunObj?.ToString(), out var nextRun))
                {
                    nextRunMinutes = (int)(nextRun - DateTime.UtcNow).TotalMinutes;
                }
            }

            // Create scheduled injection record
            var scheduledData = new Dictionary<string, object>
            {
                { "scheduledFor", DateTime.UtcNow.AddMinutes(nextRunMinutes) },
                { "method", "next_execution" },
                { "suggestionPayload", CreateExecutionPayload(suggestion) }
            };

            return new SuggestionInjectionResult
            {
                Success = true,
                Method = "scheduled",
                EstimatedMinutes = Math.Max(nextRunMinutes, 5),
                TrackingData = scheduledData
            };
        }
        catch (Exception ex)
        {
            return new SuggestionInjectionResult
            {
                Success = false,
                ErrorMessage = ex.Message,
                Method = "scheduled"
            };
        }
    }

    /// <summary>
    /// Create context payload for suggestion injection
    /// </summary>
    private Dictionary<string, object> CreateContextPayload(Suggestion suggestion)
    {
        return new Dictionary<string, object>
        {
            { "type", "human_suggestion" },
            { "id", suggestion.Id },
            { "priority", suggestion.Priority.ToString() },
            { "category", suggestion.Category.ToString() },
            { "content", suggestion.Content },
            { "submittedAt", suggestion.SubmittedAt },
            { "deliveryMethod", "context_injection" }
        };
    }

    /// <summary>
    /// Create execution payload for suggestion injection
    /// </summary>
    private Dictionary<string, object> CreateExecutionPayload(Suggestion suggestion)
    {
        return new Dictionary<string, object>
        {
            { "type", "human_suggestion" },
            { "id", suggestion.Id },
            { "priority", suggestion.Priority.ToString() },
            { "category", suggestion.Category.ToString() },
            { "content", suggestion.Content },
            { "submittedAt", suggestion.SubmittedAt },
            { "deliveryMethod", "next_execution" },
            { "instructions", GenerateInstructionsForSuggestion(suggestion) }
        };
    }

    /// <summary>
    /// Generate specific instructions for the AI agent based on suggestion
    /// </summary>
    private string GenerateInstructionsForSuggestion(Suggestion suggestion)
    {
        var instructions = $"Human Suggestion (Priority: {suggestion.Priority}, Category: {suggestion.Category}):\n";
        instructions += suggestion.Content + "\n\n";
        
        switch (suggestion.Category)
        {
            case SuggestionCategory.Direction:
                instructions += "Consider adjusting your approach or strategy based on this guidance.";
                break;
            case SuggestionCategory.Bugfix:
                instructions += "Investigate and address the issue described above.";
                break;
            case SuggestionCategory.Feature:
                instructions += "Evaluate implementing this feature or enhancement.";
                break;
            case SuggestionCategory.Optimization:
                instructions += "Look for opportunities to optimize performance as suggested.";
                break;
            case SuggestionCategory.Quality:
                instructions += "Focus on quality improvements as outlined above.";
                break;
        }

        instructions += $"\n\nPlease acknowledge receipt and provide implementation plan.";
        return instructions;
    }

    /// <summary>
    /// Simulate context injection (placeholder for real implementation)
    /// </summary>
    private async Task<bool> SimulateContextInjectionAsync(string projectId, Dictionary<string, object> payload)
    {
        // In real implementation, this would use OpenClaw's context injection API
        await Task.Delay(100); // Simulate network delay
        return true; // Assume success for now
    }

    /// <summary>
    /// Track suggestion implementation progress
    /// </summary>
    public async Task<SuggestionImplementationStatus?> GetImplementationStatusAsync(string suggestionId)
    {
        if (_implementationTracking.TryGetValue(suggestionId, out var status))
        {
            // Check if suggestion has been completed
            await UpdateImplementationProgressAsync(status);
            return status;
        }
        return null;
    }

    /// <summary>
    /// Update implementation progress based on job execution
    /// </summary>
    private async Task UpdateImplementationProgressAsync(SuggestionImplementationStatus status)
    {
        try
        {
            // Check recent job runs for implementation evidence
            var recentRuns = await _openClawService.GetCronJobRunsAsync(status.ProjectId, 5);
            
            foreach (var run in recentRuns)
            {
                if (run.TryGetValue("startedAt", out var startedAtObj) && 
                    DateTime.TryParse(startedAtObj?.ToString(), out var startedAt))
                {
                    // If run started after injection, it might contain our suggestion
                    if (startedAt > status.InjectedAt && !status.ImplementationDetected)
                    {
                        status.ImplementationDetected = true;
                        status.ImplementationStartedAt = startedAt;
                        
                        // Look for completion evidence
                        if (run.TryGetValue("completedAt", out var completedAtObj) &&
                            DateTime.TryParse(completedAtObj?.ToString(), out var completedAt))
                        {
                            status.ImplementationCompletedAt = completedAt;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error updating implementation progress for suggestion {SuggestionId}", 
                status.SuggestionId);
        }
    }

    /// <summary>
    /// Get suggestion by ID
    /// </summary>
    public async Task<Suggestion?> GetSuggestionAsync(string suggestionId)
    {
        _logger.LogInformation("Fetching suggestion {SuggestionId}", suggestionId);
        
        return _suggestions.FirstOrDefault(s => s.Id == suggestionId);
    }

    /// <summary>
    /// Update suggestion status
    /// </summary>
    public async Task<Suggestion?> UpdateSuggestionAsync(string suggestionId, UpdateSuggestionRequest request)
    {
        _logger.LogInformation("Updating suggestion {SuggestionId}", suggestionId);

        var suggestion = _suggestions.FirstOrDefault(s => s.Id == suggestionId);
        if (suggestion == null)
        {
            return null;
        }

        suggestion.Status = request.Status;
        suggestion.ImplementationNotes = request.ImplementationNotes;
        suggestion.ImpactDescription = request.ImpactDescription;

        if (request.Status == SuggestionStatus.Complete || request.Status == SuggestionStatus.Declined)
        {
            suggestion.ImplementedAt = DateTime.UtcNow;
        }

        return suggestion;
    }

    /// <summary>
    /// Get all suggestions
    /// </summary>
    public async Task<SuggestionListResponse> GetAllSuggestionsAsync()
    {
        _logger.LogInformation("Fetching all suggestions");

        var pendingCount = _suggestions.Count(s => s.Status == SuggestionStatus.Pending);
        var implementedCount = _suggestions.Count(s => s.Status == SuggestionStatus.Complete);

        return new SuggestionListResponse
        {
            Suggestions = _suggestions.OrderByDescending(s => s.SubmittedAt).ToList(),
            PendingCount = pendingCount,
            ImplementedCount = implementedCount,
            TotalCount = _suggestions.Count
        };
    }

    /// <summary>
    /// Get suggestions for a specific project
    /// </summary>
    public async Task<SuggestionListResponse> GetProjectSuggestionsAsync(string projectId)
    {
        _logger.LogInformation("Fetching suggestions for project {ProjectId}", projectId);

        var projectSuggestions = _suggestions.Where(s => s.ProjectId == projectId).ToList();
        var pendingCount = projectSuggestions.Count(s => s.Status == SuggestionStatus.Pending);
        var implementedCount = projectSuggestions.Count(s => s.Status == SuggestionStatus.Complete);

        return new SuggestionListResponse
        {
            Suggestions = projectSuggestions.OrderByDescending(s => s.SubmittedAt).ToList(),
            PendingCount = pendingCount,
            ImplementedCount = implementedCount,
            TotalCount = projectSuggestions.Count
        };
    }
}

