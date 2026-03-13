using CronCollaboration.Api.Models;
using System.Text.Json;

namespace CronCollaboration.Api.Services;

/// <summary>
/// Service for extracting and managing AI agent memory from OpenClaw sessions
/// </summary>
public class MemoryService : IMemoryService
{
    private readonly IOpenClawService _openClawService;
    private readonly ILogger<MemoryService> _logger;
    private readonly Dictionary<string, AgentMemory> _memoryCache = new();

    public MemoryService(IOpenClawService openClawService, ILogger<MemoryService> logger)
    {
        _openClawService = openClawService;
        _logger = logger;
    }

    /// <summary>
    /// Get AI agent memory for project (interface implementation)
    /// </summary>
    public async Task<AgentMemory?> GetAgentMemoryAsync(string projectId)
    {
        return await ExtractMemoryAsync(projectId);
    }

    /// <summary>
    /// Analyze AI memory for insights (interface implementation)
    /// </summary>
    public async Task<MemoryAnalysis?> AnalyzeMemoryAsync(string projectId)
    {
        try
        {
            var memory = await GetAgentMemoryAsync(projectId);
            if (memory == null)
            {
                return null;
            }

            var analysis = new MemoryAnalysis
            {
                ProjectId = projectId,
                ThinkingPatterns = AnalyzeDecisionPatterns(memory.DecisionProcess),
                KeyDecisions = ExtractKeyDecisions(memory),
                PrimaryFocus = ExtractPrimaryFocus(memory),
                ContextualAwareness = CalculateContextualAwareness(memory)
            };

            return analysis;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing memory for project {ProjectId}", projectId);
            return null;
        }
    }

    /// <summary>
    /// Get memory insights (interface implementation)
    /// </summary>
    public async Task<List<MemoryInsight>> GetMemoryInsightsAsync(string projectId)
    {
        try
        {
            var memory = await GetAgentMemoryAsync(projectId);
            if (memory == null)
            {
                return new List<MemoryInsight>();
            }

            var insights = new List<MemoryInsight>();

            // Generate insights from memory data
            if (memory.RecentLearnings.Any())
            {
                insights.Add(new MemoryInsight
                {
                    Type = "learning",
                    Category = "Knowledge Acquisition",
                    Description = $"Agent has acquired {memory.RecentLearnings.Count} new learnings",
                    Confidence = 0.9,
                    Details = new Dictionary<string, object> { { "learnings", memory.RecentLearnings } }
                });
            }

            if (memory.ActiveConstraints.Any())
            {
                insights.Add(new MemoryInsight
                {
                    Type = "constraint",
                    Category = "Operating Constraints",
                    Description = $"Agent is operating under {memory.ActiveConstraints.Count} constraints",
                    Confidence = 1.0,
                    Details = new Dictionary<string, object> { { "constraints", memory.ActiveConstraints } }
                });
            }

            return insights;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting memory insights for project {ProjectId}", projectId);
            return new List<MemoryInsight>();
        }
    }

    /// <summary>
    /// Update memory context (interface implementation)
    /// </summary>
    public async Task UpdateMemoryContextAsync(string projectId, Dictionary<string, object> context)
    {
        try
        {
            if (_memoryCache.ContainsKey(projectId))
            {
                var memory = _memoryCache[projectId];
                foreach (var kvp in context)
                {
                    memory.CurrentContext[kvp.Key] = kvp.Value;
                }
                memory.LastExtracted = DateTime.UtcNow;
                _memoryCache[projectId] = memory;
                
                _logger.LogInformation("Updated memory context for project {ProjectId}", projectId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating memory context for project {ProjectId}", projectId);
        }
    }

    /// <summary>
    /// Extract AI memory from an active session
    /// </summary>
    public async Task<AgentMemory?> ExtractMemoryAsync(string projectId)
    {
        try
        {
            var sessionId = await GetActiveSessionIdForProject(projectId);
            if (string.IsNullOrEmpty(sessionId))
            {
                _logger.LogWarning($"No active session found for project {projectId}");
                return null;
            }

            var rawMemory = await _openClawService.GetAgentMemoryAsync(sessionId);
            if (rawMemory == null)
            {
                _logger.LogWarning($"No memory data found for session {sessionId}");
                return null;
            }

            var agentMemory = ParseRawMemory(rawMemory, sessionId, projectId);
            
            // Cache the memory
            _memoryCache[projectId] = agentMemory;
            
            _logger.LogInformation($"Successfully extracted memory for project {projectId}, session {sessionId}");
            return agentMemory;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error extracting memory for project {projectId}");
            return null;
        }
    }

    /// <summary>
    /// Get cached memory for a project (if available)
    /// </summary>
    public async Task<AgentMemory?> GetCachedMemoryAsync(string projectId)
    {
        if (_memoryCache.TryGetValue(projectId, out var memory))
        {
            // Check if memory is still recent (within last 30 minutes)
            if (DateTime.UtcNow - memory.LastExtracted < TimeSpan.FromMinutes(30))
            {
                return memory;
            }
            else
            {
                _memoryCache.Remove(projectId);
            }
        }

        // Try to extract fresh memory
        return await ExtractMemoryAsync(projectId);
    }

    /// <summary>
    /// Get memory for all active projects
    /// </summary>
    public async Task<List<AgentMemory>> GetAllActiveMemoriesAsync()
    {
        try
        {
            var allJobs = await _openClawService.GetAllCronJobsAsync();
            var memories = new List<AgentMemory>();

            foreach (var job in allJobs)
            {
                if (job.TryGetValue("id", out var jobId) && jobId is string id)
                {
                    var memory = await ExtractMemoryAsync(id);
                    if (memory != null)
                    {
                        memories.Add(memory);
                    }
                }
            }

            return memories;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all active memories");
            return new List<AgentMemory>();
        }
    }

    /// <summary>
    /// Get memory patterns and analysis for a project
    /// </summary>
    public async Task<MemoryAnalysis> AnalyzeMemoryPatternsAsync(string projectId, int daysBack = 7)
    {
        try
        {
            var analysis = new MemoryAnalysis
            {
                ProjectId = projectId,
                AnalysisPeriod = TimeSpan.FromDays(daysBack),
                GeneratedAt = DateTime.UtcNow
            };

            // Get current memory
            var currentMemory = await GetCachedMemoryAsync(projectId);
            if (currentMemory != null)
            {
                analysis.CurrentContextSize = currentMemory.CurrentContext.Count;
                analysis.ActiveConstraintsCount = currentMemory.ActiveConstraints.Count;
                analysis.RecentLearningsCount = currentMemory.RecentLearnings.Count;
                
                // Analyze decision patterns
                analysis.DecisionPatterns = AnalyzeDecisionPatterns(currentMemory.DecisionProcess);
                
                // Identify learning trends
                analysis.LearningTrends = AnalyzeLearningTrends(currentMemory.RecentLearnings);
            }

            return analysis;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error analyzing memory patterns for project {projectId}");
            return new MemoryAnalysis { ProjectId = projectId, GeneratedAt = DateTime.UtcNow };
        }
    }

    /// <summary>
    /// Find the active session ID for a project
    /// </summary>
    private async Task<string?> GetActiveSessionIdForProject(string projectId)
    {
        try
        {
            var jobStatus = await _openClawService.GetCronJobStatusAsync(projectId);
            if (jobStatus == null) return null;

            // Look for active session in job status
            if (jobStatus.TryGetValue("activeSession", out var sessionObj) && sessionObj is string sessionId)
            {
                return sessionId;
            }

            // If not found, try to find from recent runs
            var runs = await _openClawService.GetCronJobRunsAsync(projectId, 1);
            if (runs.Count > 0 && runs[0].TryGetValue("sessionId", out var runSessionObj))
            {
                return runSessionObj as string;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error finding active session for project {projectId}");
            return null;
        }
    }

    /// <summary>
    /// Parse raw memory data from OpenClaw into structured format
    /// </summary>
    private AgentMemory ParseRawMemory(Dictionary<string, object> rawMemory, string sessionId, string projectId)
    {
        var memory = new AgentMemory
        {
            SessionId = sessionId,
            ProjectId = projectId,
            LastExtracted = DateTime.UtcNow
        };

        try
        {
            // Extract current context
            if (rawMemory.TryGetValue("context", out var contextObj))
            {
                memory.CurrentContext = ParseDictionary(contextObj);
            }

            // Extract decision process
            if (rawMemory.TryGetValue("thinking", out var thinkingObj) || 
                rawMemory.TryGetValue("decisions", out thinkingObj))
            {
                memory.DecisionProcess = ParseDictionary(thinkingObj);
            }

            // Extract recent learnings
            if (rawMemory.TryGetValue("learnings", out var learningsObj))
            {
                memory.RecentLearnings = ParseStringList(learningsObj);
            }

            // Extract constraints
            if (rawMemory.TryGetValue("constraints", out var constraintsObj))
            {
                memory.ActiveConstraints = ParseStringList(constraintsObj);
            }

            // Try to extract from session data if available
            if (rawMemory.TryGetValue("session", out var sessionData))
            {
                var sessionDict = ParseDictionary(sessionData);
                ExtractFromSessionData(memory, sessionDict);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, $"Error parsing memory data for session {sessionId}");
        }

        return memory;
    }

    /// <summary>
    /// Extract additional memory data from session information
    /// </summary>
    private void ExtractFromSessionData(AgentMemory memory, Dictionary<string, object> sessionData)
    {
        try
        {
            // Extract recent messages for context
            if (sessionData.TryGetValue("recentMessages", out var messagesObj))
            {
                var messages = ParseStringList(messagesObj);
                if (messages.Count > 0)
                {
                    memory.CurrentContext["recentMessages"] = messages.Take(5).ToList();
                }
            }

            // Extract current goals or tasks
            if (sessionData.TryGetValue("goals", out var goalsObj) || 
                sessionData.TryGetValue("tasks", out goalsObj))
            {
                memory.CurrentContext["currentGoals"] = ParseStringList(goalsObj);
            }

            // Extract any errors or issues
            if (sessionData.TryGetValue("errors", out var errorsObj))
            {
                memory.DecisionProcess["recentErrors"] = ParseStringList(errorsObj);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error extracting from session data");
        }
    }

    /// <summary>
    /// Analyze decision patterns from decision process data
    /// </summary>
    private List<string> AnalyzeDecisionPatterns(Dictionary<string, object> decisionProcess)
    {
        var patterns = new List<string>();

        try
        {
            // Look for common decision patterns
            foreach (var kvp in decisionProcess)
            {
                var key = kvp.Key.ToLowerInvariant();
                if (key.Contains("strategy") || key.Contains("approach"))
                {
                    patterns.Add($"Strategic thinking: {key}");
                }
                else if (key.Contains("error") || key.Contains("problem"))
                {
                    patterns.Add($"Problem solving: {key}");
                }
                else if (key.Contains("optimize") || key.Contains("improve"))
                {
                    patterns.Add($"Optimization focus: {key}");
                }
            }

            if (patterns.Count == 0)
            {
                patterns.Add("Standard decision making process");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error analyzing decision patterns");
            patterns.Add("Unable to analyze decision patterns");
        }

        return patterns;
    }

    /// <summary>
    /// Analyze learning trends from recent learnings
    /// </summary>
    private List<string> AnalyzeLearningTrends(List<string> recentLearnings)
    {
        var trends = new List<string>();

        try
        {
            if (recentLearnings.Count == 0)
            {
                trends.Add("No recent learnings detected");
                return trends;
            }

            // Categorize learnings
            var categories = new Dictionary<string, int>();
            
            foreach (var learning in recentLearnings)
            {
                var lower = learning.ToLowerInvariant();
                if (lower.Contains("error") || lower.Contains("fail"))
                {
                    categories["Error Recovery"] = categories.GetValueOrDefault("Error Recovery", 0) + 1;
                }
                else if (lower.Contains("performance") || lower.Contains("speed"))
                {
                    categories["Performance"] = categories.GetValueOrDefault("Performance", 0) + 1;
                }
                else if (lower.Contains("user") || lower.Contains("human"))
                {
                    categories["Human Interaction"] = categories.GetValueOrDefault("Human Interaction", 0) + 1;
                }
                else
                {
                    categories["General"] = categories.GetValueOrDefault("General", 0) + 1;
                }
            }

            trends.Add($"Total learnings: {recentLearnings.Count}");
            foreach (var cat in categories.OrderByDescending(x => x.Value))
            {
                trends.Add($"{cat.Key}: {cat.Value} learnings");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error analyzing learning trends");
            trends.Add("Unable to analyze learning trends");
        }

        return trends;
    }

    /// <summary>
    /// Helper method to parse dictionary from object
    /// </summary>
    private Dictionary<string, object> ParseDictionary(object obj)
    {
        try
        {
            if (obj is Dictionary<string, object> dict) return dict;
            if (obj is string jsonStr)
            {
                return JsonSerializer.Deserialize<Dictionary<string, object>>(jsonStr) ?? new();
            }
            return new Dictionary<string, object> { ["raw"] = obj };
        }
        catch
        {
            return new Dictionary<string, object> { ["raw"] = obj };
        }
    }

    /// <summary>
    /// Helper method to parse string list from object
    /// </summary>
    private List<string> ParseStringList(object obj)
    {
        try
        {
            if (obj is List<string> list) return list;
            if (obj is string[] array) return array.ToList();
            if (obj is string str) return new List<string> { str };
            return new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    /// <summary>
    /// Extract key decisions from memory
    /// </summary>
    private List<string> ExtractKeyDecisions(AgentMemory memory)
    {
        var decisions = new List<string>();
        try
        {
            // Look for decisions in the decision process
            foreach (var kvp in memory.DecisionProcess)
            {
                if (kvp.Key.ToLowerInvariant().Contains("decision") ||
                    kvp.Key.ToLowerInvariant().Contains("choice") ||
                    kvp.Key.ToLowerInvariant().Contains("selected"))
                {
                    decisions.Add($"{kvp.Key}: {kvp.Value}");
                }
            }

            if (decisions.Count == 0)
            {
                decisions.Add("No explicit decisions found in current session");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error extracting key decisions");
            decisions.Add("Unable to extract key decisions");
        }

        return decisions;
    }

    /// <summary>
    /// Extract primary focus areas from memory
    /// </summary>
    private string ExtractPrimaryFocus(AgentMemory memory)
    {
        try
        {
            // Look for focus indicators in context
            foreach (var kvp in memory.CurrentContext)
            {
                var key = kvp.Key.ToLowerInvariant();
                if (key.Contains("goal") || key.Contains("objective") || key.Contains("task"))
                {
                    return $"Primary focus: {kvp.Value}";
                }
            }

            // Check recent learnings for focus areas
            var focusKeywords = new[] { "focus", "priority", "main", "primary", "key" };
            foreach (var learning in memory.RecentLearnings)
            {
                foreach (var keyword in focusKeywords)
                {
                    if (learning.ToLowerInvariant().Contains(keyword))
                    {
                        return $"Learning-based focus: {learning.Substring(0, Math.Min(100, learning.Length))}";
                    }
                }
            }

            return "General task execution and optimization";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error extracting primary focus");
            return "Unable to determine primary focus";
        }
    }

    /// <summary>
    /// Calculate contextual awareness score
    /// </summary>
    private double CalculateContextualAwareness(AgentMemory memory)
    {
        try
        {
            double score = 0;

            // Context richness (max 40 points)
            score += Math.Min(40, memory.CurrentContext.Count * 2);

            // Recent learnings (max 30 points)
            score += Math.Min(30, memory.RecentLearnings.Count * 5);

            // Decision process complexity (max 20 points)
            score += Math.Min(20, memory.DecisionProcess.Count * 3);

            // Active constraints awareness (max 10 points)
            score += Math.Min(10, memory.ActiveConstraints.Count * 2);

            return Math.Min(100, score) / 100.0; // Normalize to 0-1
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error calculating contextual awareness");
            return 0.5; // Default moderate awareness
        }
    }
}
