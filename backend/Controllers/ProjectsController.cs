using Microsoft.AspNetCore.Mvc;
using CronCollaboration.Api.Models;
using CronCollaboration.Api.Services;

namespace CronCollaboration.Api.Controllers;

/// <summary>
/// Projects controller for managing cron job projects
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly ILogger<ProjectsController> _logger;

    public ProjectsController(IProjectService projectService, ILogger<ProjectsController> logger)
    {
        _projectService = projectService;
        _logger = logger;
    }

    /// <summary>
    /// Get all projects
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ProjectListResponse>> GetProjects()
    {
        try
        {
            var projects = await _projectService.GetAllProjectsAsync();
            return Ok(projects);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting projects");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get specific project by ID
    /// </summary>
    [HttpGet("{projectId}")]
    public async Task<ActionResult<ProjectOverview>> GetProject(string projectId)
    {
        try
        {
            var project = await _projectService.GetProjectAsync(projectId);
            if (project == null)
            {
                return NotFound();
            }
            return Ok(project);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get AI agent memory for project
    /// </summary>
    [HttpGet("{projectId}/memory")]
    public async Task<ActionResult<AgentMemory>> GetProjectMemory(string projectId)
    {
        try
        {
            var memory = await _projectService.GetAgentMemoryAsync(projectId);
            if (memory == null)
            {
                return NotFound();
            }
            return Ok(memory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting memory for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get suggestions for project
    /// </summary>
    [HttpGet("{projectId}/suggestions")]
    public async Task<ActionResult<SuggestionListResponse>> GetProjectSuggestions(string projectId)
    {
        try
        {
            var suggestions = await _projectService.GetProjectSuggestionsAsync(projectId);
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting suggestions for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get analytics for project
    /// </summary>
    [HttpGet("{projectId}/analytics")]
    public async Task<ActionResult<AnalyticsData>> GetProjectAnalytics(string projectId)
    {
        try
        {
            var analytics = await _projectService.GetProjectAnalyticsAsync(projectId);
            if (analytics == null)
            {
                return NotFound();
            }
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics for project {ProjectId}", projectId);
            return StatusCode(500, "Internal server error");
        }
    }
}