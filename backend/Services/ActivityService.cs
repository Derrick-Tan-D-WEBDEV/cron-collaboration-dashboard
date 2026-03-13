using CronCollaboration.Api.Models;
using CronCollaboration.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CronCollaboration.Api.Services;

/// <summary>
/// Service for managing activity tracking and real-time notifications
/// </summary>
public class ActivityService : IActivityService
{
    private readonly IHubContext<CollaborationHub> _hubContext;
    private readonly ILogger<ActivityService> _logger;
    private static readonly List<ActivityEvent> _activities = new();
    private static readonly object _activitiesLock = new object();

    public ActivityService(IHubContext<CollaborationHub> hubContext, ILogger<ActivityService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Get recent activities
    /// </summary>
    public async Task<List<ActivityEvent>> GetRecentActivitiesAsync(int limit = 50)
    {
        try
        {
            _logger.LogInformation("Fetching {Limit} recent activities", limit);
            
            lock (_activitiesLock)
            {
                return _activities
                    .OrderByDescending(a => a.Timestamp)
                    .Take(limit)
                    .ToList();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching recent activities");
            return new List<ActivityEvent>();
        }
    }

    /// <summary>
    /// Log a generic activity event
    /// </summary>
    public async Task LogActivityAsync(ActivityEvent activity)
    {
        try
        {
            _logger.LogInformation("Logging activity: {EventType} for project {ProjectId}", 
                activity.EventType, activity.ProjectId);

            lock (_activitiesLock)
            {
                _activities.Add(activity);
                
                // Keep only last 1000 activities
                if (_activities.Count > 1000)
                {
                    _activities.RemoveRange(0, _activities.Count - 1000);
                }
            }

            // Notify connected clients
            await NotifyActivityAsync(activity.ProjectId, activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging activity");
        }
    }

    /// <summary>
    /// Notify clients of activity via SignalR
    /// </summary>
    public async Task NotifyActivityAsync(string projectId, ActivityEvent activity)
    {
        try
        {
            // Send to general activity feed
            await _hubContext.Clients.Group("activity_feed")
                .SendAsync("ActivityUpdate", activity);

            // Send to specific project subscribers
            if (!string.IsNullOrEmpty(projectId))
            {
                await _hubContext.Clients.Group($"project_{projectId}")
                    .SendAsync("ProjectActivity", activity);
            }

            _logger.LogInformation("Activity notification sent for {EventType}", activity.EventType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending activity notification");
        }
    }

    /// <summary>
    /// Log suggestion-related activity
    /// </summary>
    public async Task LogSuggestionAsync(Suggestion suggestion)
    {
        try
        {
            var activity = new ActivityEvent
            {
                ProjectId = suggestion.ProjectId,
                EventType = "suggestion_submitted",
                Message = $"New {suggestion.Priority.ToString().ToLower()} priority suggestion: {TruncateMessage(suggestion.Content, 100)}",
                Details = new Dictionary<string, object>
                {
                    { "suggestionId", suggestion.Id },
                    { "priority", suggestion.Priority.ToString() },
                    { "category", suggestion.Category.ToString() },
                    { "submittedBy", suggestion.SubmittedBy }
                },
                Source = "human"
            };

            await LogActivityAsync(activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging suggestion activity for {SuggestionId}", suggestion.Id);
        }
    }

    /// <summary>
    /// Log project status change
    /// </summary>
    public async Task LogStatusChangeAsync(string projectId, ProjectStatus oldStatus, ProjectStatus newStatus)
    {
        try
        {
            var activity = new ActivityEvent
            {
                ProjectId = projectId,
                EventType = "status_change",
                Message = $"Status changed from {oldStatus} to {newStatus}",
                Details = new Dictionary<string, object>
                {
                    { "oldStatus", oldStatus.ToString() },
                    { "newStatus", newStatus.ToString() }
                },
                Source = "agent"
            };

            await LogActivityAsync(activity);

            // Send specific status change notification
            await _hubContext.Clients.Group($"project_{projectId}")
                .SendAsync("StatusChange", new
                {
                    ProjectId = projectId,
                    OldStatus = oldStatus.ToString(),
                    NewStatus = newStatus.ToString(),
                    Timestamp = DateTime.UtcNow
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging status change for project {ProjectId}", projectId);
        }
    }

    /// <summary>
    /// Log cron job execution activity
    /// </summary>
    public async Task LogJobExecutionAsync(string projectId, string jobName, bool success, double durationSeconds)
    {
        try
        {
            var eventType = success ? "job_success" : "job_error";
            var message = success 
                ? $"{jobName} completed successfully in {FormatDuration(durationSeconds)}"
                : $"{jobName} failed after {FormatDuration(durationSeconds)}";

            var activity = new ActivityEvent
            {
                ProjectId = projectId,
                EventType = eventType,
                Message = message,
                Details = new Dictionary<string, object>
                {
                    { "jobName", jobName },
                    { "success", success },
                    { "durationSeconds", durationSeconds }
                },
                Source = "agent"
            };

            await LogActivityAsync(activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging job execution for {JobName}", jobName);
        }
    }

    // PRIVATE HELPER METHODS

    private string TruncateMessage(string message, int maxLength)
    {
        if (string.IsNullOrEmpty(message) || message.Length <= maxLength)
        {
            return message;
        }

        return message.Substring(0, maxLength - 3) + "...";
    }

    private string FormatDuration(double seconds)
    {
        if (seconds < 60)
        {
            return $"{Math.Round(seconds)}s";
        }
        else if (seconds < 3600)
        {
            var minutes = Math.Floor(seconds / 60);
            var remainingSeconds = Math.Round(seconds % 60);
            return $"{minutes}m {remainingSeconds}s";
        }
        else
        {
            var hours = Math.Floor(seconds / 3600);
            var minutes = Math.Floor((seconds % 3600) / 60);
            return $"{hours}h {minutes}m";
        }
    }
}