export interface User {
  id: string
  email: string
  name: string
  password_hash: string
  role: 'admin' | 'operator' | 'viewer'
  workspace_id: string
  avatar?: string
  preferences: UserPreferences
  created_at: Date
  updated_at: Date
  last_login_at?: Date
  is_active: boolean
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  timezone: string
  language: string
  notifications: NotificationPreferences
  dashboard: DashboardPreferences
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  slack: boolean
  job_failures: boolean
  job_success: boolean
  system_alerts: boolean
  weekly_reports: boolean
}

export interface DashboardPreferences {
  default_view: 'grid' | 'list'
  refresh_interval: number
  chart_type: 'line' | 'bar' | 'area'
  show_predictions: boolean
  compact_mode: boolean
}

export interface Workspace {
  id: string
  name: string
  description?: string
  owner_id: string
  settings: WorkspaceSettings
  subscription_tier: 'free' | 'pro' | 'enterprise'
  created_at: Date
  updated_at: Date
  is_active: boolean
}

export interface WorkspaceSettings {
  timezone: string
  retention_days: number
  max_concurrent_jobs: number
  alerting_enabled: boolean
  webhook_url?: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'admin' | 'operator' | 'viewer'
  permissions: string[]
  joined_at: Date
  is_active: boolean
}

export interface CronJob {
  id: string
  name: string
  description?: string
  schedule: string
  command: string
  status: 'active' | 'paused' | 'disabled'
  last_run?: Date
  next_run: Date
  workspace_id: string
  user_id: string
  tags: string[]
  environment: 'production' | 'staging' | 'development'
  priority: 'low' | 'medium' | 'high' | 'critical'
  max_runtime: number
  retries: number
  timeout: number
  metadata: Record<string, any>
  created_at: Date
  updated_at: Date
  is_active: boolean
}

export interface Execution {
  id: string
  cron_job_id: string
  start_time: Date
  end_time?: Date
  duration?: number
  status: 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled'
  exit_code?: number
  output?: string
  error?: string
  resource_usage: ResourceUsage
  metadata: Record<string, any>
  created_at: Date
}

export interface ResourceUsage {
  cpu_percent: number
  memory_mb: number
  disk_read_mb: number
  disk_write_mb: number
  network_in_mb: number
  network_out_mb: number
}

export interface JobStatistics {
  id: string
  cron_job_id: string
  total_runs: number
  successful_runs: number
  failed_runs: number
  average_runtime: number
  last_success_at?: Date
  last_failure_at?: Date
  uptime_percentage: number
  performance_trend: 'improving' | 'stable' | 'degrading'
  updated_at: Date
}

export interface JobPrediction {
  id: string
  cron_job_id: string
  next_failure_probability: number
  recommended_schedule?: string
  optimized_runtime?: number
  resource_usage_forecast: ResourceForecast
  performance_score: number
  suggestions: string[]
  confidence: number
  created_at: Date
  expires_at: Date
}

export interface ResourceForecast {
  cpu: number[]
  memory: number[]
  disk_io: number[]
  network_io: number[]
  timestamps: string[]
}

export interface Alert {
  id: string
  type: 'failure' | 'performance' | 'resource' | 'prediction' | 'system'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  cron_job_id?: string
  workspace_id: string
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: Date
  created_at: Date
  resolved_at?: Date
  metadata: Record<string, any>
}

export interface Report {
  id: string
  type: 'performance' | 'summary' | 'predictions' | 'security' | 'custom'
  title: string
  description?: string
  schedule?: string
  workspace_id: string
  user_id: string
  filters: ReportFilters
  format: 'pdf' | 'csv' | 'json' | 'html'
  recipients: string[]
  last_generated?: Date
  next_generation?: Date
  enabled: boolean
  created_at: Date
  updated_at: Date
}

export interface ReportFilters {
  date_range: {
    start: Date
    end: Date
    type: 'relative' | 'absolute'
  }
  job_ids?: string[]
  tags?: string[]
  environments?: string[]
  statuses?: string[]
  include_metrics: string[]
  include_predictions: boolean
}

export interface Integration {
  id: string
  workspace_id: string
  type: 'slack' | 'teams' | 'discord' | 'email' | 'webhook'
  name: string
  config: Record<string, any>
  enabled: boolean
  events: string[]
  created_at: Date
  updated_at: Date
}

export interface AuditLog {
  id: string
  workspace_id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string
  changes?: Record<string, any>
  metadata: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: Date
}

// Analytics Types
export interface AnalyticsMetrics {
  workspace_id: string
  date: Date
  total_jobs: number
  active_jobs: number
  total_executions: number
  successful_executions: number
  failed_executions: number
  average_runtime: number
  total_cpu_time: number
  total_memory_usage: number
  created_at: Date
}

export interface PredictionModel {
  id: string
  name: string
  type: 'failure_prediction' | 'performance_forecast' | 'resource_optimization'
  algorithm: string
  parameters: Record<string, any>
  training_data_size: number
  accuracy_score: number
  version: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface ModelPrediction {
  id: string
  model_id: string
  cron_job_id: string
  input_features: Record<string, any>
  prediction: any
  confidence: number
  created_at: Date
  expires_at: Date
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: ResponseMeta
}

export interface ResponseMeta {
  page?: number
  limit?: number
  total?: number
  total_pages?: number
  has_more?: boolean
  execution_time?: number
}

export interface PaginationOptions {
  page: number
  limit: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: Date
  user_id?: string
  workspace_id?: string
}

export interface JobExecutionUpdate extends WebSocketMessage {
  type: 'job.execution.update'
  payload: {
    execution_id: string
    status: Execution['status']
    progress?: number
    output?: string
    resource_usage?: ResourceUsage
  }
}

export interface JobStatusUpdate extends WebSocketMessage {
  type: 'job.status.update'
  payload: {
    job_id: string
    status: CronJob['status']
    next_run?: Date
  }
}

export interface AlertNotification extends WebSocketMessage {
  type: 'alert.created'
  payload: Alert
}

export interface PredictionUpdate extends WebSocketMessage {
  type: 'predictions.updated'
  payload: {
    job_id: string
    predictions: JobPrediction
  }
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  workspace_id: string
  user_id?: string
  status?: CronJob['status'][]
  environment?: CronJob['environment'][]
  priority?: CronJob['priority'][]
  tags?: string[]
  date_range?: {
    start: Date
    end: Date
  }
}

// Validation Types
export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Database Query Types
export interface QueryOptions {
  select?: string[]
  where?: Record<string, any>
  orderBy?: Array<{ column: string; order: 'asc' | 'desc' }>
  limit?: number
  offset?: number
  include?: string[]
}

// Utility Types
export type CreateUserInput = Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login_at'>
export type UpdateUserInput = Partial<Omit<User, 'id' | 'created_at' | 'email'>>

export type CreateCronJobInput = Omit<CronJob, 'id' | 'created_at' | 'updated_at' | 'last_run' | 'next_run'>
export type UpdateCronJobInput = Partial<Omit<CronJob, 'id' | 'created_at' | 'workspace_id' | 'user_id'>>

export type CreateWorkspaceInput = Omit<Workspace, 'id' | 'created_at' | 'updated_at'>
export type UpdateWorkspaceInput = Partial<Omit<Workspace, 'id' | 'created_at' | 'owner_id'>>