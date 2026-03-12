using CronCollaboration.Api.Models;

namespace CronCollaboration.Api.Services;

/// <summary>
/// Service interface for project management
/// </summary>
public interface IProjectService
{
    Task<ProjectListResponse> GetAllProjectsAsync();
    Task<ProjectOverview?> GetProjectAsync(string projectId);
    Task<AgentMemory?> GetAgentMemoryAsync(string projectId);
    Task<SuggestionListResponse> GetProjectSuggestionsAsync(string projectId);
    Task<AnalyticsData?> GetProjectAnalyticsAsync(string projectId);
}

/// <summary>
/// Service interface for suggestion management
/// </summary>
public interface ISuggestionService
{
    Task<Suggestion> CreateSuggestionAsync(CreateSuggestionRequest request);
    Task<Suggestion?> GetSuggestionAsync(string suggestionId);
    Task<Suggestion?> UpdateSuggestionAsync(string suggestionId, UpdateSuggestionRequest request);
    Task<SuggestionListResponse> GetAllSuggestionsAsync();
}

/// <summary>
/// Service interface for OpenClaw integration
/// </summary>
public interface IOpenClawService
{
    Task<Dictionary<string, object>?> GetCronJobStatusAsync(string jobId);
    Task<List<Dictionary<string, object>>> GetCronJobRunsAsync(string jobId, int limit = 10);
    Task<Dictionary<string, object>?> GetAgentMemoryAsync(string sessionId);
    Task<bool> InjectSuggestionAsync(string jobId, Suggestion suggestion);
}

/// <summary>
/// Service interface for activity tracking
/// </summary>
public interface IActivityService
{
    Task<List<ActivityEvent>> GetRecentActivitiesAsync(int limit = 50);
    Task LogActivityAsync(ActivityEvent activity);
    Task NotifyActivityAsync(string projectId, ActivityEvent activity);
}