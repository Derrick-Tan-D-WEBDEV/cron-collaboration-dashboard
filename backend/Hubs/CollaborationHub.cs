using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace CronCollaboration.Api.Hubs;

/// <summary>
/// SignalR hub for real-time collaboration updates
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