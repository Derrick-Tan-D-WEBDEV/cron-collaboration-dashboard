import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001/api'  // Development - use configured backend port
  : '/api'; // Production - assume same origin

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types (matching backend models)
export interface ProjectOverview {
  jobId: string;
  projectName: string;
  description: string;
  currentPhase: string;
  status: 'Running' | 'Waiting' | 'Complete' | 'Error' | 'Scheduled';
  progress: ProjectProgress;
  performance: PerformanceMetrics;
  createdAt: string;
  lastUpdated: string;
}

export interface ProjectProgress {
  currentStep: string;
  completedSteps: string[];
  nextSteps: string[];
  estimatedCompletion?: string;
  progressPercentage: number;
}

export interface PerformanceMetrics {
  durationSeconds: number;
  successRate: number;
  averageDelaySeconds: number;
  errorCount: number;
  last24HRuns: number;
}

export interface ProjectListResponse {
  projects: ProjectOverview[];
  totalCount: number;
  activeCount: number;
  healthyCount: number;
}

export interface Suggestion {
  id: string;
  projectId: string;
  content: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Direction' | 'Bugfix' | 'Feature' | 'Optimization' | 'Quality';
  status: 'Pending' | 'Implementing' | 'Complete' | 'Declined';
  submittedBy: string;
  submittedAt: string;
  implementedAt?: string;
  implementationNotes?: string;
  impactDescription?: string;
}

export interface CreateSuggestionRequest {
  projectId: string;
  content: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Direction' | 'Bugfix' | 'Feature' | 'Optimization' | 'Quality';
  implementationDeadline?: string;
}

export interface SuggestionListResponse {
  suggestions: Suggestion[];
  pendingCount: number;
  implementedCount: number;
  totalCount: number;
}

export interface ActivityEvent {
  id: string;
  projectId: string;
  eventType: string;
  message: string;
  details: Record<string, any>;
  timestamp: string;
  source: string;
}

export interface AgentMemory {
  sessionId: string;
  projectId: string;
  currentContext: Record<string, any>;
  decisionProcess: Record<string, any>;
  recentLearnings: string[];
  activeConstraints: string[];
  lastExtracted: string;
}

export interface AnalyticsData {
  projectId: string;
  timePeriod: string;
  metrics: Record<string, number>;
  trends: Record<string, any>;
  recommendations: string[];
  generatedAt: string;
}

// API functions
export const cronApi = {
  // Projects
  async getProjects(): Promise<ProjectListResponse> {
    const response = await api.get<ProjectListResponse>('/projects');
    return response.data;
  },

  async getProject(projectId: string): Promise<ProjectOverview> {
    const response = await api.get<ProjectOverview>(`/projects/${projectId}`);
    return response.data;
  },

  async getProjectMemory(projectId: string): Promise<AgentMemory> {
    const response = await api.get<AgentMemory>(`/projects/${projectId}/memory`);
    return response.data;
  },

  async getProjectSuggestions(projectId: string): Promise<SuggestionListResponse> {
    const response = await api.get<SuggestionListResponse>(`/projects/${projectId}/suggestions`);
    return response.data;
  },

  async getProjectAnalytics(projectId: string): Promise<AnalyticsData> {
    const response = await api.get<AnalyticsData>(`/projects/${projectId}/analytics`);
    return response.data;
  },

  // Suggestions
  async createSuggestion(suggestion: CreateSuggestionRequest): Promise<Suggestion> {
    const response = await api.post<Suggestion>('/suggestions', suggestion);
    return response.data;
  },

  async getSuggestion(suggestionId: string): Promise<Suggestion> {
    const response = await api.get<Suggestion>(`/suggestions/${suggestionId}`);
    return response.data;
  },

  async updateSuggestion(suggestionId: string, update: Partial<Suggestion>): Promise<Suggestion> {
    const response = await api.put<Suggestion>(`/suggestions/${suggestionId}`, update);
    return response.data;
  },

  async getAllSuggestions(): Promise<SuggestionListResponse> {
    const response = await api.get<SuggestionListResponse>('/suggestions');
    return response.data;
  },

  // Activities
  async getRecentActivities(limit: number = 50): Promise<ActivityEvent[]> {
    const response = await api.get<ActivityEvent[]>(`/activities?limit=${limit}`);
    return response.data;
  },

  async logActivity(activity: ActivityEvent): Promise<void> {
    await api.post('/activities', activity);
  }
};

// Error handling helper
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default cronApi;