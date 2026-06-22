SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ============================================================
   INVESTLY - GRADUATION PROJECT CORE SCHEMA
   Scope:
    - Users, roles, investor/entrepreneur profiles, admins
    - User wallets for simple balance tracking
    - Tech-only project categories
    - Projects, proofs, updates
    - Investments, wallet transactions, escrow transactions
    - Withdrawal requests
    - Profit records and dividend payouts

    Money-flow note:
    This schema uses a simplified logical money model for the
    graduation project. It records basic credits, debits, wallet
    balances, investment movement, escrow movement, refunds,
    release operations, and profit distribution.
    It does not model real payment infrastructure,
    bank integration, compliance, or production finance rules.

    Intentionally skipped for MVP:
     - Project milestones
    - Complex category branches outside technology
   ============================================================ */

DROP PROCEDURE IF EXISTS dbo.sp_DistributeProfits;
DROP PROCEDURE IF EXISTS dbo.sp_RefundInvestment;
DROP PROCEDURE IF EXISTS dbo.sp_ReleaseFundsToEntrepreneur;
DROP PROCEDURE IF EXISTS dbo.sp_MakeInvestment;
DROP PROCEDURE IF EXISTS dbo.sp_CreateProject;
DROP PROCEDURE IF EXISTS dbo.sp_RequestWithdrawal;
DROP PROCEDURE IF EXISTS dbo.sp_Deposit;
GO

DROP FUNCTION IF EXISTS dbo.fn_GetEscrowAvailableBalance;
DROP FUNCTION IF EXISTS dbo.fn_GetUserWalletAvailableBalance;
GO

DROP VIEW IF EXISTS dbo.vw_EscrowSummary;
DROP VIEW IF EXISTS dbo.vw_ProjectInvestors;
DROP VIEW IF EXISTS dbo.vw_MyInvestments;
DROP VIEW IF EXISTS dbo.vw_ProjectFunding;
DROP VIEW IF EXISTS dbo.vw_WalletSummary;
DROP VIEW IF EXISTS dbo.vw_EntrepreneurProjects;
DROP VIEW IF EXISTS dbo.vw_InvestorDetails;
GO

DROP TABLE IF EXISTS dbo.DividendPayouts;
DROP TABLE IF EXISTS dbo.ProfitRecords;
DROP TABLE IF EXISTS dbo.WithdrawalRequests;
DROP TABLE IF EXISTS dbo.EscrowTransactions;
DROP TABLE IF EXISTS dbo.WalletTransactions;
DROP TABLE IF EXISTS dbo.Investments;
DROP TABLE IF EXISTS dbo.ProjectUpdates;
DROP TABLE IF EXISTS dbo.ProjectProofs;
DROP TABLE IF EXISTS dbo.ProjectEscrowWallets;
DROP TABLE IF EXISTS dbo.Projects;
DROP TABLE IF EXISTS dbo.Categories;
DROP TABLE IF EXISTS dbo.UserWallets;
DROP TABLE IF EXISTS dbo.EntrepreneurProfiles;
DROP TABLE IF EXISTS dbo.InvestorProfiles;
DROP TABLE IF EXISTS dbo.Admins;
DROP TABLE IF EXISTS dbo.UserRoles;
DROP TABLE IF EXISTS dbo.Roles;
DROP TABLE IF EXISTS dbo.Users;
GO

BEGIN TRANSACTION;

CREATE TABLE dbo.Users (
    user_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(30) NULL,
    gender BIT NULL, -- 0=Male, 1=Female
    national_id VARCHAR(50) NOT NULL,
    date_of_birth DATE NULL,
    phone VARCHAR(20) NULL,
    profile_picture_url VARCHAR(500) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME(),
    is_active BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
    is_blocked BIT NOT NULL CONSTRAINT DF_Users_IsBlocked DEFAULT 0,
    deleted_published_projects INT NOT NULL CONSTRAINT DF_Users_DeletedProjects DEFAULT 0,
    CONSTRAINT UQ_Users_Email UNIQUE (email),
    CONSTRAINT UQ_Users_NationalId UNIQUE (national_id),
    CONSTRAINT UQ_Users_Username UNIQUE (username)
);

CREATE TABLE dbo.Roles (
    role_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL CONSTRAINT UQ_Roles_RoleName UNIQUE
);

INSERT INTO dbo.Roles (role_name)
VALUES ('User'), ('Admin');

CREATE TABLE dbo.UserRoles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at DATETIME2(0) NOT NULL CONSTRAINT DF_UserRoles_AssignedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_UserRoles PRIMARY KEY (user_id, role_id),
    CONSTRAINT FK_UserRoles_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (role_id) REFERENCES dbo.Roles(role_id)
);

CREATE TABLE dbo.Admins (
    admin_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Admins PRIMARY KEY,
    user_id INT NOT NULL,
    permissions VARCHAR(MAX) NULL,
    is_super_admin BIT NOT NULL CONSTRAINT DF_Admins_IsSuperAdmin DEFAULT 0,
    last_login DATETIME2(0) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Admins_CreatedAt DEFAULT SYSUTCDATETIME(),
    created_by INT NULL,
    CONSTRAINT UQ_Admins_User UNIQUE (user_id),
    CONSTRAINT FK_Admins_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_Admins_CreatedBy FOREIGN KEY (created_by) REFERENCES dbo.Admins(admin_id)
);

CREATE TABLE dbo.InvestorProfiles (
    profile_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_InvestorProfiles PRIMARY KEY,
    user_id INT NOT NULL,
    occupation VARCHAR(100) NULL,-- THOSE FOR REVIEW 
    annual_income DECIMAL(12,2) NULL CONSTRAINT CK_InvestorProfiles_AnnualIncome CHECK (annual_income IS NULL OR annual_income >= 0),
    id_document_url VARCHAR(500) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_InvestorProfiles_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_InvestorProfiles_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_InvestorProfiles_User UNIQUE (user_id),
    CONSTRAINT FK_InvestorProfiles_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id) ON DELETE CASCADE
);


--BANK INFORMATION FROM THE PROJECT OWNER
CREATE TABLE dbo.EntrepreneurProfiles (
    profile_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_EntrepreneurProfiles PRIMARY KEY,
    user_id INT NOT NULL,
    bank_account VARCHAR(50) NOT NULL,
    bank_name VARCHAR(50) NOT NULL,
    bank_account_name VARCHAR(50) NOT NULL,

    company_name VARCHAR(150) NULL,
    bio VARCHAR(MAX) NULL,
    linkedin_url VARCHAR(255) NULL,
    website_url VARCHAR(255) NULL,
    experience_years INT NULL CONSTRAINT CK_EntrepreneurProfiles_Experience CHECK (experience_years IS NULL OR experience_years BETWEEN 0 AND 50),
    city VARCHAR(100) NULL,
    is_verified BIT NOT NULL CONSTRAINT DF_EntrepreneurProfiles_IsVerified DEFAULT 0,
    is_blocked BIT NOT NULL CONSTRAINT DF_EntrepreneurProfiles_IsBlocked DEFAULT 0,
    deleted_projects_count INT NOT NULL CONSTRAINT DF_EntrepreneurProfiles_DeletedProjectsCount DEFAULT 0,
    entrepreneur_blocked_count INT NOT NULL CONSTRAINT DF_EntrepreneurProfiles_BlockedCount DEFAULT 0,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_EntrepreneurProfiles_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_EntrepreneurProfiles_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_EntrepreneurProfiles_User UNIQUE (user_id),
    CONSTRAINT FK_EntrepreneurProfiles_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id) ON DELETE CASCADE
);

CREATE TABLE dbo.UserWallets (
    wallet_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserWallets PRIMARY KEY,
    user_id INT NOT NULL,
    balance DECIMAL(18,2) NOT NULL CONSTRAINT DF_UserWallets_Balance DEFAULT 0,
    locked_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_UserWallets_LockedAmount DEFAULT 0,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_UserWallets_Status DEFAULT 'Active',
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_UserWallets_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_UserWallets_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_UserWallets_User UNIQUE (user_id),
    CONSTRAINT CK_UserWallets_Status CHECK (status IN ('Active','Frozen','Closed')),
    CONSTRAINT CK_UserWallets_Balances CHECK (balance >= 0 AND locked_amount >= 0 AND locked_amount <= balance),
    CONSTRAINT FK_UserWallets_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id) ON DELETE CASCADE
);

CREATE TABLE dbo.Categories (
    category_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Categories PRIMARY KEY,
    parent_id INT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    tech_code VARCHAR(30) NULL,
    is_active BIT NOT NULL CONSTRAINT DF_Categories_IsActive DEFAULT 1,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Categories_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Categories_Parent FOREIGN KEY (parent_id) REFERENCES dbo.Categories(category_id)
);

CREATE UNIQUE INDEX UX_Categories_Name_Root ON dbo.Categories(name) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX UX_Categories_Name_Parent ON dbo.Categories(parent_id, name) WHERE parent_id IS NOT NULL;
CREATE UNIQUE INDEX UX_Categories_TechCode ON dbo.Categories(tech_code) WHERE tech_code IS NOT NULL;

INSERT INTO dbo.Categories (name, description, tech_code)
VALUES ('Tech', 'Technology projects', 'TECH');

INSERT INTO dbo.Categories (parent_id, name, description, tech_code)
SELECT parent.category_id, child.name, child.description, child.tech_code
FROM dbo.Categories parent
CROSS APPLY (VALUES
    ('Software', 'Software products and platforms', 'TECH-SOFT'),
    ('Mobile Apps', 'Android and iOS applications', 'TECH-MOBILE'),
    ('Web Development', 'Websites, portals, and SaaS platforms', 'TECH-WEB'),
    ('Artificial Intelligence', 'AI and machine learning projects', 'TECH-AI'),
    ('Cybersecurity', 'Security tools and services', 'TECH-CYBER'),
    ('Data Science', 'Analytics, data platforms, and dashboards', 'TECH-DATA'),
    ('Cloud Solutions', 'Cloud infrastructure and hosted services', 'TECH-CLOUD'),
    ('IoT', 'Internet of Things hardware/software projects', 'TECH-IOT')
) child(name, description, tech_code)
WHERE parent.name = 'Tech' AND parent.parent_id IS NULL;

CREATE TABLE dbo.Projects (
    project_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Projects PRIMARY KEY,
    creator_profile_id INT NOT NULL,
    category_id INT NULL,
    reference VARCHAR(50) NULL,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(MAX) NOT NULL,
    city VARCHAR(100) NULL,
    funding_goal DECIMAL(18,2) NOT NULL,
    min_investment DECIMAL(18,2) NOT NULL CONSTRAINT DF_Projects_MinInvestment DEFAULT 10,
    max_investment DECIMAL(18,2) NULL,
    equity_offered DECIMAL(7,4) NULL,
    current_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Projects_CurrentAmount DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration INT NULL,
    team_size INT NULL,
    image_url VARCHAR(500) NULL,
    views_count INT NOT NULL CONSTRAINT DF_Projects_ViewsCount DEFAULT 0,
    has_phases bit DEFAULT 1, -- 1 PHASED
    status VARCHAR(20) NOT NULL CONSTRAINT DF_Projects_Status DEFAULT 'Draft',
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Projects_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_Projects_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Projects_FundingGoal CHECK (funding_goal > 0),
    CONSTRAINT CK_Projects_InvestmentLimits CHECK (min_investment > 0 AND (max_investment IS NULL OR max_investment >= min_investment)),
    CONSTRAINT CK_Projects_Equity CHECK (equity_offered IS NULL OR equity_offered BETWEEN 0 AND 100),
    CONSTRAINT CK_Projects_CurrentAmount CHECK (current_amount >= 0 AND current_amount <= funding_goal),
    CONSTRAINT CK_Projects_Dates CHECK (end_date > start_date),
    CONSTRAINT CK_Projects_Status CHECK (status IN ('Draft','Pending','Approved','Rejected','Funded','Closed','Cancelled')),
    CONSTRAINT FK_Projects_CreatorProfile FOREIGN KEY (creator_profile_id) REFERENCES dbo.EntrepreneurProfiles(profile_id),
    CONSTRAINT FK_Projects_Category FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id)
);

CREATE INDEX IX_Projects_Status ON dbo.Projects(status);
CREATE INDEX IX_Projects_Category ON dbo.Projects(category_id);
CREATE INDEX IX_Projects_CreatorProfile ON dbo.Projects(creator_profile_id);

CREATE TABLE dbo.ProjectEscrowWallets (
    escrow_wallet_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ProjectEscrowWallets PRIMARY KEY,
    project_id INT NOT NULL,
    balance DECIMAL(18,2) NOT NULL CONSTRAINT DF_ProjectEscrowWallets_Balance DEFAULT 0,
    released_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_ProjectEscrowWallets_ReleasedAmount DEFAULT 0,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_ProjectEscrowWallets_Status DEFAULT 'Pending',
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_ProjectEscrowWallets_CreatedAt DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(0) NOT NULL CONSTRAINT DF_ProjectEscrowWallets_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_ProjectEscrowWallets_Project UNIQUE (project_id),
    CONSTRAINT CK_ProjectEscrowWallets_Status CHECK (status IN ('Pending','Active','Released','Refunded','Closed')),
    CONSTRAINT CK_ProjectEscrowWallets_Balances CHECK (balance >= 0 AND released_amount >= 0),
    CONSTRAINT FK_ProjectEscrowWallets_Projects FOREIGN KEY (project_id) REFERENCES dbo.Projects(project_id)
);

CREATE TABLE dbo.ProjectProofs (
    proof_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ProjectProofs PRIMARY KEY,
    project_id INT NOT NULL,
    type VARCHAR(50) NOT NULL CONSTRAINT CK_ProjectProofs_Type CHECK (type IN ('Business License','Identity','Financial','Legal','Other')),
    title VARCHAR(150) NOT NULL,
    file_url VARCHAR(500) NULL,
    is_verified BIT NOT NULL CONSTRAINT DF_ProjectProofs_IsVerified DEFAULT 0,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_ProjectProofs_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ProjectProofs_Projects FOREIGN KEY (project_id) REFERENCES dbo.Projects(project_id) ON DELETE CASCADE
);

CREATE TABLE dbo.ProjectUpdates (
    update_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ProjectUpdates PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content VARCHAR(MAX) NOT NULL,
    media_url VARCHAR(500) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_ProjectUpdates_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ProjectUpdates_Projects FOREIGN KEY (project_id) REFERENCES dbo.Projects(project_id) ON DELETE CASCADE
);

CREATE TABLE dbo.Investments (
    investment_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Investments PRIMARY KEY,
    investor_profile_id INT NOT NULL,
    project_id INT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_Investments_Status DEFAULT 'Pending',
    funding_percentage DECIMAL(9,6) NULL,
    equity_percentage DECIMAL(9,6) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Investments_CreatedAt DEFAULT SYSUTCDATETIME(),
    confirmed_at DATETIME2(0) NULL,
    CONSTRAINT CK_Investments_Amount CHECK (amount > 0),
    CONSTRAINT CK_Investments_Status CHECK (status IN ('Pending','Confirmed','Refunded','Cancelled','Active')),
    CONSTRAINT FK_Investments_InvestorProfiles FOREIGN KEY (investor_profile_id) REFERENCES dbo.InvestorProfiles(profile_id),
    CONSTRAINT FK_Investments_Projects FOREIGN KEY (project_id) REFERENCES dbo.Projects(project_id)
);

CREATE INDEX IX_Investments_Investor ON dbo.Investments(investor_profile_id);
CREATE INDEX IX_Investments_Project ON dbo.Investments(project_id);

CREATE TABLE dbo.WalletTransactions (
    transaction_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WalletTransactions PRIMARY KEY,
    wallet_id INT NOT NULL,
    type VARCHAR(30) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    reference_no VARCHAR(100) NULL,
    description VARCHAR(500) NULL,
    related_project_id INT NULL,
    related_investment_id INT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_WalletTransactions_CreatedAt DEFAULT SYSUTCDATETIME(),
    completed_at DATETIME2(0) NULL,
    CONSTRAINT CK_WalletTransactions_Type CHECK (type IN ('Deposit','Withdraw','Investment','Refund','WithdrawalRequest','EscrowRelease','Dividend')),
    CONSTRAINT CK_WalletTransactions_Direction CHECK (direction IN ('Credit','Debit')),
    CONSTRAINT CK_WalletTransactions_Amount CHECK (amount > 0),
    CONSTRAINT CK_WalletTransactions_Status CHECK (status IN ('Pending','Processing','Completed','Failed','Cancelled')),
    CONSTRAINT FK_WalletTransactions_UserWallets FOREIGN KEY (wallet_id) REFERENCES dbo.UserWallets(wallet_id),
    CONSTRAINT FK_WalletTransactions_Projects FOREIGN KEY (related_project_id) REFERENCES dbo.Projects(project_id),
    CONSTRAINT FK_WalletTransactions_Investments FOREIGN KEY (related_investment_id) REFERENCES dbo.Investments(investment_id)
);

CREATE INDEX IX_WalletTransactions_Wallet ON dbo.WalletTransactions(wallet_id);
CREATE UNIQUE INDEX UX_WalletTransactions_Reference_NotNull ON dbo.WalletTransactions(reference_no) WHERE reference_no IS NOT NULL;

CREATE TABLE dbo.EscrowTransactions (
    escrow_transaction_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_EscrowTransactions PRIMARY KEY,
    escrow_wallet_id INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    related_investment_id INT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_EscrowTransactions_CreatedAt DEFAULT SYSUTCDATETIME(),
    completed_at DATETIME2(0) NULL,
    CONSTRAINT CK_EscrowTransactions_Type CHECK (type IN ('Funding','Release','Refund')),
    CONSTRAINT CK_EscrowTransactions_Direction CHECK (direction IN ('Credit','Debit')),
    CONSTRAINT CK_EscrowTransactions_Amount CHECK (amount > 0),
    CONSTRAINT CK_EscrowTransactions_Status CHECK (status IN ('Pending','Processing','Completed','Failed','Cancelled')),
    CONSTRAINT FK_EscrowTransactions_EscrowWallets FOREIGN KEY (escrow_wallet_id) REFERENCES dbo.ProjectEscrowWallets(escrow_wallet_id),
    CONSTRAINT FK_EscrowTransactions_Investments FOREIGN KEY (related_investment_id) REFERENCES dbo.Investments(investment_id)
);

CREATE INDEX IX_EscrowTransactions_Escrow ON dbo.EscrowTransactions(escrow_wallet_id);

CREATE TABLE dbo.WithdrawalRequests (
    withdrawal_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WithdrawalRequests PRIMARY KEY,
    wallet_id INT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    bank_name VARCHAR(100) NULL,
    bank_account VARCHAR(50) NULL,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_WithdrawalRequests_Status DEFAULT 'Pending',
    rejection_reason VARCHAR(500) NULL,
    processed_at DATETIME2(0) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_WithdrawalRequests_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_WithdrawalRequests_Amount CHECK (amount > 0),
    CONSTRAINT CK_WithdrawalRequests_Status CHECK (status IN ('Pending','Processing','Completed','Rejected','Cancelled')),
    CONSTRAINT FK_WithdrawalRequests_UserWallets FOREIGN KEY (wallet_id) REFERENCES dbo.UserWallets(wallet_id)
);

-- Profit distribution: entrepreneur reports profits,
-- system splits per investor equity and credits wallets
CREATE TABLE dbo.ProfitRecords (
    profit_record_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ProfitRecords PRIMARY KEY,
    project_id INT NOT NULL,
    period_label VARCHAR(100) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    net_profit DECIMAL(18,2) NOT NULL,
    investor_share_pct DECIMAL(5,2) NOT NULL, -- % of net profit given to investors
    status VARCHAR(20) NOT NULL CONSTRAINT DF_ProfitRecords_Status DEFAULT 'Pending',
    notes VARCHAR(MAX) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_ProfitRecords_CreatedAt DEFAULT SYSUTCDATETIME(),
    distributed_at DATETIME2(0) NULL,
    CONSTRAINT CK_ProfitRecords_NetProfit CHECK (net_profit > 0),
    CONSTRAINT CK_ProfitRecords_InvestorSharePct CHECK (investor_share_pct BETWEEN 0 AND 100),
    CONSTRAINT CK_ProfitRecords_Status CHECK (status IN ('Pending','Distributed','Cancelled')),
    CONSTRAINT FK_ProfitRecords_Projects FOREIGN KEY (project_id) REFERENCES dbo.Projects(project_id)
);

CREATE TABLE dbo.DividendPayouts (
    payout_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DividendPayouts PRIMARY KEY,
    profit_record_id INT NOT NULL,
    investment_id INT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_DividendPayouts_Status DEFAULT 'Pending',
    paid_at DATETIME2(0) NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_DividendPayouts_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_DividendPayouts_Amount CHECK (amount > 0),
    CONSTRAINT CK_DividendPayouts_Status CHECK (status IN ('Pending','Paid','Failed')),
    CONSTRAINT FK_DividendPayouts_ProfitRecords FOREIGN KEY (profit_record_id) REFERENCES dbo.ProfitRecords(profit_record_id),
    CONSTRAINT FK_DividendPayouts_Investments FOREIGN KEY (investment_id) REFERENCES dbo.Investments(investment_id)
);

CREATE TABLE dbo.Notifications (
    notification_id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Notifications PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
    related_project_id INT NULL,
    related_investment_id INT NULL,
    created_at DATETIME2(0) NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id) ON DELETE CASCADE,
    CONSTRAINT FK_Notifications_Projects FOREIGN KEY (related_project_id) REFERENCES dbo.Projects(project_id),
    CONSTRAINT FK_Notifications_Investments FOREIGN KEY (related_investment_id) REFERENCES dbo.Investments(investment_id)
);

COMMIT TRANSACTION;
GO

CREATE VIEW dbo.vw_InvestorDetails
AS
SELECT
    ip.profile_id,
    u.user_id,
    u.email,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    u.national_id,
    ip.occupation,
    ip.annual_income,
    uw.balance AS wallet_balance,
    uw.locked_amount,
    uw.balance - uw.locked_amount AS available_balance,
    uw.status AS wallet_status
FROM dbo.InvestorProfiles ip
JOIN dbo.Users u ON u.user_id = ip.user_id
LEFT JOIN dbo.UserWallets uw ON uw.user_id = u.user_id;
GO

CREATE VIEW dbo.vw_EntrepreneurProjects
AS
SELECT
    p.project_id,
    p.title,
    p.funding_goal,
    p.current_amount,
    p.status,
    p.end_date,
    ep.profile_id AS entrepreneur_profile_id,
    ep.company_name,
    u.user_id AS creator_user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS creator_name
FROM dbo.Projects p
JOIN dbo.EntrepreneurProfiles ep ON ep.profile_id = p.creator_profile_id
JOIN dbo.Users u ON u.user_id = ep.user_id;
GO

CREATE VIEW dbo.vw_WalletSummary
AS
SELECT
    w.wallet_id,
    w.user_id,
    u.email,
    w.balance,
    w.balance - w.locked_amount AS available_balance,
    w.locked_amount,
    w.status
FROM dbo.UserWallets w
JOIN dbo.Users u ON u.user_id = w.user_id;
GO

CREATE VIEW dbo.vw_ProjectFunding
AS
SELECT
    p.project_id,
    p.title,
    c.name AS category_name,
    p.city,
    p.funding_goal,
    p.current_amount,
    p.funding_goal - p.current_amount AS remaining,
    ROUND((p.current_amount / NULLIF(p.funding_goal, 0)) * 100, 2) AS percent_funded,
    p.status,
    DATEDIFF(DAY, CAST(SYSUTCDATETIME() AS DATE), p.end_date) AS days_remaining
FROM dbo.Projects p
LEFT JOIN dbo.Categories c ON c.category_id = p.category_id;
GO

CREATE VIEW dbo.vw_MyInvestments
AS
SELECT
    i.investment_id,
    i.investor_profile_id,
    i.project_id,
    p.title AS project_title,
    i.amount,
    i.funding_percentage,
    i.equity_percentage,
    i.status,
    i.created_at,
    i.confirmed_at
FROM dbo.Investments i
JOIN dbo.Projects p ON p.project_id = i.project_id;
GO

CREATE VIEW dbo.vw_ProjectInvestors
AS
SELECT
    p.project_id,
    p.title AS project_title,
    ip.profile_id AS investor_profile_id,
    u.user_id AS investor_user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS investor_name,
    i.amount AS investment_amount,
    i.equity_percentage,
    i.created_at AS invested_at
FROM dbo.Investments i
JOIN dbo.Projects p ON p.project_id = i.project_id
JOIN dbo.InvestorProfiles ip ON ip.profile_id = i.investor_profile_id
JOIN dbo.Users u ON u.user_id = ip.user_id
WHERE i.status IN ('Confirmed','Active');
GO

CREATE VIEW dbo.vw_EscrowSummary
AS
SELECT
    pew.escrow_wallet_id,
    pew.project_id,
    p.title AS project_title,
    pew.balance,
    pew.released_amount,
    pew.status AS escrow_status
FROM dbo.ProjectEscrowWallets pew
JOIN dbo.Projects p ON p.project_id = pew.project_id;
GO

CREATE FUNCTION dbo.fn_GetUserWalletAvailableBalance(@user_id INT)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @available DECIMAL(18,2);

    SELECT @available = balance - locked_amount
    FROM dbo.UserWallets
    WHERE user_id = @user_id AND status = 'Active';

    RETURN ISNULL(@available, 0);
END;
GO

CREATE FUNCTION dbo.fn_GetEscrowAvailableBalance(@project_id INT)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @available DECIMAL(18,2);

    SELECT @available = balance
    FROM dbo.ProjectEscrowWallets
    WHERE project_id = @project_id AND status IN ('Pending','Active');

    RETURN ISNULL(@available, 0);
END;
GO

CREATE PROCEDURE dbo.sp_Deposit
    @user_id INT,
    @amount DECIMAL(18,2),
    @reference_no VARCHAR(100) = NULL,
    @description VARCHAR(500) = NULL,
    @transaction_id INT OUTPUT,
    @error_message VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @error_message = '';
    SET @transaction_id = NULL;

    IF @amount <= 0 BEGIN SET @error_message = 'Amount must be greater than zero'; RETURN; END;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @wallet_id INT;
        SELECT @wallet_id = wallet_id
        FROM dbo.UserWallets
        WHERE user_id = @user_id AND status = 'Active';

        IF @wallet_id IS NULL BEGIN SET @error_message = 'Wallet not found'; ROLLBACK TRANSACTION; RETURN; END;

        UPDATE dbo.UserWallets
        SET balance = balance + @amount, updated_at = SYSUTCDATETIME()
        WHERE wallet_id = @wallet_id;

        INSERT INTO dbo.WalletTransactions (wallet_id, type, direction, amount, status, reference_no, description, completed_at)
        VALUES (@wallet_id, 'Deposit', 'Credit', @amount, 'Completed', @reference_no, @description, SYSUTCDATETIME());

        SET @transaction_id = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @error_message = ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE PROCEDURE dbo.sp_RequestWithdrawal
    @user_id INT,
    @amount DECIMAL(18,2),
    @bank_name VARCHAR(100),
    @bank_account VARCHAR(50),
    @withdrawal_id INT OUTPUT,
    @error_message VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @error_message = '';
    SET @withdrawal_id = NULL;

    IF @amount <= 0 BEGIN SET @error_message = 'Amount must be greater than zero'; RETURN; END;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @wallet_id INT, @available DECIMAL(18,2);
        SELECT @wallet_id = wallet_id, @available = balance - locked_amount
        FROM dbo.UserWallets
        WHERE user_id = @user_id AND status = 'Active';

        IF @wallet_id IS NULL BEGIN SET @error_message = 'Wallet not found'; ROLLBACK TRANSACTION; RETURN; END;
        IF @available < @amount BEGIN SET @error_message = 'Insufficient balance'; ROLLBACK TRANSACTION; RETURN; END;

        UPDATE dbo.UserWallets
        SET locked_amount = locked_amount + @amount, updated_at = SYSUTCDATETIME()
        WHERE wallet_id = @wallet_id;

        INSERT INTO dbo.WalletTransactions (wallet_id, type, direction, amount, status, description)
        VALUES (@wallet_id, 'WithdrawalRequest', 'Debit', @amount, 'Pending', 'Withdrawal requested');

        INSERT INTO dbo.WithdrawalRequests (wallet_id, amount, bank_name, bank_account, status)
        VALUES (@wallet_id, @amount, @bank_name, @bank_account, 'Pending');

        SET @withdrawal_id = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @error_message = ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE PROCEDURE dbo.sp_CreateProject
    @user_id INT,
    @title VARCHAR(150),
    @description VARCHAR(MAX),
    @category_id INT = NULL,
    @city VARCHAR(100) = NULL,
    @funding_goal DECIMAL(18,2),
    @min_investment DECIMAL(18,2) = 10,
    @max_investment DECIMAL(18,2) = NULL,
    @equity_offered DECIMAL(7,4) = NULL,
    @start_date DATE,
    @end_date DATE,
    @project_id INT OUTPUT,
    @error_message VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @error_message = '';
    SET @project_id = NULL;

    IF @funding_goal <= 0 BEGIN SET @error_message = 'Funding goal must be greater than zero'; RETURN; END;
    IF @end_date <= @start_date BEGIN SET @error_message = 'End date must be after start date'; RETURN; END;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @profile_id INT;
        SELECT @profile_id = profile_id FROM dbo.EntrepreneurProfiles WHERE user_id = @user_id;

        IF @profile_id IS NULL BEGIN SET @error_message = 'Entrepreneur profile not found'; ROLLBACK TRANSACTION; RETURN; END;

        INSERT INTO dbo.Projects (
            creator_profile_id, category_id, title, description, city,
            funding_goal, min_investment, max_investment, equity_offered,
            start_date, end_date, status
        )
        VALUES (
            @profile_id, @category_id, @title, @description, @city,
            @funding_goal, @min_investment, @max_investment, @equity_offered,
            @start_date, @end_date, 'Draft'
        );

        SET @project_id = SCOPE_IDENTITY();

        INSERT INTO dbo.ProjectEscrowWallets (project_id, status)
        VALUES (@project_id, 'Pending');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @error_message = ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE PROCEDURE dbo.sp_MakeInvestment
    @user_id INT,
    @project_id INT,
    @amount DECIMAL(18,2),
    @investment_id INT OUTPUT,
    @error_message VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @error_message = '';
    SET @investment_id = NULL;

    IF @amount <= 0 BEGIN SET @error_message = 'Amount must be greater than zero'; RETURN; END;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @wallet_id INT,
            @available DECIMAL(18,2),
            @profile_id INT,
            @funding_goal DECIMAL(18,2),
            @current DECIMAL(18,2),
            @remaining DECIMAL(18,2),
            @min_invest DECIMAL(18,2),
            @max_invest DECIMAL(18,2),
            @equity_offered DECIMAL(7,4),
            @escrow_wallet_id INT,
            @funding_percentage DECIMAL(9,6),
            @equity_percentage DECIMAL(9,6);

        SELECT @wallet_id = wallet_id, @available = balance - locked_amount
        FROM dbo.UserWallets
        WHERE user_id = @user_id AND status = 'Active';

        IF @wallet_id IS NULL BEGIN SET @error_message = 'Wallet not found'; ROLLBACK TRANSACTION; RETURN; END;
        IF @available < @amount BEGIN SET @error_message = 'Insufficient balance'; ROLLBACK TRANSACTION; RETURN; END;

        SELECT @profile_id = profile_id FROM dbo.InvestorProfiles WHERE user_id = @user_id;
        IF @profile_id IS NULL BEGIN SET @error_message = 'Investor profile not found'; ROLLBACK TRANSACTION; RETURN; END;

        SELECT
            @funding_goal = funding_goal,
            @current = current_amount,
            @min_invest = min_investment,
            @max_invest = max_investment,
            @equity_offered = equity_offered
        FROM dbo.Projects
        WHERE project_id = @project_id
          AND status = 'Approved'
          AND start_date <= CAST(SYSUTCDATETIME() AS DATE)
          AND end_date >= CAST(SYSUTCDATETIME() AS DATE);

        IF @funding_goal IS NULL BEGIN SET @error_message = 'Project not found, not approved, or not open'; ROLLBACK TRANSACTION; RETURN; END;
        IF @amount < @min_invest BEGIN SET @error_message = 'Amount is below minimum investment'; ROLLBACK TRANSACTION; RETURN; END;
        IF @max_invest IS NOT NULL AND @amount > @max_invest BEGIN SET @error_message = 'Amount is above maximum investment'; ROLLBACK TRANSACTION; RETURN; END;

        SET @remaining = @funding_goal - @current;
        IF @remaining <= 0 BEGIN SET @error_message = 'Project is already fully funded'; ROLLBACK TRANSACTION; RETURN; END;
        IF @amount > @remaining BEGIN SET @error_message = 'Amount exceeds remaining funding needed'; ROLLBACK TRANSACTION; RETURN; END;

        SELECT @escrow_wallet_id = escrow_wallet_id
        FROM dbo.ProjectEscrowWallets
        WHERE project_id = @project_id;

        SET @funding_percentage = (@amount / @funding_goal) * 100;
        SET @equity_percentage = (@amount / @funding_goal) * ISNULL(@equity_offered, 0);

        UPDATE dbo.UserWallets
        SET balance = balance - @amount, updated_at = SYSUTCDATETIME()
        WHERE wallet_id = @wallet_id;

        INSERT INTO dbo.Investments (
            investor_profile_id, project_id, amount, status,
            funding_percentage, equity_percentage, confirmed_at
        )
        VALUES (
            @profile_id, @project_id, @amount, 'Confirmed',
            @funding_percentage, @equity_percentage, SYSUTCDATETIME()
        );

        SET @investment_id = SCOPE_IDENTITY();

        INSERT INTO dbo.WalletTransactions (wallet_id, type, direction, amount, status, related_project_id, related_investment_id, completed_at)
        VALUES (@wallet_id, 'Investment', 'Debit', @amount, 'Completed', @project_id, @investment_id, SYSUTCDATETIME());

        UPDATE dbo.ProjectEscrowWallets
        SET balance = balance + @amount,
            status = CASE WHEN status = 'Pending' THEN 'Active' ELSE status END,
            updated_at = SYSUTCDATETIME()
        WHERE escrow_wallet_id = @escrow_wallet_id;

        INSERT INTO dbo.EscrowTransactions (escrow_wallet_id, type, direction, amount, status, related_investment_id, completed_at)
        VALUES (@escrow_wallet_id, 'Funding', 'Credit', @amount, 'Completed', @investment_id, SYSUTCDATETIME());

        UPDATE dbo.Projects
        SET current_amount = current_amount + @amount,
            status = CASE WHEN current_amount + @amount >= funding_goal THEN 'Funded' ELSE status END,
            updated_at = SYSUTCDATETIME()
        WHERE project_id = @project_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @error_message = ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE PROCEDURE dbo.sp_ReleaseFundsToEntrepreneur
    @project_id INT,
    @amount DECIMAL(18,2),
    @error_message VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @error_message = '';

    IF @amount <= 0 BEGIN SET @error_message = 'Amount must be greater than zero'; RETURN; END;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @escrow_wallet_id INT, @escrow_balance DECIMAL(18,2), @entrepreneur_wallet_id INT;

        SELECT @escrow_wallet_id = escrow_wallet_id, @escrow_balance = balance
        FROM dbo.ProjectEscrowWallets
        WHERE project_id = @project_id AND status IN ('Active','Released');

        IF @escrow_wallet_id IS NULL BEGIN SET @error_message = 'Project escrow wallet not found'; ROLLBACK TRANSACTION; RETURN; END;
        IF @escrow_balance < @amount BEGIN SET @error_message = 'Insufficient funds in escrow'; ROLLBACK TRANSACTION; RETURN; END;

        SELECT @entrepreneur_wallet_id = uw.wallet_id
        FROM dbo.Projects p
        JOIN dbo.EntrepreneurProfiles ep ON ep.profile_id = p.creator_profile_id
        JOIN dbo.UserWallets uw ON uw.user_id = ep.user_id AND uw.status = 'Active'
        WHERE p.project_id = @project_id;

        IF @entrepreneur_wallet_id IS NULL BEGIN SET @error_message = 'Entrepreneur wallet not found'; ROLLBACK TRANSACTION; RETURN; END;

        UPDATE dbo.ProjectEscrowWallets
        SET balance = balance - @amount,
            released_amount = released_amount + @amount,
            status = CASE WHEN balance - @amount = 0 THEN 'Released' ELSE status END,
            updated_at = SYSUTCDATETIME()
        WHERE escrow_wallet_id = @escrow_wallet_id;

        UPDATE dbo.UserWallets
        SET balance = balance + @amount, updated_at = SYSUTCDATETIME()
        WHERE wallet_id = @entrepreneur_wallet_id;

        INSERT INTO dbo.EscrowTransactions (escrow_wallet_id, type, direction, amount, status, completed_at)
        VALUES (@escrow_wallet_id, 'Release', 'Debit', @amount, 'Completed', SYSUTCDATETIME());

        INSERT INTO dbo.WalletTransactions (wallet_id, type, direction, amount, status, related_project_id, completed_at)
        VALUES (@entrepreneur_wallet_id, 'EscrowRelease', 'Credit', @amount, 'Completed', @project_id, SYSUTCDATETIME());

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @error_message = ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE PROCEDURE dbo.sp_RefundInvestment
    @investment_id INT,
    @error_message VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @error_message = '';

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE
            @inv_amount DECIMAL(18,2),
            @inv_status VARCHAR(20),
            @inv_prof_id INT,
            @project_id INT,
            @wallet_id INT,
            @escrow_wallet_id INT,
            @escrow_balance DECIMAL(18,2);

        SELECT
            @inv_amount = amount,
            @inv_status = status,
            @inv_prof_id = investor_profile_id,
            @project_id = project_id
        FROM dbo.Investments
        WHERE investment_id = @investment_id;

        IF @inv_status IS NULL BEGIN SET @error_message = 'Investment not found'; ROLLBACK TRANSACTION; RETURN; END;
        IF @inv_status NOT IN ('Confirmed','Active') BEGIN SET @error_message = 'Investment cannot be refunded'; ROLLBACK TRANSACTION; RETURN; END;

        SELECT @wallet_id = uw.wallet_id
        FROM dbo.InvestorProfiles ip
        JOIN dbo.UserWallets uw ON uw.user_id = ip.user_id AND uw.status = 'Active'
        WHERE ip.profile_id = @inv_prof_id;

        SELECT @escrow_wallet_id = escrow_wallet_id, @escrow_balance = balance
        FROM dbo.ProjectEscrowWallets
        WHERE project_id = @project_id;

        IF @wallet_id IS NULL BEGIN SET @error_message = 'Investor wallet not found'; ROLLBACK TRANSACTION; RETURN; END;
        IF @escrow_wallet_id IS NULL BEGIN SET @error_message = 'Escrow wallet not found'; ROLLBACK TRANSACTION; RETURN; END;
        IF @escrow_balance < @inv_amount BEGIN SET @error_message = 'Insufficient escrow balance for refund'; ROLLBACK TRANSACTION; RETURN; END;

        UPDATE dbo.Investments
        SET status = 'Refunded'
        WHERE investment_id = @investment_id;

        UPDATE dbo.UserWallets
        SET balance = balance + @inv_amount, updated_at = SYSUTCDATETIME()
        WHERE wallet_id = @wallet_id;

        INSERT INTO dbo.WalletTransactions (wallet_id, type, direction, amount, status, related_project_id, related_investment_id, completed_at)
        VALUES (@wallet_id, 'Refund', 'Credit', @inv_amount, 'Completed', @project_id, @investment_id, SYSUTCDATETIME());

        UPDATE dbo.ProjectEscrowWallets
        SET balance = balance - @inv_amount, updated_at = SYSUTCDATETIME()
        WHERE escrow_wallet_id = @escrow_wallet_id;

        INSERT INTO dbo.EscrowTransactions (escrow_wallet_id, type, direction, amount, status, related_investment_id, completed_at)
        VALUES (@escrow_wallet_id, 'Refund', 'Debit', @inv_amount, 'Completed', @investment_id, SYSUTCDATETIME());

        UPDATE dbo.Projects
        SET current_amount = current_amount - @inv_amount,
            status = CASE WHEN status = 'Funded' THEN 'Approved' ELSE status END,
            updated_at = SYSUTCDATETIME()
        WHERE project_id = @project_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @error_message = ERROR_MESSAGE();
    END CATCH
END;
GO

CREATE PROCEDURE dbo.sp_DistributeProfits
    @profit_record_id INT,
    @error_message VARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @error_message = '';

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @project_id INT, @investor_share_pct DECIMAL(5,2),
                @status VARCHAR(20), @investor_pool DECIMAL(18,2);

        SELECT @project_id = project_id, @investor_share_pct = investor_share_pct, @status = status
        FROM dbo.ProfitRecords
        WHERE profit_record_id = @profit_record_id;

        IF @status IS NULL BEGIN SET @error_message = 'Profit record not found'; ROLLBACK; RETURN; END;
        IF @status != 'Pending' BEGIN SET @error_message = 'Already distributed'; ROLLBACK; RETURN; END;

        SELECT @investor_pool = net_profit * investor_share_pct / 100
        FROM dbo.ProfitRecords
        WHERE profit_record_id = @profit_record_id;

        DECLARE @total_equity DECIMAL(18,6);
        SELECT @total_equity = SUM(equity_percentage)
        FROM dbo.Investments
        WHERE project_id = @project_id AND status IN ('Confirmed','Active');

        IF @total_equity IS NULL OR @total_equity = 0
        BEGIN SET @error_message = 'No active investments with equity'; ROLLBACK; RETURN; END;

        INSERT INTO dbo.DividendPayouts (profit_record_id, investment_id, amount, status, paid_at)
        SELECT @profit_record_id, i.investment_id,
               ROUND((i.equity_percentage / @total_equity) * @investor_pool, 2),
               'Paid', SYSUTCDATETIME()
        FROM dbo.Investments i
        WHERE i.project_id = @project_id AND i.status IN ('Confirmed','Active');

        UPDATE uw
        SET balance = balance + dp.amount, updated_at = SYSUTCDATETIME()
        FROM dbo.DividendPayouts dp
        JOIN dbo.Investments i ON i.investment_id = dp.investment_id
        JOIN dbo.InvestorProfiles ip ON ip.profile_id = i.investor_profile_id
        JOIN dbo.UserWallets uw ON uw.user_id = ip.user_id
        WHERE dp.profit_record_id = @profit_record_id AND dp.status = 'Paid';

        INSERT INTO dbo.WalletTransactions (wallet_id, type, direction, amount, status, related_project_id, description, completed_at)
        SELECT uw.wallet_id, 'Dividend', 'Credit', dp.amount, 'Completed', @project_id, 'Profit share payout', SYSUTCDATETIME()
        FROM dbo.DividendPayouts dp
        JOIN dbo.Investments i ON i.investment_id = dp.investment_id
        JOIN dbo.InvestorProfiles ip ON ip.profile_id = i.investor_profile_id
        JOIN dbo.UserWallets uw ON uw.user_id = ip.user_id
        WHERE dp.profit_record_id = @profit_record_id AND dp.status = 'Paid';

        UPDATE dbo.ProfitRecords
        SET status = 'Distributed', distributed_at = SYSUTCDATETIME()
        WHERE profit_record_id = @profit_record_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        SET @error_message = ERROR_MESSAGE();
    END CATCH
END;
GO
