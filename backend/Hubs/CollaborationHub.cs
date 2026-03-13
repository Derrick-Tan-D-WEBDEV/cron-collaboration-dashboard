using Microsoft.AspNetCore.SignalR;
using CronCollaboration.Api.Models;
using System.Collections.Concurrent;

namespace CronCollaboration.Api.Hubs;

/// <summary>
/// SignalR hub for real-time collaboration updates - Phase 1 Enhanced
/// </summary>
public class CollaborationHub : Hub
{
    private static readonly ConcurrentDictionary<string, List<string>> _projectSubscriptions = new();

    /// <summary>
    /// Join a project room for real-time updates
    /// </summary>
    public async Task JoinProject(string projectId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"project_{projectId}");
        
        if (!_projectSubscriptions.ContainsKey(projectId))
        {
            _projectSubscriptions[projectId] = new List<string>();
        }
        
        _projectSubscriptions[projectId].Add(Context.ConnectionId);
    }

    /// <summary>
    /// Leave a project room
    /// </summary>
    public async Task LeaveProject(string projectId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project_{projectId}");
        
        if (_projectSubscriptions.ContainsKey(projectId))
        {
            _projectSubscriptions[projectId].Remove(Context.ConnectionId);
        }
    }

    /// <summary>
    /// Join general activity feed
    /// </summary>
    public async Task JoinActivityFeed()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "activity_feed");
    }

    /// <summary>
    /// Leave general activity feed
    /// </summary>
    public async Task LeaveActivityFeed()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "activity_feed");
    }

    // === Phase 1 Enhanced Monitoring Groups ===

    /// <summary>
    /// Join main monitoring feed for live dashboard updates
    /// </summary>
    public async Task JoinMonitoringFeed()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "monitoring_feed");
    }

    /// <summary>
    /// Leave main monitoring feed
    /// </summary>
    public async Task LeaveMonitoringFeed()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "monitoring_feed");
    }

    /// <summary>
    /// Join FPS project specific monitoring
    /// </summary>
    public async Task JoinFPSMonitoring()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "fps_monitoring");
    }

    /// <summary>
    /// Leave FPS project monitoring
    /// </summary>
    public async Task LeaveFPSMonitoring()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "fps_monitoring");
    }

    /// <summary>
    /// Join Health Monitor specific monitoring
    /// </summary>
    public async Task JoinHealthMonitoring()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "health_monitoring");
    }

    /// <summary>
    /// Leave Health Monitor monitoring
    /// </summary>
    public async Task LeaveHealthMonitoring()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "health_monitoring");
    }

    /// <summary>
    /// Join system-wide health monitoring
    /// </summary>
    public async Task JoinSystemMonitoring()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "system_monitoring");
    }

    /// <summary>
    /// Leave system-wide health monitoring
    /// </summary>
    public async Task LeaveSystemMonitoring()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "system_monitoring");
    }

    /// <summary>
    /// Send project update to all subscribers
    /// </summary>
    public async Task SendProjectUpdate(string projectId, object updateData)
    {
        await Clients.Group($"project_{projectId}").SendAsync("ProjectUpdate", updateData);
    }

    /// <summary>
    /// Send suggestion update to project subscribers
    /// </summary>
    public async Task SendSuggestionUpdate(string projectId, object suggestion)
    {
        await Clients.Group($"project_{projectId}").SendAsync("SuggestionUpdate", suggestion);
    }

    /// <summary>
    /// Send activity update to all subscribers
    /// </summary>
    public async Task SendActivityUpdate(ActivityEvent activity)
    {
        // Send to general activity feed
        await Clients.Group("activity_feed").SendAsync("ActivityUpdate", activity);
        
        // Send to specific project subscribers
        if (!string.IsNullOrEmpty(activity.ProjectId))
        {
            await Clients.Group($"project_{activity.ProjectId}").SendAsync("ProjectActivity", activity);
        }
    }

    /// <summary>
    /// Send project status change notification
    /// </summary>
    public async Task SendStatusChange(string projectId, ProjectStatus oldStatus, ProjectStatus newStatus)
    {
        var statusUpdate = new
        {
            ProjectId = projectId,
            OldStatus = oldStatus.ToString(),
            NewStatus = newStatus.ToString(),
            Timestamp = DateTime.UtcNow
        };

        await Clients.Group($"project_{projectId}").SendAsync("StatusChange", statusUpdate);
        await Clients.Group("activity_feed").SendAsync("StatusChange", statusUpdate);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Clean up subscriptions
        foreach (var subscription in _projectSubscriptions)
        {
            subscription.Value.Remove(Context.ConnectionId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }
}