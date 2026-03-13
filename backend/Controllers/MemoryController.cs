using Microsoft.AspNetCore.Mvc;
using CronCollaboration.Api.Models;
using CronCollaboration.Api.Services;

namespace CronCollaboration.Api.Controllers;

/// <summary>
/// API controller for AI memory extraction and visualization
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MemoryController : ControllerBase
{
    private readonly IMemoryService _memoryService;
    private readonly ILogger<MemoryController> _logger;

    public MemoryController(IMemoryService memoryService, ILogger<MemoryController> logger)
    {
        _memoryService = memoryService;
        _logger = logger;
    }

    /// <summary>
    /// Get AI memory for a specific project
    /// </summary>
    /// <param name="projectId">The project/job ID</param>
    /// <returns>AI memory data</returns>
    [HttpGet("{projectId}")]
    public async Task<ActionResult<AgentMemory>> GetProjectMemory(string projectId)
    {
        try
        {
            _logger.LogInformation("Fetching memory for project {ProjectId}", projectId);

            var memory = await _memoryService.GetCachedMemoryAsync(projectId);
            if (memory == null)
            {
                return NotFound($"No memory found for project {projectId}");
            }

            return Ok(memory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching memory for project {ProjectId}", projectId);
            return StatusCode(500, "An error occurred while fetching project memory");
        }
    }

    /// <summary>
    /// Get AI memory for all active projects
    /// </summary>
    /// <returns>List of AI memories</returns>
    [HttpGet]
    public async Task<ActionResult<List<AgentMemory>>> GetAllProjectMemories()
    {
        try
        {
            _logger.LogInformation("Fetching memory for all active projects");

            var memories = await _memoryService.GetAllActiveMemoriesAsync();
            return Ok(memories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all project memories");
            return StatusCode(500, "An error occurred while fetching project memories");
        }
    }

    /// <summary>
    /// Force refresh memory extraction for a project
    /// </summary>
    /// <param name="projectId">The project/job ID</param>
    /// <returns>Freshly extracted memory</returns>
    [HttpPost("{projectId}/refresh")]
    public async Task<ActionResult<AgentMemory>> RefreshProjectMemory(string projectId)
    {
        try
        {
            _logger.LogInformation("Refreshing memory for project {ProjectId}", projectId);

            var memory = await _memoryService.ExtractMemoryAsync(projectId);
            if (memory == null)
            {
                return NotFound($"Could not extract memory for project {projectId}");
            }

            return Ok(memory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing memory for project {ProjectId}", projectId);
            return StatusCode(500, "An error occurred while refreshing project memory");
        }
    }

    /// <summary>
    /// Get memory analysis and patterns for a project
    /// </summary>
    /// <param name="projectId">The project/job ID</param>
    /// <param name="daysBack">Number of days to analyze (default: 7)</param>
    /// <returns>Memory analysis data</returns>
    [HttpGet("{projectId}/analysis")]
    public async Task<ActionResult<MemoryAnalysis>> GetMemoryAnalysis(string projectId, int daysBack = 7)
    {
        try
        {
            _logger.LogInformation("Analyzing memory patterns for project {ProjectId} over {DaysBack} days", 
                projectId, daysBack);

            var analysis = await _memoryService.AnalyzeMemoryPatternsAsync(projectId, daysBack);
            return Ok(analysis);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing memory for project {ProjectId}", projectId);
            return StatusCode(500, "An error occurred while analyzing project memory");
        }
    }
}

/// <summary>
/// API controller for suggestion implementation tracking
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SuggestionTrackingController : ControllerBase
{
    private readonly ISuggestionService _suggestionService;
    private readonly ILogger<SuggestionTrackingController> _logger;

    public SuggestionTrackingController(ISuggestionService suggestionService, ILogger<SuggestionTrackingController> logger)
    {
        _suggestionService = suggestionService;
        _logger = logger;
    }

    /// <summary>
    /// Get implementation status for a suggestion
    /// </summary>
    /// <param name="suggestionId">The suggestion ID</param>
    /// <returns>Implementation status</returns>
    [HttpGet("{suggestionId}/status")]
    public async Task<ActionResult<SuggestionImplementationStatus>> GetImplementationStatus(string suggestionId)
    {
        try
        {
            _logger.LogInformation("Fetching implementation status for suggestion {SuggestionId}", suggestionId);

            var status = await _suggestionService.GetImplementationStatusAsync(suggestionId);
            if (status == null)
            {
                return NotFound($"No implementation status found for suggestion {suggestionId}");
            }

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching implementation status for suggestion {SuggestionId}", suggestionId);
            return StatusCode(500, "An error occurred while fetching implementation status");
        }
    }

    /// <summary>
    /// Get suggestions for a specific project with implementation tracking
    /// </summary>
    /// <param name="projectId">The project/job ID</param>
    /// <returns>Project suggestions with tracking</returns>
    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<SuggestionListResponse>> GetProjectSuggestionsWithTracking(string projectId)
    {
        try
        {
            _logger.LogInformation("Fetching suggestions with tracking for project {ProjectId}", projectId);

            var suggestions = await _suggestionService.GetProjectSuggestionsAsync(projectId);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching suggestions for project {ProjectId}", projectId);
            return StatusCode(500, "An error occurred while fetching project suggestions");
        }
    }
}

/// <summary>
/// API controller for analytics and collaboration metrics
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CollaborationAnalyticsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly ISuggestionService _suggestionService;
    private readonly IMemoryService _memoryService;
    private readonly ILogger<CollaborationAnalyticsController> _logger;

    public CollaborationAnalyticsController(
        IProjectService projectService,
        ISuggestionService suggestionService,
        IMemoryService memoryService,
        ILogger<CollaborationAnalyticsController> logger)
    {
        _projectService = projectService;
        _suggestionService = suggestionService;
        _memoryService = memoryService;
        _logger = logger;
    }

    /// <summary>
    /// Get collaboration effectiveness metrics
    /// </summary>
    /// <returns>Collaboration analytics</returns>
    [HttpGet("effectiveness")]
    public async Task<ActionResult<CollaborationMetrics>> GetCollaborationEffectiveness()
    {
        try
        {
            _logger.LogInformation("Calculating collaboration effectiveness metrics");

            var metrics = await CalculateCollaborationMetricsAsync();
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating collaboration metrics");
            return StatusCode(500, "An error occurred while calculating collaboration metrics");
        }
    }

    /// <summary>
    /// Get human-AI interaction trends
    /// </summary>
    /// <param name="daysBack">Number of days to analyze</param>
    /// <returns>Interaction trends</returns>
    [HttpGet("trends")]
    public async Task<ActionResult<InteractionTrends>> GetInteractionTrends(int daysBack = 30)
    {
        try
        {
            _logger.LogInformation("Calculating interaction trends over {DaysBack} days", daysBack);

            var trends = await CalculateInteractionTrendsAsync(daysBack);
            return Ok(trends);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating interaction trends");
            return StatusCode(500, "An error occurred while calculating interaction trends");
        }
    }

    /// <summary>
    /// Calculate collaboration effectiveness metrics
    /// </summary>
    private async Task<CollaborationMetrics> CalculateCollaborationMetricsAsync()
    {
        var suggestions = await _suggestionService.GetAllSuggestionsAsync();
        var projects = await _projectService.GetAllProjectsAsync();

        var totalSuggestions = suggestions.TotalCount;
        var implementedSuggestions = suggestions.ImplementedCount;
        var pendingSuggestions = suggestions.PendingCount;

        var implementationRate = totalSuggestions > 0 
            ? (double)implementedSuggestions / totalSuggestions * 100 
            : 0;

        var avgResponseTime = await CalculateAverageResponseTimeAsync();
        var suggestionImpact = await CalculateSuggestionImpactAsync();

        return new CollaborationMetrics
        {
            TotalSuggestions = totalSuggestions,
            ImplementedSuggestions = implementedSuggestions,
            PendingSuggestions = pendingSuggestions,
            ImplementationRate = implementationRate,
            AverageResponseTimeMinutes = avgResponseTime,
            SuggestionImpactScore = suggestionImpact,
            ActiveProjects = projects.Projects.Count(p => p.Status == ProjectStatus.Running),
            LastCalculated = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Calculate interaction trends
    /// </summary>
    private async Task<InteractionTrends> CalculateInteractionTrendsAsync(int daysBack)
    {
        return new InteractionTrends
        {
            PeriodDays = daysBack,
            SuggestionTrends = await CalculateSuggestionTrendsAsync(daysBack),
            MemoryExtractionTrends = await CalculateMemoryTrendsAsync(daysBack),
            CollaborationQuality = await CalculateCollaborationQualityAsync(daysBack),
            GeneratedAt = DateTime.UtcNow
        };
    }

    private async Task<double> CalculateAverageResponseTimeAsync()
    {
        // Placeholder calculation
        return 15.5; // 15.5 minutes average
    }

    private async Task<double> CalculateSuggestionImpactAsync()
    {
        // Placeholder calculation based on implementation success
        return 8.2; // Out of 10
    }

    private async Task<Dictionary<string, int>> CalculateSuggestionTrendsAsync(int daysBack)
    {
        // Placeholder data - in production, calculate from actual data
        return new Dictionary<string, int>
        {
            { "Direction", 12 },
            { "Bugfix", 8 },
            { "Feature", 15 },
            { "Optimization", 6 },
            { "Quality", 9 }
        };
    }

    private async Task<Dictionary<string, double>> CalculateMemoryTrendsAsync(int daysBack)
    {
        // Placeholder data
        return new Dictionary<string, double>
        {
            { "AvgContextSize", 125.5 },
            { "LearningsPerDay", 3.2 },
            { "ConstraintsActive", 8.1 }
        };
    }

    private async Task<double> CalculateCollaborationQualityAsync(int daysBack)
    {
        // Placeholder quality score
        return 8.7; // Out of 10
    }
}

/// <summary>
/// Collaboration effectiveness metrics
/// </summary>
public class CollaborationMetrics
{
    public int TotalSuggestions { get; set; }
    public int ImplementedSuggestions { get; set; }
    public int PendingSuggestions { get; set; }
    public double ImplementationRate { get; set; }
    public double AverageResponseTimeMinutes { get; set; }
    public double SuggestionImpactScore { get; set; }
    public int ActiveProjects { get; set; }
    public DateTime LastCalculated { get; set; }
}

/// <summary>
/// Human-AI interaction trends
/// </summary>
public class InteractionTrends
{
    public int PeriodDays { get; set; }
    public Dictionary<string, int> SuggestionTrends { get; set; } = new();
    public Dictionary<string, double> MemoryExtractionTrends { get; set; } = new();
    public double CollaborationQuality { get; set; }
    public DateTime GeneratedAt { get; set; }
}