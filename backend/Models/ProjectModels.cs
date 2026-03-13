namespace CronCollaboration.Api.Models;

/// <summary>
/// Project status enumeration
/// </summary>
public enum ProjectStatus
{
    Running,
    Waiting,
    Complete,
    Error,
    Scheduled
}

/// <summary>
/// Suggestion status enumeration
/// </summary>
public enum SuggestionStatus
{
    Pending,
    Implementing,
    Complete,
    Declined
}

/// <summary>
/// Suggestion category enumeration
/// </summary>
public enum SuggestionCategory
{
    Direction,
    Bugfix,
    Feature,
    Optimization,
    Quality
}

/// <summary>
/// Priority levels
/// </summary>
public enum Priority
{
    High,
    Medium,
    Low
}

/// <summary>
/// Performance metrics for projects
/// </summary>
public class PerformanceMetrics
{
    public double DurationSeconds { get; set; }
    public double SuccessRate { get; set; }
    public double AverageDelaySeconds { get; set; }
    public int ErrorCount { get; set; }
    public int Last24HRuns { get; set; }
}

/// <summary>
/// Project progress tracking
/// </summary>
public class ProjectProgress
{
    public string CurrentStep { get; set; } = string.Empty;
    public List<string> CompletedSteps { get; set; } = new();
    public List<string> NextSteps { get; set; } = new();
    public DateTime? EstimatedCompletion { get; set; }
    public double ProgressPercentage { get; set; }
}

/// <summary>
/// Complete project overview
/// </summary>
public class ProjectOverview
{
    public string JobId { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CurrentPhase { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public ProjectProgress Progress { get; set; } = new();
    public PerformanceMetrics Performance { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime LastUpdated { get; set; }
}

/// <summary>
/// AI Agent memory and context
/// </summary>
public class AgentMemory
{
    public string SessionId { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public Dictionary<string, object> CurrentContext { get; set; } = new();
    public Dictionary<string, object> DecisionProcess { get; set; } = new();
    public List<string> RecentLearnings { get; set; } = new();
    public List<string> ActiveConstraints { get; set; } = new();
    public DateTime LastExtracted { get; set; }
}

/// <summary>
/// Human suggestion for project improvement
/// </summary>
public class Suggestion
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProjectId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Priority Priority { get; set; }
    public SuggestionCategory Category { get; set; }
    public SuggestionStatus Status { get; set; }
    public string SubmittedBy { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ImplementedAt { get; set; }
    public string? ImplementationNotes { get; set; }
    public string? ImpactDescription { get; set; }
}

/// <summary>
/// Real-time activity event
/// </summary>
public class ActivityEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProjectId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, object> Details { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Source { get; set; } = string.Empty; // "human" or "agent"
}

/// <summary>
/// Analytics data and insights
/// </summary>
public class AnalyticsData
{
    public string ProjectId { get; set; } = string.Empty;
    public string TimePeriod { get; set; } = string.Empty;
    public Dictionary<string, double> Metrics { get; set; } = new();
    public Dictionary<string, object> Trends { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

// === REQUEST/RESPONSE MODELS ===

/// <summary>
/// Request to create a new suggestion
/// </summary>
public class CreateSuggestionRequest
{
    public string ProjectId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Priority Priority { get; set; }
    public SuggestionCategory Category { get; set; }
    public DateTime? ImplementationDeadline { get; set; }
}

/// <summary>
/// Request to update suggestion status
/// </summary>
public class UpdateSuggestionRequest
{
    public SuggestionStatus Status { get; set; }
    public string? ImplementationNotes { get; set; }
    public string? ImpactDescription { get; set; }
}

/// <summary>
/// Response for project list endpoint
/// </summary>
public class ProjectListResponse
{
    public List<ProjectOverview> Projects { get; set; } = new();
    public int TotalCount { get; set; }
    public int ActiveCount { get; set; }
    public int HealthyCount { get; set; }
}

/// <summary>
/// Response for suggestions list endpoint
/// </summary>
public class SuggestionListResponse
{
    public List<Suggestion> Suggestions { get; set; } = new();
    public int PendingCount { get; set; }
    public int ImplementedCount { get; set; }
    public int TotalCount { get; set; }
}

/// <summary>
/// Result of suggestion injection into cron job
/// </summary>
public class SuggestionInjectionResult
{
    public string SuggestionId { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime InjectedAt { get; set; } = DateTime.UtcNow;
    public string? JobId { get; set; }
    public string? SessionId { get; set; }
    public string Method { get; set; } = string.Empty;
    public int EstimatedMinutes { get; set; }
    public Dictionary<string, object> TrackingData { get; set; } = new();
}

/// <summary>
/// Memory analysis patterns and insights
/// </summary>
public class MemoryAnalysis
{
    public string ProjectId { get; set; } = string.Empty;
    public TimeSpan AnalysisPeriod { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public int CurrentContextSize { get; set; }
    public int ActiveConstraintsCount { get; set; }
    public int RecentLearningsCount { get; set; }
    public List<string> ThinkingPatterns { get; set; } = new();
    public List<string> KeyDecisions { get; set; } = new();
    public List<string> DecisionPatterns { get; set; } = new();
    public List<string> LearningTrends { get; set; } = new();
    public string PrimaryFocus { get; set; } = string.Empty;
    public double ContextualAwareness { get; set; }
}

/// <summary>
/// Memory insight from AI agent analysis
/// </summary>
public class MemoryInsight
{
    public string Type { get; set; } = string.Empty; // learning, constraint, pattern, etc.
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public Dictionary<string, object> Details { get; set; } = new();
    public DateTime DetectedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Suggestion implementation tracking status
/// </summary>
public class SuggestionImplementationStatus
{
    public string SuggestionId { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public DateTime? InjectedAt { get; set; }
    public DateTime? ExpectedDelivery { get; set; }
    public string InjectionMethod { get; set; } = string.Empty;
    public Dictionary<string, object> TrackingData { get; set; } = new();
    public bool ImplementationDetected { get; set; } = false;
    public DateTime? ImplementationStartedAt { get; set; }
    public DateTime? ImplementationCompletedAt { get; set; }
    public string? StatusNotes { get; set; }
    public double ProgressPercentage { get; set; } = 0;
}