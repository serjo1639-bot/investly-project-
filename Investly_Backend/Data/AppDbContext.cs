using InvestlyFullAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace InvestlyFullAPI.Data;

// AppDbContext is the bridge between our C# code and the database
// It tells Entity Framework how our models map to database tables
public class AppDbContext : DbContext
{
    // Constructor: options contain the connection string and database provider
    // These options are configured in Program.cs
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // DbSet = a collection that represents a database table
    // We can query, add, update, and delete from these sets
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Portfolio> Portfolios => Set<Portfolio>();
    public DbSet<Investment> Investments => Set<Investment>();

    // Configure the table mappings and relationships
    // This is called by EF Core when the model is being created
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ========================
        // User table configuration
        // ========================
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", "dbo"); // Table name = Users, Schema = dbo

            // Map C# property names to database column names (snake_case convention)
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(100);
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(500);
            entity.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(50);
            entity.Property(e => e.LastName).HasColumnName("last_name").HasMaxLength(50);
            entity.Property(e => e.IsMale).HasColumnName("is_male");
            entity.Property(e => e.NationalId).HasColumnName("national_id").HasMaxLength(50);
            entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth");
            entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(10);
            entity.Property(e => e.ProfilePictureUrl).HasColumnName("profile_picture_url").HasMaxLength(500);
            entity.Property(e => e.BankAccountNumber).HasColumnName("bank_account_number").HasMaxLength(50);
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.EmailConfirmed).HasColumnName("email_confirmed");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            // Create an index on Email for fast lookups during login
            entity.HasIndex(e => e.Email).IsUnique().HasDatabaseName("IX_Users_Email");
        });

        // ========================
        // Role table configuration
        // ========================
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles", "dbo");
            entity.HasKey(e => e.RoleId);
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.RoleName).HasColumnName("role_name").HasMaxLength(50);
        });

        // ========================
        // UserRole join table (many-to-many)
        // ========================
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("UserRoles", "dbo");

            // Composite primary key: (user_id + role_id) = a user can only have a role once
            entity.HasKey(e => new { e.UserId, e.RoleId });

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.RoleId).HasColumnName("role_id");
            entity.Property(e => e.AssignedAt).HasColumnName("assigned_at");

            // Define the relationship: UserRole -> User (many-to-one)
            entity.HasOne(e => e.User)
                .WithMany() // User doesn't have a collection of UserRoles (no nav property)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade); // Delete UserRole when User is deleted

            // Define the relationship: UserRole -> Role (many-to-one)
            entity.HasOne(e => e.Role)
                .WithMany() // Role doesn't have a collection of UserRoles
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ========================
        // Notification table
        // ========================
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications", "dbo");
            entity.HasKey(e => e.NotificationId);
            entity.Property(e => e.NotificationId).HasColumnName("notification_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Message).HasColumnName("message").HasMaxLength(1000);
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Type).HasColumnName("type").HasMaxLength(50);

            // One User has many Notifications
            entity.HasOne(e => e.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ========================
        // Portfolio table
        // ========================
        modelBuilder.Entity<Portfolio>(entity =>
        {
            entity.ToTable("Portfolios", "dbo");
            entity.HasKey(e => e.PortfolioId);
            entity.Property(e => e.PortfolioId).HasColumnName("portfolio_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(100);
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
            entity.Property(e => e.TotalInvested).HasColumnName("total_invested").HasColumnType("decimal(18,2)");
            entity.Property(e => e.CurrentValue).HasColumnName("current_value").HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            // One User has many Portfolios
            entity.HasOne(e => e.User)
                .WithMany(u => u.Portfolios)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ========================
        // Investment table
        // ========================
        modelBuilder.Entity<Investment>(entity =>
        {
            entity.ToTable("Investments", "dbo");
            entity.HasKey(e => e.InvestmentId);
            entity.Property(e => e.InvestmentId).HasColumnName("investment_id");
            entity.Property(e => e.PortfolioId).HasColumnName("portfolio_id");
            entity.Property(e => e.AssetName).HasColumnName("asset_name").HasMaxLength(200);
            entity.Property(e => e.AssetSymbol).HasColumnName("asset_symbol").HasMaxLength(20);
            entity.Property(e => e.Quantity).HasColumnName("quantity").HasColumnType("decimal(18,6)");
            entity.Property(e => e.PurchasePrice).HasColumnName("purchase_price").HasColumnType("decimal(18,4)");
            entity.Property(e => e.CurrentPrice).HasColumnName("current_price").HasColumnType("decimal(18,4)");
            entity.Property(e => e.PurchaseDate).HasColumnName("purchase_date");
            entity.Property(e => e.InvestmentType).HasColumnName("investment_type").HasMaxLength(50);

            // One Portfolio has many Investments
            entity.HasOne(e => e.Portfolio)
                .WithMany(p => p.Investments)
                .HasForeignKey(e => e.PortfolioId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
