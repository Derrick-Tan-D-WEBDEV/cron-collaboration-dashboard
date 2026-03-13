import { gql } from 'apollo-server-express'

export const typeDefs = gql`
  scalar Date
  scalar JSON

  type User {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    workspaceId: String!
    avatar: String
    preferences: UserPreferences!
    createdAt: Date!
    lastLoginAt: Date
    isActive: Boolean!
  }

  enum UserRole {
    ADMIN
    OPERATOR
    VIEWER
  }

  type UserPreferences {
    theme: String!
    timezone: String!
    language: String!
    notifications: NotificationPreferences!
    dashboard: DashboardPreferences!
  }

  type NotificationPreferences {
    email: Boolean!
    push: Boolean!
    slack: Boolean!
    jobFailures: Boolean!
    jobSuccess: Boolean!
    systemAlerts: Boolean!
    weeklyReports: Boolean!
  }

  type DashboardPreferences {
    defaultView: String!
    refreshInterval: Int!
    chartType: String!
    showPredictions: Boolean!
    compactMode: Boolean!
  }

  type Workspace {
    id: ID!
    name: String!
    description: String
    ownerId: String!
    settings: WorkspaceSettings!
    members: [WorkspaceMember!]!
    subscriptionTier: SubscriptionTier!
    createdAt: Date!
    isActive: Boolean!
  }

  enum SubscriptionTier {
    FREE
    PRO
    ENTERPRISE
  }

  type WorkspaceSettings {
    timezone: String!
    retentionDays: Int!
    maxConcurrentJobs: Int!
    alertingEnabled: Boolean!
    webhookUrl: String
  }

  type WorkspaceMember {
    id: ID!
    userId: String!
    user: User!
    role: UserRole!
    permissions: [String!]!
    joinedAt: Date!
    isActive: Boolean!
  }

  type CronJob {
    id: ID!
    name: String!
    description: String
    schedule: String!
    command: String!
    status: JobStatus!
    lastRun: Date
    nextRun: Date!
    workspaceId: String!
    userId: String!
    user: User!
    tags: [String!]!
    environment: Environment!
    priority: Priority!
    maxRuntime: Int!
    retries: Int!
    timeout: Int!
    metadata: JSON
    createdAt: Date!
    updatedAt: Date!
    isActive: Boolean!
    statistics: JobStatistics
    predictions: JobPrediction
    recentExecutions: [Execution!]!
  }

  enum JobStatus {
    ACTIVE
    PAUSED
    DISABLED
  }

  enum Environment {
    PRODUCTION
    STAGING
    DEVELOPMENT
  }

  enum Priority {
    LOW
    MEDIUM
    HIGH
    CRITICAL
  }

  type JobStatistics {
    totalRuns: Int!
    successfulRuns: Int!
    failedRuns: Int!
    averageRuntime: Float!
    lastSuccessAt: Date
    lastFailureAt: Date
    uptimePercentage: Float!
    performanceTrend: PerformanceTrend!
    updatedAt: Date!
  }

  enum PerformanceTrend {
    IMPROVING
    STABLE
    DEGRADING
  }

  type JobPrediction {
    id: ID!
    nextFailureProbability: Float!
    recommendedSchedule: String
    optimizedRuntime: Float
    resourceUsageForecast: ResourceForecast!
    performanceScore: Float!
    suggestions: [String!]!
    confidence: Float!
    createdAt: Date!
    expiresAt: Date!
  }

  type ResourceForecast {
    cpu: [Float!]!
    memory: [Float!]!
    diskIO: [Float!]!
    networkIO: [Float!]!
    timestamps: [String!]!
  }

  type Execution {
    id: ID!
    cronJobId: String!
    cronJob: CronJob!
    startTime: Date!
    endTime: Date
    duration: Int
    status: ExecutionStatus!
    exitCode: Int
    output: String
    error: String
    resourceUsage: ResourceUsage!
    metadata: JSON
    createdAt: Date!
  }

  enum ExecutionStatus {
    RUNNING
    COMPLETED
    FAILED
    TIMEOUT
    CANCELLED
  }

  type ResourceUsage {
    cpuPercent: Float!
    memoryMB: Float!
    diskReadMB: Float!
    diskWriteMB: Float!
    networkInMB: Float!
    networkOutMB: Float!
  }

  type Alert {
    id: ID!
    type: AlertType!
    severity: AlertSeverity!
    title: String!
    message: String!
    cronJobId: String
    cronJob: CronJob
    workspaceId: String!
    acknowledged: Boolean!
    acknowledgedBy: String
    acknowledgedAt: Date
    createdAt: Date!
    resolvedAt: Date
    metadata: JSON
  }

  enum AlertType {
    FAILURE
    PERFORMANCE
    RESOURCE
    PREDICTION
    SYSTEM
  }

  enum AlertSeverity {
    INFO
    WARNING
    ERROR
    CRITICAL
  }

  type AnalyticsData {
    timeRange: TimeRange!
    metrics: AnalyticsMetrics!
    trends: AnalyticsTrends!
    predictions: AnalyticsPredictions!
  }

  type TimeRange {
    start: Date!
    end: Date!
  }

  type AnalyticsMetrics {
    totalJobs: Int!
    activeJobs: Int!
    successRate: Float!
    averageRuntime: Float!
    resourceUtilization: Float!
    failureRate: Float!
    predictiveAccuracy: Float!
  }

  type AnalyticsTrends {
    performance: [DataPoint!]!
    failures: [DataPoint!]!
    resourceUsage: [DataPoint!]!
    executionTime: [DataPoint!]!
  }

  type DataPoint {
    timestamp: Date!
    value: Float!
    label: String
  }

  type AnalyticsPredictions {
    nextDayFailures: Float!
    nextWeekLoad: Float!
    resourceNeeds: ResourceForecast!
    optimizationOpportunities: [OptimizationSuggestion!]!
  }

  type OptimizationSuggestion {
    id: ID!
    type: String!
    jobId: String!
    jobName: String!
    current: JSON!
    suggested: JSON!
    expectedImprovement: Float!
    confidence: Float!
    reasoning: String!
    priority: Priority!
  }

  type Report {
    id: ID!
    type: ReportType!
    title: String!
    description: String
    schedule: String
    workspaceId: String!
    userId: String!
    user: User!
    filters: JSON!
    format: ReportFormat!
    recipients: [String!]!
    lastGenerated: Date
    nextGeneration: Date
    enabled: Boolean!
    createdAt: Date!
  }

  enum ReportType {
    PERFORMANCE
    SUMMARY
    PREDICTIONS
    SECURITY
    CUSTOM
  }

  enum ReportFormat {
    PDF
    CSV
    JSON
    HTML
  }

  # Input Types
  input CreateUserInput {
    email: String!
    name: String!
    password: String!
    role: UserRole!
    workspaceId: String!
  }

  input UpdateUserInput {
    name: String
    role: UserRole
    preferences: UserPreferencesInput
  }

  input UserPreferencesInput {
    theme: String
    timezone: String
    language: String
    notifications: NotificationPreferencesInput
    dashboard: DashboardPreferencesInput
  }

  input NotificationPreferencesInput {
    email: Boolean
    push: Boolean
    slack: Boolean
    jobFailures: Boolean
    jobSuccess: Boolean
    systemAlerts: Boolean
    weeklyReports: Boolean
  }

  input DashboardPreferencesInput {
    defaultView: String
    refreshInterval: Int
    chartType: String
    showPredictions: Boolean
    compactMode: Boolean
  }

  input CreateCronJobInput {
    name: String!
    description: String
    schedule: String!
    command: String!
    tags: [String!]
    environment: Environment!
    priority: Priority
    maxRuntime: Int
    retries: Int
    timeout: Int
    metadata: JSON
  }

  input UpdateCronJobInput {
    name: String
    description: String
    schedule: String
    command: String
    status: JobStatus
    tags: [String!]
    environment: Environment
    priority: Priority
    maxRuntime: Int
    retries: Int
    timeout: Int
    metadata: JSON
  }

  input SearchFiltersInput {
    query: String
    status: [JobStatus!]
    environment: [Environment!]
    priority: [Priority!]
    tags: [String!]
    dateRange: DateRangeInput
  }

  input DateRangeInput {
    start: Date!
    end: Date!
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 20
    sortBy: String = "createdAt"
    sortOrder: SortOrder = DESC
  }

  enum SortOrder {
    ASC
    DESC
  }

  # Response Types
  type PaginatedCronJobs {
    items: [CronJob!]!
    pagination: PaginationInfo!
  }

  type PaginatedExecutions {
    items: [Execution!]!
    pagination: PaginationInfo!
  }

  type PaginatedAlerts {
    items: [Alert!]!
    pagination: PaginationInfo!
  }

  type PaginationInfo {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
    hasMore: Boolean!
  }

  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }

  # Queries
  type Query {
    # User queries
    me: User
    users: [User!]!
    user(id: ID!): User

    # Cron job queries
    cronJobs(filters: SearchFiltersInput, pagination: PaginationInput): PaginatedCronJobs!
    cronJob(id: ID!): CronJob
    cronJobsByTag(tag: String!): [CronJob!]!

    # Execution queries
    executions(cronJobId: String, pagination: PaginationInput): PaginatedExecutions!
    execution(id: ID!): Execution
    recentExecutions(limit: Int = 10): [Execution!]!

    # Analytics queries
    analytics(timeRange: DateRangeInput): AnalyticsData!
    jobStatistics(jobId: ID!): JobStatistics
    predictions(jobId: ID): [JobPrediction!]!
    optimizationSuggestions(limit: Int = 5): [OptimizationSuggestion!]!

    # Alert queries
    alerts(pagination: PaginationInput): PaginatedAlerts!
    unreadAlerts: [Alert!]!

    # Workspace queries
    workspace: Workspace
    workspaceMembers: [WorkspaceMember!]!

    # Report queries
    reports: [Report!]!
    report(id: ID!): Report
  }

  # Mutations
  type Mutation {
    # Authentication
    login(email: String!, password: String!): AuthPayload!
    refreshToken(refreshToken: String!): AuthPayload!
    logout: Boolean!

    # User mutations
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    updateProfile(input: UpdateUserInput!): User!

    # Cron job mutations
    createCronJob(input: CreateCronJobInput!): CronJob!
    updateCronJob(id: ID!, input: UpdateCronJobInput!): CronJob!
    deleteCronJob(id: ID!): Boolean!
    toggleCronJob(id: ID!): CronJob!
    executeCronJob(id: ID!): Execution!

    # Execution mutations
    cancelExecution(id: ID!): Execution!
    retryExecution(id: ID!): Execution!

    # Alert mutations
    acknowledgeAlert(id: ID!): Alert!
    resolveAlert(id: ID!): Alert!
    bulkAcknowledgeAlerts(ids: [ID!]!): [Alert!]!

    # Analytics mutations
    refreshPredictions(jobId: ID): [JobPrediction!]!
    trainPredictionModel(modelType: String!): Boolean!

    # Report mutations
    createReport(input: JSON!): Report!
    updateReport(id: ID!, input: JSON!): Report!
    deleteReport(id: ID!): Boolean!
    generateReport(id: ID!): String!

    # Workspace mutations
    updateWorkspace(input: JSON!): Workspace!
    inviteUser(email: String!, role: UserRole!): WorkspaceMember!
    removeUser(userId: ID!): Boolean!
    updateUserRole(userId: ID!, role: UserRole!): WorkspaceMember!
  }

  # Subscriptions
  type Subscription {
    # Real-time execution updates
    executionUpdated(cronJobId: String): Execution!
    
    # Real-time job status updates
    jobStatusChanged(cronJobId: String): CronJob!
    
    # Real-time alerts
    alertCreated: Alert!
    
    # Real-time predictions
    predictionsUpdated(cronJobId: String): JobPrediction!
    
    # Workspace notifications
    workspaceNotification: JSON!
  }
`