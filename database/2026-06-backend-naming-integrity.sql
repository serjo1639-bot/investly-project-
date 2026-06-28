/* ============================================================
   INVESTLY - BACKEND NAMING INTEGRITY PATCH
   Purpose:
   - Keep backend PascalCase table/column naming.
   - Add useful database integrity rules from Investly_Schema_Grad_Core02.sql.
   - Preserve backend-only fields and existing application behavior.
   Safe to run multiple times: constraints/columns are checked before creation.
   ============================================================ */

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

/* Users: keep backend fields and add validation/default safety */
IF COL_LENGTH('dbo.Users', 'EmailConfirmed') IS NULL
    ALTER TABLE dbo.Users ADD EmailConfirmed bit NOT NULL CONSTRAINT DF_Users_EmailConfirmed DEFAULT 0;

IF COL_LENGTH('dbo.Users', 'IsDeleted') IS NULL
    ALTER TABLE dbo.Users ADD IsDeleted bit NOT NULL CONSTRAINT DF_Users_IsDeleted DEFAULT 0;

IF COL_LENGTH('dbo.Users', 'IsBlocked') IS NULL
    ALTER TABLE dbo.Users ADD IsBlocked bit NOT NULL CONSTRAINT DF_Users_IsBlocked DEFAULT 0;

IF COL_LENGTH('dbo.Users', 'DeletedPublishedProjects') IS NULL
    ALTER TABLE dbo.Users ADD DeletedPublishedProjects int NOT NULL CONSTRAINT DF_Users_DeletedPublishedProjects DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Users_DeletedPublishedProjects')
    ALTER TABLE dbo.Users ADD CONSTRAINT CK_Users_DeletedPublishedProjects CHECK (DeletedPublishedProjects >= 0);

/* Profiles */
IF COL_LENGTH('dbo.InvestorProfiles', 'KycStatus') IS NULL
    ALTER TABLE dbo.InvestorProfiles ADD KycStatus varchar(20) NOT NULL CONSTRAINT DF_InvestorProfiles_KycStatus DEFAULT 'Pending';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_InvestorProfiles_KycStatus')
    ALTER TABLE dbo.InvestorProfiles ADD CONSTRAINT CK_InvestorProfiles_KycStatus CHECK (KycStatus IN ('Pending','Approved','Rejected'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_InvestorProfiles_AnnualIncome')
    ALTER TABLE dbo.InvestorProfiles ADD CONSTRAINT CK_InvestorProfiles_AnnualIncome CHECK (AnnualIncome IS NULL OR AnnualIncome >= 0);

IF COL_LENGTH('dbo.EntrepreneurProfiles', 'IsBlocked') IS NULL
    ALTER TABLE dbo.EntrepreneurProfiles ADD IsBlocked bit NOT NULL CONSTRAINT DF_EntrepreneurProfiles_IsBlocked DEFAULT 0;

IF COL_LENGTH('dbo.EntrepreneurProfiles', 'DeletedProjectsCount') IS NULL
    ALTER TABLE dbo.EntrepreneurProfiles ADD DeletedProjectsCount int NOT NULL CONSTRAINT DF_EntrepreneurProfiles_DeletedProjectsCount DEFAULT 0;

IF COL_LENGTH('dbo.EntrepreneurProfiles', 'EntrepreneurBlockedCount') IS NULL
    ALTER TABLE dbo.EntrepreneurProfiles ADD EntrepreneurBlockedCount int NOT NULL CONSTRAINT DF_EntrepreneurProfiles_EntrepreneurBlockedCount DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_EntrepreneurProfiles_Experience')
    ALTER TABLE dbo.EntrepreneurProfiles ADD CONSTRAINT CK_EntrepreneurProfiles_Experience CHECK (ExperienceYears IS NULL OR ExperienceYears BETWEEN 0 AND 50);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_EntrepreneurProfiles_DeleteCounters')
    ALTER TABLE dbo.EntrepreneurProfiles ADD CONSTRAINT CK_EntrepreneurProfiles_DeleteCounters CHECK (DeletedProjectsCount >= 0 AND EntrepreneurBlockedCount >= 0);

/* Wallets */
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_UserWallets_Status')
    ALTER TABLE dbo.UserWallets ADD CONSTRAINT CK_UserWallets_Status CHECK (Status IN ('Active','Frozen','Closed'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_UserWallets_Balances')
    ALTER TABLE dbo.UserWallets ADD CONSTRAINT CK_UserWallets_Balances CHECK (Balance >= 0 AND LockedAmount >= 0 AND LockedAmount <= Balance);

/* Projects */
IF COL_LENGTH('dbo.Projects', 'IsDeleted') IS NULL
    ALTER TABLE dbo.Projects ADD IsDeleted bit NOT NULL CONSTRAINT DF_Projects_IsDeleted DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Projects_FundingGoal')
    ALTER TABLE dbo.Projects ADD CONSTRAINT CK_Projects_FundingGoal CHECK (FundingGoal > 0);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Projects_InvestmentLimits')
    ALTER TABLE dbo.Projects ADD CONSTRAINT CK_Projects_InvestmentLimits CHECK (MinInvestment > 0 AND (MaxInvestment IS NULL OR MaxInvestment >= MinInvestment));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Projects_Equity')
    ALTER TABLE dbo.Projects ADD CONSTRAINT CK_Projects_Equity CHECK (EquityOffered IS NULL OR EquityOffered BETWEEN 0 AND 100);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Projects_CurrentAmount')
    ALTER TABLE dbo.Projects ADD CONSTRAINT CK_Projects_CurrentAmount CHECK (CurrentAmount >= 0 AND CurrentAmount <= FundingGoal);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Projects_Dates')
    ALTER TABLE dbo.Projects ADD CONSTRAINT CK_Projects_Dates CHECK (EndDate > StartDate);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Projects_Status')
    ALTER TABLE dbo.Projects ADD CONSTRAINT CK_Projects_Status CHECK (Status IN ('Draft','Pending','Approved','Rejected','Funded','Closed','Cancelled'));

/* Investments and transactions */
UPDATE dbo.WalletTransactions SET Amount = ABS(Amount) WHERE Amount < 0;
UPDATE dbo.EscrowTransactions SET Amount = ABS(Amount) WHERE Amount < 0;
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Investments_Amount')
    ALTER TABLE dbo.Investments ADD CONSTRAINT CK_Investments_Amount CHECK (Amount > 0);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Investments_Status')
    ALTER TABLE dbo.Investments ADD CONSTRAINT CK_Investments_Status CHECK (Status IN ('Pending','Confirmed','Refunded','Cancelled','Active'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_WalletTransactions_Amount')
    ALTER TABLE dbo.WalletTransactions ADD CONSTRAINT CK_WalletTransactions_Amount CHECK (Amount > 0);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_WalletTransactions_Direction')
    ALTER TABLE dbo.WalletTransactions ADD CONSTRAINT CK_WalletTransactions_Direction CHECK (Direction IN ('Credit','Debit'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_WalletTransactions_Status')
    ALTER TABLE dbo.WalletTransactions ADD CONSTRAINT CK_WalletTransactions_Status CHECK (Status IN ('Pending','Processing','Completed','Failed','Cancelled'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_EscrowTransactions_Amount')
    ALTER TABLE dbo.EscrowTransactions ADD CONSTRAINT CK_EscrowTransactions_Amount CHECK (Amount > 0);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_EscrowTransactions_Direction')
    ALTER TABLE dbo.EscrowTransactions ADD CONSTRAINT CK_EscrowTransactions_Direction CHECK (Direction IN ('Credit','Debit'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_EscrowTransactions_Status')
    ALTER TABLE dbo.EscrowTransactions ADD CONSTRAINT CK_EscrowTransactions_Status CHECK (Status IN ('Pending','Processing','Completed','Failed','Cancelled'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_WithdrawalRequests_Amount')
    ALTER TABLE dbo.WithdrawalRequests ADD CONSTRAINT CK_WithdrawalRequests_Amount CHECK (Amount > 0);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_WithdrawalRequests_Status')
    ALTER TABLE dbo.WithdrawalRequests ADD CONSTRAINT CK_WithdrawalRequests_Status CHECK (Status IN ('Pending','Processing','Completed','Rejected','Cancelled'));

/* Profit sharing */
IF COL_LENGTH('dbo.ProfitRecords', 'ProcessedAt') IS NULL AND COL_LENGTH('dbo.ProfitRecords', 'DistributedAt') IS NOT NULL
    EXEC sp_rename 'dbo.ProfitRecords.DistributedAt', 'ProcessedAt', 'COLUMN';

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_ProfitRecords_NetProfit')
    ALTER TABLE dbo.ProfitRecords ADD CONSTRAINT CK_ProfitRecords_NetProfit CHECK (NetProfit > 0);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_ProfitRecords_InvestorSharePct')
    ALTER TABLE dbo.ProfitRecords ADD CONSTRAINT CK_ProfitRecords_InvestorSharePct CHECK (InvestorSharePct BETWEEN 0 AND 100);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_DividendPayouts_Amount')
    ALTER TABLE dbo.DividendPayouts ADD CONSTRAINT CK_DividendPayouts_Amount CHECK (Amount > 0);

/* Notifications: move from old single-language columns to backend bilingual fields if needed */
IF COL_LENGTH('dbo.Notifications', 'TitleAr') IS NULL
    ALTER TABLE dbo.Notifications ADD TitleAr varchar(200) NULL;

IF COL_LENGTH('dbo.Notifications', 'TitleEn') IS NULL
    ALTER TABLE dbo.Notifications ADD TitleEn varchar(200) NULL;

IF COL_LENGTH('dbo.Notifications', 'MessageAr') IS NULL
    ALTER TABLE dbo.Notifications ADD MessageAr varchar(500) NULL;

IF COL_LENGTH('dbo.Notifications', 'MessageEn') IS NULL
    ALTER TABLE dbo.Notifications ADD MessageEn varchar(500) NULL;

IF COL_LENGTH('dbo.Notifications', 'Title') IS NOT NULL
BEGIN
    EXEC sp_executesql N'UPDATE dbo.Notifications SET TitleAr = COALESCE(TitleAr, Title), TitleEn = COALESCE(TitleEn, Title);';
END

IF COL_LENGTH('dbo.Notifications', 'Message') IS NOT NULL
BEGIN
    EXEC sp_executesql N'UPDATE dbo.Notifications SET MessageAr = COALESCE(MessageAr, Message), MessageEn = COALESCE(MessageEn, Message);';
END

EXEC sp_executesql N'
UPDATE dbo.Notifications
SET
    TitleAr = COALESCE(TitleAr, TitleEn, ''Notification''),
    TitleEn = COALESCE(TitleEn, TitleAr, ''Notification''),
    MessageAr = COALESCE(MessageAr, MessageEn, ''You have a new notification.''),
    MessageEn = COALESCE(MessageEn, MessageAr, ''You have a new notification.'');';

ALTER TABLE dbo.Notifications ALTER COLUMN TitleAr varchar(200) NOT NULL;
ALTER TABLE dbo.Notifications ALTER COLUMN TitleEn varchar(200) NOT NULL;
ALTER TABLE dbo.Notifications ALTER COLUMN MessageAr varchar(500) NOT NULL;
ALTER TABLE dbo.Notifications ALTER COLUMN MessageEn varchar(500) NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Notifications_Type')
    ALTER TABLE dbo.Notifications ADD CONSTRAINT CK_Notifications_Type CHECK (Type IN ('investment','project','system','wallet','other','ProjectSubmitted','ProjectApproved','ProjectRejected','InvestmentCreated','InvestmentConfirmed','InvestmentCancelled','DepositCompleted','WithdrawalRequested','WithdrawalApproved','WithdrawalRejected','KycApproved','KycRejected','EscrowReleased','RefundIssued','Welcome','Admin'));

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notifications_User' AND object_id = OBJECT_ID('dbo.Notifications'))
    CREATE INDEX IX_Notifications_User ON dbo.Notifications(UserId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notifications_Read' AND object_id = OBJECT_ID('dbo.Notifications'))
    CREATE INDEX IX_Notifications_Read ON dbo.Notifications(UserId, IsRead);

COMMIT TRANSACTION;
GO





