// ============================================================
// APP DB CONTEXT - THE BRIDGE BETWEEN C# AND THE DATABASE
// ============================================================
// Entity Framework Core (EF Core) is an ORM (Object-Relational Mapper).
// AppDbContext inherits from DbContext, which is the core class in EF Core.
//
// HOW IT WORKS:
// - Each DbSet<T> property represents a DATABASE TABLE
// - Each model class (like User) represents a TABLE ROW
// - Each property on the model (like User.Email) represents a COLUMN
// - LINQ queries on DbSets are translated to SQL automatically
//
// EXAMPLE:
//   _context.Users.Where(u => u.Email == "x@y.com").FirstOrDefaultAsync()
//   -> SQL: SELECT * FROM Users WHERE Email = 'x@y.com' LIMIT 1
// ============================================================

using Microsoft.EntityFrameworkCore;
using Investly_Backend.Models;
namespace Investly_Backend.Data;
public class AppDbContext : DbContext
{
    // The constructor receives DbContextOptions from DI (configured in Program.cs)
    // base(options) passes those options (like connection string) to the parent class
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ---- DbSet PROPERTIES ----
    // Each DbSet maps to a database table.
    // EF Core uses the property name as the table name (unless [Table] attribute says otherwise).
    // Example: _context.Users gives us access to the "Users" table.

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<Admin> Admins { get; set; }
    public DbSet<InvestorProfile> InvestorProfiles { get; set; }
    public DbSet<EntrepreneurProfile> EntrepreneurProfiles { get; set; }
    public DbSet<UserWallet> UserWallets { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<ProjectEscrowWallet> ProjectEscrowWallets { get; set; }
    public DbSet<ProjectProof> ProjectProofs { get; set; }
    public DbSet<ProjectUpdate> ProjectUpdates { get; set; }
    public DbSet<ProjectMedia> ProjectMedia { get; set; }
    public DbSet<Investment> Investments { get; set; }
    public DbSet<WalletTransaction> WalletTransactions { get; set; }
    public DbSet<EscrowTransaction> EscrowTransactions { get; set; }
    public DbSet<WithdrawalRequest> WithdrawalRequests { get; set; }
    public DbSet<ProfitRecord> ProfitRecords { get; set; }
    public DbSet<DividendPayout> DividendPayouts { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    // ---- FLUENT API CONFIGURATION ----
    // OnModelCreating lets us configure the database schema using C# code (Fluent API).
    // This is an alternative to data annotations ([Required], [MaxLength]) on models.
    // Fluent API is MORE POWERFUL for complex configurations like:
    //   - Composite keys
    //   - Indexes
    //   - Advanced relationships
    //   - Cascade delete behavior
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // USER CONFIGURATION
        // Indexes speed up queries on columns used in WHERE clauses.
        // HasIndex().IsUnique() creates a UNIQUE constraint = no duplicate values allowed.
        modelBuilder.Entity<User>(e => {
            e.HasIndex(u => u.Email).IsUnique();      // No two users can share an email
            e.HasIndex(u => u.NationalId).IsUnique();  // National ID must be unique
            e.HasIndex(u => u.Username).IsUnique();    // Username must be unique
        });

        // PROJECT CONFIGURATION
        modelBuilder.Entity<Project>(e => {
            e.HasIndex(p => p.Reference).IsUnique();   // Project reference numbers are unique

            // RELATIONSHIP: Project -> EntrepreneurProfile (CreatorProfile)
            // A Project has ONE CreatorProfile (EntrepreneurProfile)
            // An EntrepreneurProfile has MANY Projects
            // The foreign key is Project.CreatorProfileId
            // OnDelete(DeleteBehavior.Restrict) prevents deleting a profile that has projects
            e.HasOne(p => p.CreatorProfile)
                .WithMany(ep => ep.Projects)
                .HasForeignKey(p => p.CreatorProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // INVESTMENT CONFIGURATION
        modelBuilder.Entity<Investment>(e => {
            // Investment -> InvestorProfile (many-to-one)
            e.HasOne(i => i.InvestorProfile)
                .WithMany(ip => ip.Investments)
                .HasForeignKey(i => i.InvestorProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // WALLET TRANSACTION CONFIGURATION
        modelBuilder.Entity<WalletTransaction>(e => {
            // WalletTransaction -> UserWallet (many-to-one)
            e.HasOne(w => w.Wallet)
                .WithMany(uw => uw.WalletTransactions)
                .HasForeignKey(w => w.WalletId)
                .OnDelete(DeleteBehavior.Restrict);
        });

    }
}
