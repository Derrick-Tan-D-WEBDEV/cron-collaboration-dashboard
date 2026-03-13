using Microsoft.AspNetCore.Mvc;
using CronCollaboration.Api.Models;
using CronCollaboration.Api.Services;

namespace CronCollaboration.Api.Controllers;

/// <summary>
/// Activities controller for managing and retrieving activity events
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;
    private readonly ILogger<ActivitiesController> _logger;

    public ActivitiesController(IActivityService activityService, ILogger<ActivitiesController> logger)
    {
        _activityService = activityService;
        _logger = logger;
    }

    /// <summary>
    /// Get recent activities
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ActivityEvent>>> GetRecentActivities([FromQuery] int limit = 50)
    {
        try
        {
            var activities = await _activityService.GetRecentActivitiesAsync(limit);
            return Ok(activities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recent activities");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Log a new activity event
    /// </summary>
    [HttpPost]
    public async Task<ActionResult> LogActivity([FromBody] ActivityEvent activity)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _activityService.LogActivityAsync(activity);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging activity");
            return StatusCode(500, "Internal server error");
        }
    }
}