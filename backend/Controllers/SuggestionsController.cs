using Microsoft.AspNetCore.Mvc;
using CronCollaboration.Api.Models;
using CronCollaboration.Api.Services;

namespace CronCollaboration.Api.Controllers;

/// <summary>
/// Suggestions controller for managing human suggestions
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SuggestionsController : ControllerBase
{
    private readonly ISuggestionService _suggestionService;
    private readonly ILogger<SuggestionsController> _logger;

    public SuggestionsController(ISuggestionService suggestionService, ILogger<SuggestionsController> logger)
    {
        _suggestionService = suggestionService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new suggestion
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Suggestion>> CreateSuggestion([FromBody] CreateSuggestionRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var suggestion = await _suggestionService.CreateSuggestionAsync(request);
            return CreatedAtAction(nameof(GetSuggestion), new { suggestionId = suggestion.Id }, suggestion);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating suggestion");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get suggestion by ID
    /// </summary>
    [HttpGet("{suggestionId}")]
    public async Task<ActionResult<Suggestion>> GetSuggestion(string suggestionId)
    {
        try
        {
            var suggestion = await _suggestionService.GetSuggestionAsync(suggestionId);
            if (suggestion == null)
            {
                return NotFound();
            }
            return Ok(suggestion);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting suggestion {SuggestionId}", suggestionId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Update suggestion status
    /// </summary>
    [HttpPut("{suggestionId}")]
    public async Task<ActionResult<Suggestion>> UpdateSuggestion(string suggestionId, [FromBody] UpdateSuggestionRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var suggestion = await _suggestionService.UpdateSuggestionAsync(suggestionId, request);
            if (suggestion == null)
            {
                return NotFound();
            }
            return Ok(suggestion);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating suggestion {SuggestionId}", suggestionId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get all suggestions
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<SuggestionListResponse>> GetAllSuggestions()
    {
        try
        {
            var suggestions = await _suggestionService.GetAllSuggestionsAsync();
            return Ok(suggestions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all suggestions");
            return StatusCode(500, "Internal server error");
        }
    }
}