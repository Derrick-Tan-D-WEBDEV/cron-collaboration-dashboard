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
/// Service interface for suggestion management with enhanced injection and tracking
/// </summary>
public interface ISuggestionService
{
    Task<Suggestion> CreateSuggestionAsync(CreateSuggestionRequest request);
    Task<Suggestion?> GetSuggestionAsync(string suggestionId);
    Task<Suggestion?> UpdateSuggestionAsync(string suggestionId, UpdateSuggestionRequest request);
    Task<SuggestionListResponse> GetAllSuggestionsAsync();
    Task<SuggestionListResponse> GetProjectSuggestionsAsync(string projectId);
    Task<SuggestionImplementationStatus?> GetImplementationStatusAsync(string suggestionId);
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
    Task<List<Dictionary<string, object>>> GetAllCronJobsAsync();
    PerformanceMetrics CalculateMetrics(List<Dictionary<string, object>> runs);
    
    // Phase 1 Enhanced Methods
    Task<Dictionary<string, object>?> GetFPSProjectStatusAsync();
    Task<Dictionary<string, object>?> GetHealthMonitorStatusAsync();
    Task<Dictionary<string, object>> GetLiveProjectStatusAsync();
    Task<Dictionary<string, object>?> GetProjectAnalyticsAsync(string jobId, int daysPeriod = 7);
}

/// <summary>
/// Service interface for activity tracking
/// </summary>
public interface IActivityService
{
    Task<List<ActivityEvent>> GetRecentActivitiesAsync(int limit = 50);
    Task LogActivityAsync(ActivityEvent activity);
    Task NotifyActivityAsync(string projectId, ActivityEvent activity);
    Task LogSuggestionAsync(Suggestion suggestion);
    Task LogStatusChangeAsync(string projectId, ProjectStatus oldStatus, ProjectStatus newStatus);
    Task LogJobExecutionAsync(string projectId, string jobName, bool success, double durationSeconds);
}

/// <summary>
/// Service interface for AI memory management
/// </summary>
public interface IMemoryService
{
    Task<AgentMemory?> GetAgentMemoryAsync(string projectId);
    Task<MemoryAnalysis?> AnalyzeMemoryAsync(string projectId);
    Task<List<MemoryInsight>> GetMemoryInsightsAsync(string projectId);
    Task UpdateMemoryContextAsync(string projectId, Dictionary<string, object> context);
    Task<AgentMemory?> ExtractMemoryAsync(string projectId);
    Task<AgentMemory?> GetCachedMemoryAsync(string projectId);
    Task<List<AgentMemory>> GetAllActiveMemoriesAsync();
    Task<MemoryAnalysis> AnalyzeMemoryPatternsAsync(string projectId, int daysBack = 7);
}

