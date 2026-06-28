// ============================================================
// APP DB CONTEXT - THE BRIDGE BETWEEN C# AND THE DATABASE
// ============================================================

using Microsoft.EntityFrameworkCore;
using Investly_Backend.Models;

namespace Investly_Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // DbSet properties tell EF Core which models should become database tables.
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

    
    // OnModelCreating centralizes database rules that
    // cannot be expressed by simple model properties.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUsers(modelBuilder);
        ConfigureRoles(modelBuilder);
        ConfigureProfiles(modelBuilder);
        ConfigureWallets(modelBuilder);
        ConfigureProjects(modelBuilder);
        ConfigureInvestments(modelBuilder);
        ConfigureTransactions(modelBuilder);
        ConfigureProfitSharing(modelBuilder);
        ConfigureNotifications(modelBuilder);
    }

    // Configuration is split by domain area
    // to keep the DbContext easier to read and maintain.
    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.Property(u => u.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(u => u.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(u => u.IsActive).HasDefaultValue(true);
            e.Property(u => u.IsDeleted).HasDefaultValue(false);
            e.Property(u => u.IsBlocked).HasDefaultValue(false);
            e.Property(u => u.DeletedPublishedProjects).HasDefaultValue(0);
            e.Property(u => u.EmailConfirmed).HasDefaultValue(false); // we should do this

            // Like the Unique indexes in SQL
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.NationalId).IsUnique();
            e.HasIndex(u => u.Username).IsUnique();

            e.HasCheckConstraint("CK_Users_DeletedPublishedProjects", "[DeletedPublishedProjects] >= 0");
        });

        modelBuilder.Entity<UserRole>(e =>
        {
            e.HasKey(ur => new { ur.UserId, ur.RoleId });
            e.Property(ur => ur.AssignedAt).HasDefaultValueSql("SYSUTCDATETIME()");

            e.HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Admin>(e =>
        {
            e.Property(a => a.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(a => a.IsSuperAdmin).HasDefaultValue(false);
            e.HasIndex(a => a.UserId).IsUnique();

            e.HasOne(a => a.User)
                .WithOne(u => u.Admin)
                .HasForeignKey<Admin>(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(a => a.Creator)
                .WithMany(a => a.CreatedAdmins)
                .HasForeignKey(a => a.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction);
        });
    }

    private static void ConfigureRoles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>(e =>
        {
            e.HasIndex(r => r.RoleName).IsUnique();
        });
    }

    private static void ConfigureProfiles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<InvestorProfile>(e =>
        {
            e.Property(p => p.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(p => p.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(p => p.KycStatus).HasDefaultValue("Pending");
            e.HasIndex(p => p.UserId).IsUnique();
            e.HasCheckConstraint("CK_InvestorProfiles_AnnualIncome", "[AnnualIncome] IS NULL OR [AnnualIncome] >= 0");
            e.HasCheckConstraint("CK_InvestorProfiles_KycStatus", "[KycStatus] IN ('Pending','Approved','Rejected')");

            e.HasOne(p => p.User)
                .WithMany(u => u.InvestorProfiles)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EntrepreneurProfile>(e =>
        {
            e.Property(p => p.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(p => p.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(p => p.IsVerified).HasDefaultValue(false);
            e.Property(p => p.IsBlocked).HasDefaultValue(false);
            e.Property(p => p.DeletedProjectsCount).HasDefaultValue(0);
            e.Property(p => p.EntrepreneurBlockedCount).HasDefaultValue(0);
            e.HasIndex(p => p.UserId).IsUnique();
            e.HasCheckConstraint("CK_EntrepreneurProfiles_Experience", "[ExperienceYears] IS NULL OR [ExperienceYears] BETWEEN 0 AND 50");
            e.HasCheckConstraint("CK_EntrepreneurProfiles_DeleteCounters", "[DeletedProjectsCount] >= 0 AND [EntrepreneurBlockedCount] >= 0");

            e.HasOne(p => p.User)
                .WithMany(u => u.EntrepreneurProfiles)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureWallets(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserWallet>(e =>
        {
            e.Property(w => w.Balance).HasDefaultValue(0m);
            e.Property(w => w.LockedAmount).HasDefaultValue(0m);
            e.Property(w => w.Status).HasDefaultValue("Active");
            e.Property(w => w.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(w => w.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(w => w.UserId).IsUnique();
            e.HasCheckConstraint("CK_UserWallets_Status", "[Status] IN ('Active','Frozen','Closed')");
            e.HasCheckConstraint("CK_UserWallets_Balances", "[Balance] >= 0 AND [LockedAmount] >= 0 AND [LockedAmount] <= [Balance]");

            e.HasOne(w => w.User)
                .WithOne(u => u.UserWallet)
                .HasForeignKey<UserWallet>(w => w.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureProjects(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(e =>
        {
            e.Property(c => c.IsActive).HasDefaultValue(true);
            e.Property(c => c.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(c => c.TechCode).IsUnique().HasFilter("[TechCode] IS NOT NULL");
            e.HasIndex(c => c.Name).IsUnique().HasFilter("[ParentId] IS NULL");
            e.HasIndex(c => new { c.ParentId, c.Name }).IsUnique().HasFilter("[ParentId] IS NOT NULL");
        });

        modelBuilder.Entity<Project>(e =>
        {
            e.Property(p => p.MinInvestment).HasDefaultValue(10m);
            e.Property(p => p.CurrentAmount).HasDefaultValue(0m);
            e.Property(p => p.ViewsCount).HasDefaultValue(0);
            e.Property(p => p.HasPhases).HasDefaultValue(true);
            e.Property(p => p.Status).HasDefaultValue("Draft");
            e.Property(p => p.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(p => p.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(p => p.IsDeleted).HasDefaultValue(false);
            e.HasIndex(p => p.Reference).IsUnique().HasFilter("[Reference] IS NOT NULL");
            e.HasIndex(p => p.Status);
            e.HasIndex(p => p.CategoryId);
            e.HasIndex(p => p.CreatorProfileId);
            e.HasCheckConstraint("CK_Projects_FundingGoal", "[FundingGoal] > 0");
            e.HasCheckConstraint("CK_Projects_InvestmentLimits", "[MinInvestment] > 0 AND ([MaxInvestment] IS NULL OR [MaxInvestment] >= [MinInvestment])");
            e.HasCheckConstraint("CK_Projects_Equity", "[EquityOffered] IS NULL OR [EquityOffered] BETWEEN 0 AND 100");
            e.HasCheckConstraint("CK_Projects_CurrentAmount", "[CurrentAmount] >= 0 AND [CurrentAmount] <= [FundingGoal]");
            e.HasCheckConstraint("CK_Projects_Dates", "[EndDate] > [StartDate]");
            e.HasCheckConstraint("CK_Projects_Status", "[Status] IN ('Draft','Pending','Approved','Rejected','Funded','Closed','Cancelled')");
            e.HasCheckConstraint("CK_Projects_Counts", "[ViewsCount] >= 0 AND ([Duration] IS NULL OR [Duration] >= 0) AND ([TeamSize] IS NULL OR [TeamSize] >= 0)");

            e.HasOne(p => p.CreatorProfile)
                .WithMany(ep => ep.Projects)
                .HasForeignKey(p => p.CreatorProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectEscrowWallet>(e =>
        {
            e.Property(w => w.Balance).HasDefaultValue(0m);
            e.Property(w => w.ReleasedAmount).HasDefaultValue(0m);
            e.Property(w => w.Status).HasDefaultValue("Pending");
            e.Property(w => w.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.Property(w => w.UpdatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(w => w.ProjectId).IsUnique();
            e.HasCheckConstraint("CK_ProjectEscrowWallets_Status", "[Status] IN ('Pending','Active','Released','Refunded','Closed')");
            e.HasCheckConstraint("CK_ProjectEscrowWallets_Balances", "[Balance] >= 0 AND [ReleasedAmount] >= 0");
        });

        modelBuilder.Entity<ProjectProof>(e =>
        {
            e.Property(p => p.IsVerified).HasDefaultValue(false);
            e.Property(p => p.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });

        modelBuilder.Entity<ProjectUpdate>(e =>
        {
            e.Property(p => p.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
        });

        modelBuilder.Entity<ProjectMedia>(e =>
        {
            e.Property(m => m.IsPrimary).HasDefaultValue(false);
            e.Property(m => m.SortOrder).HasDefaultValue(0);
            e.Property(m => m.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(m => m.ProjectId);
            e.HasCheckConstraint("CK_ProjectMedia_Type", "[MediaType] IN ('image','video','document','Image','Video','Document')");
            e.HasCheckConstraint("CK_ProjectMedia_SortOrder", "[SortOrder] >= 0");
        });
    }

    private static void ConfigureInvestments(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Investment>(e =>
        {
            e.Property(i => i.Status).HasDefaultValue("Pending");
            e.Property(i => i.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(i => i.InvestorProfileId);
            e.HasIndex(i => i.ProjectId);
            e.HasCheckConstraint("CK_Investments_Amount", "[Amount] > 0");
            e.HasCheckConstraint("CK_Investments_Status", "[Status] IN ('Pending','Confirmed','Refunded','Cancelled','Active')");
            e.HasCheckConstraint("CK_Investments_Percentages", "([FundingPercentage] IS NULL OR [FundingPercentage] BETWEEN 0 AND 100) AND ([EquityPercentage] IS NULL OR [EquityPercentage] BETWEEN 0 AND 100)");

            e.HasOne(i => i.InvestorProfile)
                .WithMany(ip => ip.Investments)
                .HasForeignKey(i => i.InvestorProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureTransactions(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WalletTransaction>(e =>
        {
            e.Property(t => t.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(t => t.WalletId);
            e.HasIndex(t => t.ReferenceNo).IsUnique().HasFilter("[ReferenceNo] IS NOT NULL");
            e.HasCheckConstraint("CK_WalletTransactions_Type", "[Type] IN ('Deposit','Withdraw','Investment','Refund','WithdrawalRequest','WithdrawalRejected','EscrowRelease','Dividend')");
            e.HasCheckConstraint("CK_WalletTransactions_Direction", "[Direction] IN ('Credit','Debit')");
            e.HasCheckConstraint("CK_WalletTransactions_Amount", "[Amount] > 0");
            e.HasCheckConstraint("CK_WalletTransactions_Status", "[Status] IN ('Pending','Processing','Completed','Failed','Cancelled')");

            e.HasOne(w => w.Wallet)
                .WithMany(uw => uw.WalletTransactions)
                .HasForeignKey(w => w.WalletId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EscrowTransaction>(e =>
        {
            e.Property(t => t.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(t => t.EscrowWalletId);
            e.HasCheckConstraint("CK_EscrowTransactions_Type", "[Type] IN ('Funding','Investment','Release','Refund')");
            e.HasCheckConstraint("CK_EscrowTransactions_Direction", "[Direction] IN ('Credit','Debit')");
            e.HasCheckConstraint("CK_EscrowTransactions_Amount", "[Amount] > 0");
            e.HasCheckConstraint("CK_EscrowTransactions_Status", "[Status] IN ('Pending','Processing','Completed','Failed','Cancelled')");
        });

        modelBuilder.Entity<WithdrawalRequest>(e =>
        {
            e.Property(w => w.Status).HasDefaultValue("Pending");
            e.Property(w => w.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasCheckConstraint("CK_WithdrawalRequests_Amount", "[Amount] > 0");
            e.HasCheckConstraint("CK_WithdrawalRequests_Status", "[Status] IN ('Pending','Processing','Completed','Rejected','Cancelled')");
        });
    }

    private static void ConfigureProfitSharing(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProfitRecord>(e =>
        {
            e.Property(p => p.Status).HasDefaultValue("Pending");
            e.Property(p => p.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasCheckConstraint("CK_ProfitRecords_NetProfit", "[NetProfit] > 0");
            e.HasCheckConstraint("CK_ProfitRecords_InvestorSharePct", "[InvestorSharePct] BETWEEN 0 AND 100");
            e.HasCheckConstraint("CK_ProfitRecords_Status", "[Status] IN ('Pending','Distributed','Cancelled')");
            e.HasCheckConstraint("CK_ProfitRecords_Period", "[PeriodEnd] >= [PeriodStart]");
        });

        modelBuilder.Entity<DividendPayout>(e =>
        {
            e.Property(p => p.Status).HasDefaultValue("Pending");
            e.Property(p => p.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasCheckConstraint("CK_DividendPayouts_Amount", "[Amount] > 0");
            e.HasCheckConstraint("CK_DividendPayouts_Status", "[Status] IN ('Pending','Paid','Failed')");
        });
    }

    private static void ConfigureNotifications(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(e =>
        {
            e.Property(n => n.IsRead).HasDefaultValue(false);
            e.Property(n => n.CreatedAt).HasDefaultValueSql("SYSUTCDATETIME()");
            e.HasIndex(n => n.UserId);
            e.HasIndex(n => new { n.UserId, n.IsRead });
            e.HasCheckConstraint("CK_Notifications_Type", "[Type] IN ('investment','project','system','wallet','other','ProjectSubmitted','ProjectApproved','ProjectRejected','InvestmentCreated','InvestmentConfirmed','InvestmentCancelled','DepositCompleted','WithdrawalRequested','WithdrawalApproved','WithdrawalRejected','KycApproved','KycRejected','EscrowReleased','RefundIssued','Welcome')");

            e.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(n => n.RelatedProject)
                .WithMany(p => p.Notifications)
                .HasForeignKey(n => n.RelatedProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(n => n.RelatedInvestment)
                .WithMany()
                .HasForeignKey(n => n.RelatedInvestmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
