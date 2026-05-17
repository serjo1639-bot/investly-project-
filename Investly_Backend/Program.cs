using System.Text;
using InvestlyFullAPI.Data;
using InvestlyFullAPI.Interfaces;
using InvestlyFullAPI.Middleware;
using InvestlyFullAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

// ============================================
// PROGRAM.CS - Application Entry Point
// ============================================
// This is where the application starts. It configures:
// - Database connection
// - Authentication (JWT)
// - Services (Dependency Injection)
// - Middleware pipeline (request handling order)
// ============================================

var builder = WebApplication.CreateBuilder(args);

// -------------------------------------------------------
// 1. ADD SERVICES TO THE CONTAINER
// -------------------------------------------------------
// Services registered here can be injected into controllers
// and other services via constructor parameters (Dependency Injection)

// Add controllers so the app can handle HTTP requests
builder.Services.AddControllers();

// Add Swagger for API documentation (accessible at /swagger)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Configure Swagger to accept JWT tokens for authorization
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token here"
    });

    // Make Swagger send the JWT token with every request
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure CORS (Cross-Origin Resource Sharing)
// This allows your frontend (running on a different port) to call this API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()     // Allow requests from any domain
              .AllowAnyHeader()     // Allow any HTTP headers
              .AllowAnyMethod();    // Allow GET, POST, PUT, DELETE, etc.
    });
});

// Register the database context with Entity Framework
// Tell EF to use SQL Server with the connection string from appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// -------------------------------------------------------
// 2. CONFIGURE JWT AUTHENTICATION
// -------------------------------------------------------
// JWT (JSON Web Token) is how users prove their identity
// The server generates a signed token on login, and the client
// sends it in the Authorization header for subsequent requests

var jwtSettings = builder.Configuration.GetSection("JWT");
var jwtKey = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    // Default authentication scheme = JWT Bearer tokens
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Configure how to validate incoming JWT tokens
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,           // Check that the token was issued by us
        ValidateAudience = true,         // Check that the token is for our API
        ValidateLifetime = true,         // Check that the token hasn't expired
        ValidateIssuerSigningKey = true, // Verify the signature is valid

        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(jwtKey)
    };
});

// Register services for Dependency Injection
// AddScoped = one instance per HTTP request
// AddSingleton = one instance for the entire application lifetime
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IPortfolioService, PortfolioService>();
builder.Services.AddScoped<IInvestmentService, InvestmentService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Add SignalR for real-time notifications (WebSocket-based)
builder.Services.AddSignalR();

// Configure FluentEmail for sending emails via SMTP
builder.Services.AddFluentEmail(
    builder.Configuration["Email:FromEmail"],
    builder.Configuration["Email:FromName"]
)
.AddSmtpSender(
    builder.Configuration["Email:SmtpHost"],
    int.Parse(builder.Configuration["Email:SmtpPort"] ?? "587"),
    builder.Configuration["Email:SmtpUsername"],
    builder.Configuration["Email:SmtpPassword"]
);

var app = builder.Build();

// -------------------------------------------------------
// 3. BUILD THE MIDDLEWARE PIPELINE
// -------------------------------------------------------
// Middleware are components that process HTTP requests in order
// Each middleware can:
//   1. Do something with the request
//   2. Pass it to the next middleware
//   3. Do something with the response
// The order matters! (e.g., auth must come before controllers)

// Custom global exception handler (our middleware)
// Catches all unhandled exceptions and returns clean JSON
app.UseMiddleware<ExceptionMiddleware>();

// Development-only middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();          // Generate Swagger JSON spec
    app.UseSwaggerUI();        // Serve the Swagger UI page
}

// Enable CORS (must come before authentication/authorization)
app.UseCors("AllowFrontend");

// Redirect HTTP to HTTPS
app.UseHttpsRedirection();

// Enable authentication (verify who the user is)
app.UseAuthentication();

// Enable authorization (check what the user can do)
app.UseAuthorization();

// Map controllers to handle HTTP requests
app.MapControllers();

// Map the SignalR hub for real-time notifications
// The frontend connects to /notificationHub via WebSocket
app.MapHub<NotificationHub>("/notificationHub");

// Start the application and listen for requests
app.Run();
