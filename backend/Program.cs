using CronCollaboration.Api.Hubs;
using CronCollaboration.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddNewtonsoftJson(); // Add JSON serialization support

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add SignalR for real-time communication
builder.Services.AddSignalR();

// Add CORS for React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003") // React development servers
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required for SignalR
    });
});

// Add HttpClient for OpenClaw API calls
builder.Services.AddHttpClient<OpenClawService>();

// Configure OpenClaw connection
builder.Configuration["OpenClaw:BaseUrl"] = "http://127.0.0.1:18789";

// Register custom services with cached OpenClaw integration (Phase 1 optimized)
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ISuggestionService, SuggestionService>();
builder.Services.AddScoped<IOpenClawService, CachedOpenClawService>(); // Use cached service
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IMemoryService, MemoryService>(); // Phase 2: AI Memory Service

// Add background services for real-time monitoring (temporarily disabled for Phase 1 core functionality)
// builder.Services.AddHostedService<RealTimeMonitoringService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS
app.UseCors("AllowReactApp");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// Map SignalR hub
app.MapHub<CollaborationHub>("/collaborationHub");

app.Run();