// ============================================================
// INVESTLY BACKEND - APPLICATION ENTRY POINT
// ============================================================
// This file is the STARTUP of the entire web application.
// ASP.NET Core uses a "builder" pattern to configure
// everything BEFORE the app starts listening for requests.
//
// KEY ASP.NET CONCEPT: The "middleware pipeline"
// Every HTTP request travels through a series of components
// (middleware) in the ORDER they are added below.
// Each middleware can process the request, pass it to the next,
// or short-circuit (return a response early).
// ============================================================

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Investly_Backend.Data;
using Investly_Backend.Hubs;
using Investly_Backend.Interfaces;
using Investly_Backend.Middleware;
using Investly_Backend.Services;

// --- BUILDER PHASE ---
// WebApplication.CreateBuilder sets up the default infrastructure:
// - Web server (Kestrel)
// - Configuration (appsettings.json, env variables)
// - Logging
// - Dependency Injection container (the "DI container")
var builder = WebApplication.CreateBuilder(args);

// Keep the local API on the same port regardless of launch profile or IDE settings.
builder.WebHost.UseUrls("http://0.0.0.0:5050");

// ---- DEPENDENCY INJECTION (DI) ----
// DI is a pattern where classes receive their dependencies
// (like services) through their constructor instead of
// creating them directly. ASP.NET Core has a built-in DI container.
//
// Three lifetimes:
// - AddScoped:  ONE instance per HTTP request (most common for services)
// - AddTransient: NEW instance every time it's requested
// - AddSingleton: ONE instance for the entire app lifetime

// Registers controllers so ASP.NET can find and route to them
builder.Services.AddControllers();

// Enables exploring API endpoints (used by Swagger to generate docs)
builder.Services.AddEndpointsApiExplorer();

// ---- SWAGGER / OPENAPI CONFIGURATION ----
// Swagger generates interactive API documentation at /swagger
// We configure JWT "Bearer" auth so we can test protected endpoints
builder.Services.AddSwaggerGen(c => {
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
        {
            new OpenApiSecurityScheme {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ---- SIGNALR ----
// SignalR enables REAL-TIME communication (WebSocket).
// Used here for live notifications to connected clients.
builder.Services.AddSignalR();

// ---- ENTITY FRAMEWORK CORE (EF Core) ----
// EF Core is an ORM (Object-Relational Mapper).
// It maps C# objects (models) to database tables so we don't
// write raw SQL. AppDbContext is the bridge between code and DB.
// UseSqlServer tells EF to talk to SQL Server.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ---- JWT AUTHENTICATION CONFIGURATION ----
// JWT (JSON Web Token) is a token-based auth system.
// When a user logs in, the server creates a signed JWT.
// The client sends this JWT in the Authorization header.
// The server validates the signature to verify identity.
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Investly";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "InvestlyUsers";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // TokenValidationParameters defines HOW to verify incoming JWTs
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,           // Verify the token was issued by OUR server
            ValidateAudience = true,         // Verify the token is meant for OUR app
            ValidateLifetime = true,         // Verify the token hasn't expired
            ValidateIssuerSigningKey = true, // Verify the signature using our secret key
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero        // Eliminate the default 5min grace period
        };

        // Special handling: SignalR connections pass the token as a query param
        // (since WebSockets can't set custom headers)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

// Adds [Authorize] and [Authorize(Roles = "...")] support
builder.Services.AddAuthorization();

// ---- SERVICE REGISTRATION ----
// Register ALL service interfaces with their implementations.
// Scoped = one instance per HTTP request (the default for web services).
// This enables constructor injection in controllers:
//   public MyController(IMyService service) { _service = service; }
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IInvestmentService, InvestmentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IMediaService, MediaService>();
// EmailService is Singleton because SmtpClient is expensive to create
builder.Services.AddHttpClient<IEmailService, EmailService>();

// ---- CORS (Cross-Origin Resource Sharing) ----
// Browsers block JavaScript from one domain calling APIs on another.
// CORS tells the browser it's OK to allow cross-origin requests.
// "AllowAll" is permissive (fine for development, restrict in production).
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

// --- APP BUILD PHASE ---
// Everything above configured the builder.
// Build() creates the actual WebApplication from those settings.
var app = builder.Build();

// ---- MIDDLEWARE PIPELINE ----
// ORDER MATTERS! Each request flows through these in sequence.
// The general rule: put auth-related middleware BEFORE endpoints.

// Swagger is enabled for this graduation project so API testing is always easy.
app.UseSwagger();
app.UseSwaggerUI();

// Visiting the configured application URL should take you straight to Swagger.
// ExcludeFromDescription keeps this helper route out of Swagger because it is not a real API endpoint.
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

// Custom exception handler (wraps uncaught errors in JSON responses)
app.UseMiddleware<ExceptionMiddleware>();

// CORS policy (must come before auth)
app.UseCors("AllowAll");

// Authentication: identifies WHO the user is (reads JWT)
app.UseAuthentication();

// Authorization: checks WHAT the user is allowed to do (checks roles)
app.UseAuthorization();

// Maps controller endpoints (routes like /api/auth/login to AuthController)
app.MapControllers();

// Maps the SignalR hub at /hubs/notifications for real-time updates
app.MapHub<NotificationHub>("/hubs/notifications");

// ---- DATABASE INITIALIZATION ----
// EnsureCreated() creates the database + tables if they don't exist.
// This is NOT a migration tool - it only creates, never updates.
// For production, use EF Core migrations instead.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// ---- START LISTENING ----
// This blocking call starts the web server and waits for requests.
// Everything before this was just configuration.
app.Run();
