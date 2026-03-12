"""
Cron Collaboration Dashboard - API Specification
Human-AI collaboration platform for monitoring and managing cron job projects
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


# === ENUMS ===

class ProjectStatus(str, Enum):
    RUNNING = "running"
    WAITING = "waiting"
    COMPLETE = "complete"
    ERROR = "error"
    SCHEDULED = "scheduled"


class SuggestionStatus(str, Enum):
    PENDING = "pending"
    IMPLEMENTING = "implementing"
    COMPLETE = "complete"
    DECLINED = "declined"


class SuggestionCategory(str, Enum):
    DIRECTION = "direction"
    BUGFIX = "bugfix"
    FEATURE = "feature"
    OPTIMIZATION = "optimization"
    QUALITY = "quality"


class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# === DATA MODELS ===

class PerformanceMetrics(BaseModel):
    """Performance metrics for a project or job"""
    duration_seconds: float
    success_rate: float
    average_delay_seconds: float
    error_count: int
    last_24h_runs: int


class ProjectProgress(BaseModel):
    """Current progress of a project"""
    current_step: str
    completed_steps: List[str]
    next_steps: List[str]
    estimated_completion: Optional[datetime]
    progress_percentage: float


class ProjectOverview(BaseModel):
    """High-level project information"""
    job_id: str
    project_name: str
    description: str
    current_phase: str
    status: ProjectStatus
    progress: ProjectProgress
    performance: PerformanceMetrics
    created_at: datetime
    last_updated: datetime


class AgentMemory(BaseModel):
    """AI Agent memory and context information"""
    session_id: str
    project_id: str
    current_context: Dict[str, Any]
    decision_process: Dict[str, Any]
    recent_learnings: List[str]
    active_constraints: List[str]
    last_extracted: datetime


class Suggestion(BaseModel):
    """Human suggestion for project improvement"""
    id: str
    project_id: str
    content: str
    priority: Priority
    category: SuggestionCategory
    status: SuggestionStatus
    submitted_by: str
    submitted_at: datetime
    implemented_at: Optional[datetime]
    implementation_notes: Optional[str]
    impact_description: Optional[str]


class ActivityEvent(BaseModel):
    """Real-time activity event"""
    id: str
    project_id: str
    event_type: str
    message: str
    details: Dict[str, Any]
    timestamp: datetime
    source: str  # "human" or "agent"


class AnalyticsData(BaseModel):
    """Performance analytics and insights"""
    project_id: str
    time_period: str
    metrics: Dict[str, float]
    trends: Dict[str, Any]
    recommendations: List[str]
    generated_at: datetime


# === API REQUEST/RESPONSE MODELS ===

class CreateSuggestionRequest(BaseModel):
    """Request to create a new suggestion"""
    project_id: str
    content: str
    priority: Priority
    category: SuggestionCategory
    implementation_deadline: Optional[datetime]


class UpdateSuggestionRequest(BaseModel):
    """Request to update suggestion status"""
    status: SuggestionStatus
    implementation_notes: Optional[str]
    impact_description: Optional[str]


class ProjectListResponse(BaseModel):
    """Response for project list endpoint"""
    projects: List[ProjectOverview]
    total_count: int
    active_count: int
    healthy_count: int


class SuggestionListResponse(BaseModel):
    """Response for suggestions list endpoint"""
    suggestions: List[Suggestion]
    pending_count: int
    implemented_count: int
    total_count: int


class LiveUpdateMessage(BaseModel):
    """WebSocket message for live updates"""
    message_type: str
    project_id: Optional[str]
    data: Dict[str, Any]
    timestamp: datetime


# === API ENDPOINTS ===

"""
GET /api/projects
- Get list of all cron job projects
- Response: ProjectListResponse

GET /api/projects/{project_id}
- Get detailed project information
- Response: ProjectOverview

GET /api/projects/{project_id}/memory
- Get current AI agent memory for project
- Response: AgentMemory

GET /api/projects/{project_id}/suggestions
- Get suggestions for specific project
- Response: SuggestionListResponse

POST /api/suggestions
- Create new suggestion
- Request: CreateSuggestionRequest
- Response: Suggestion

PUT /api/suggestions/{suggestion_id}
- Update suggestion status
- Request: UpdateSuggestionRequest
- Response: Suggestion

GET /api/analytics/{project_id}
- Get performance analytics for project
- Response: AnalyticsData

GET /api/activities
- Get recent activity feed
- Response: List[ActivityEvent]

WebSocket /ws/live-updates
- Real-time project updates
- Message: LiveUpdateMessage
"""


# === INTEGRATION INTERFACES ===

class OpenClawIntegration:
    """Interface for OpenClaw cron job integration"""
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Get current status of cron job"""
        pass
    
    def get_job_runs(self, job_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent runs for cron job"""
        pass
    
    def get_agent_memory(self, session_id: str) -> Dict[str, Any]:
        """Extract memory from AI agent session"""
        pass
    
    def inject_suggestion(self, job_id: str, suggestion: Suggestion) -> bool:
        """Inject human suggestion into cron job context"""
        pass


class DatabaseInterface:
    """Database operations interface"""
    
    def store_suggestion(self, suggestion: Suggestion) -> str:
        """Store suggestion in database"""
        pass
    
    def update_suggestion(self, suggestion_id: str, updates: Dict[str, Any]) -> bool:
        """Update suggestion status"""
        pass
    
    def get_project_analytics(self, project_id: str) -> AnalyticsData:
        """Get analytics data for project"""
        pass
    
    def log_activity(self, event: ActivityEvent) -> str:
        """Log activity event"""
        pass


# === CONFIGURATION ===

class Settings(BaseModel):
    """Application settings and configuration"""
    openclaw_api_url: str = "http://localhost:18789"
    openclaw_api_token: Optional[str] = None
    database_url: str = "sqlite:///./cron_dashboard.db"
    redis_url: str = "redis://localhost:6379"
    websocket_heartbeat: int = 30
    suggestion_timeout_hours: int = 24
    analytics_retention_days: int = 90
    log_level: str = "INFO"