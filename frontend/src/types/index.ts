export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'operator' | 'viewer'
  workspaceId: string
  avatar?: string
  preferences: UserPreferences
  createdAt: string
  lastLoginAt?: string
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
  jobFailures: boolean
  jobSuccess: boolean
  systemAlerts: boolean
  weeklyReports: boolean
}

export interface DashboardPreferences {
  defaultView: 'grid' | 'list'
  refreshInterval: number
  chartType: 'line' | 'bar' | 'area'
  showPredictions: boolean
  compactMode: boolean
}

export interface CronJob {
  id: string
  name: string
  description?: string
  schedule: string
  command: string
  status: 'active' | 'paused' | 'disabled'
  lastRun?: string
  nextRun: string
  workspaceId: string
  userId: string
  tags: string[]
  environment: 'production' | 'staging' | 'development'
  priority: 'low' | 'medium' | 'high' | 'critical'
  maxRuntime: number
  retries: number
  timeout: number
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
  statistics: CronJobStatistics
  predictions?: CronJobPredictions
}

export interface CronJobStatistics {
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  averageRuntime: number
  lastSuccessAt?: string
  lastFailureAt?: string
  uptimePercentage: number
  performanceTrend: 'improving' | 'stable' | 'degrading'
}

export interface CronJobPredictions {
  nextFailureProbability: number
  recommendedSchedule?: string
  optimizedRuntime?: number
  resourceUsageForecast: ResourceForecast
  performanceScore: number
  suggestions: string[]
}

export interface ResourceForecast {
  cpu: number[]
  memory: number[]
  diskIO: number[]
  networkIO: number[]
  timestamps: string[]
}

export interface Execution {
  id: string
  cronJobId: string
  startTime: string
  endTime?: string
  duration?: number
  status: 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled'
  exitCode?: number
  output?: string
  error?: string
  resourceUsage: ResourceUsage
  metadata: Record<string, any>
}

export interface ResourceUsage {
  cpu: number
  memory: number
  diskRead: number
  diskWrite: number
  networkIn: number
  networkOut: number
}

export interface Workspace {
  id: string
  name: string
  description?: string
  ownerId: string
  settings: WorkspaceSettings
  members: WorkspaceMember[]
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  createdAt: string
  updatedAt: string
}

export interface WorkspaceMember {
  userId: string
  role: 'admin' | 'operator' | 'viewer'
  joinedAt: string
  permissions: string[]
}

export interface WorkspaceSettings {
  timezone: string
  retentionDays: number
  maxConcurrentJobs: number
  alertingEnabled: boolean
  webhookUrl?: string
  integrations: Integration[]
}

export interface Integration {
  id: string
  type: 'slack' | 'teams' | 'discord' | 'email' | 'webhook'
  name: string
  config: Record<string, any>
  enabled: boolean
  events: string[]
}

export interface AnalyticsData {
  timeRange: {
    start: string
    end: string
  }
  metrics: {
    totalJobs: number
    activeJobs: number
    successRate: number
    averageRuntime: number
    resourceUtilization: number
    failureRate: number
    predictiveAccuracy: number
  }
  trends: {
    performance: DataPoint[]
    failures: DataPoint[]
    resourceUsage: DataPoint[]
    executionTime: DataPoint[]
  }
  predictions: {
    nextDayFailures: number
    nextWeekLoad: number
    resourceNeeds: ResourceForecast
    optimizationOpportunities: OptimizationSuggestion[]
  }
}

export interface DataPoint {
  timestamp: string
  value: number
  label?: string
}

export interface OptimizationSuggestion {
  id: string
  type: 'schedule' | 'resource' | 'retry' | 'timeout'
  jobId: string
  jobName: string
  current: any
  suggested: any
  expectedImprovement: number
  confidence: number
  reasoning: string
  priority: 'low' | 'medium' | 'high'
}

export interface Alert {
  id: string
  type: 'failure' | 'performance' | 'resource' | 'prediction' | 'system'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  jobId?: string
  workspaceId: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
  createdAt: string
  resolvedAt?: string
  metadata: Record<string, any>
}

export interface Report {
  id: string
  type: 'performance' | 'summary' | 'predictions' | 'security' | 'custom'
  title: string
  description?: string
  schedule?: string
  workspaceId: string
  userId: string
  filters: ReportFilters
  format: 'pdf' | 'csv' | 'json' | 'html'
  recipients: string[]
  lastGenerated?: string
  nextGeneration?: string
  enabled: boolean
  createdAt: string
}

export interface ReportFilters {
  dateRange: {
    start: string
    end: string
    type: 'relative' | 'absolute'
  }
  jobIds?: string[]
  tags?: string[]
  environments?: string[]
  statuses?: string[]
  includeMetrics: string[]
  includePredictions: boolean
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: string
  userId?: string
  workspaceId?: string
}

export interface JobExecutionUpdate extends WebSocketMessage {
  type: 'job.execution.update'
  payload: {
    executionId: string
    status: Execution['status']
    progress?: number
    output?: string
    resourceUsage?: ResourceUsage
  }
}

export interface JobStatusUpdate extends WebSocketMessage {
  type: 'job.status.update'
  payload: {
    jobId: string
    status: CronJob['status']
    nextRun?: string
  }
}

export interface AlertNotification extends WebSocketMessage {
  type: 'alert.created'
  payload: Alert
}

export interface PredictionUpdate extends WebSocketMessage {
  type: 'predictions.updated'
  payload: {
    jobId: string
    predictions: CronJobPredictions
  }
}

// Form Types
export interface CronJobFormData {
  name: string
  description?: string
  schedule: string
  command: string
  environment: CronJob['environment']
  priority: CronJob['priority']
  maxRuntime: number
  retries: number
  timeout: number
  tags: string[]
  enabled: boolean
}

export interface UserFormData {
  name: string
  email: string
  role: User['role']
  sendInvite: boolean
}

export interface WorkspaceFormData {
  name: string
  description?: string
  timezone: string
  retentionDays: number
  maxConcurrentJobs: number
}

// Chart Configuration Types
export interface ChartConfig {
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'area'
  data: any
  options: any
  plugins?: any[]
}

// Mobile-specific Types
export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'longpress'
  direction?: 'left' | 'right' | 'up' | 'down'
  target: string
  action: () => void
}

export interface MobileNavigation {
  isDrawerOpen: boolean
  activeTab: string
  swipeGestures: TouchGesture[]
}

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'auto'

export interface ThemeColors {
  primary: string
  secondary: string
  success: string
  info: string
  warning: string
  danger: string
  light: string
  dark: string
}

export interface ThemeConfig {
  mode: ThemeMode
  colors: ThemeColors
  typography: {
    fontFamily: string
    fontSize: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  status?: CronJob['status'][]
  environment?: CronJob['environment'][]
  priority?: CronJob['priority'][]
  tags?: string[]
  dateRange?: {
    start: string
    end: string
  }
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// Export utility type
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>