-- Minimal entrepreneur blacklist columns for existing SQL Server databases.
-- Run once against the Investly database if the DB already existed before this code change.
IF COL_LENGTH('EntrepreneurProfiles', 'IsBlocked') IS NULL
    ALTER TABLE EntrepreneurProfiles ADD IsBlocked bit NOT NULL CONSTRAINT DF_EntrepreneurProfiles_IsBlocked DEFAULT 0;

IF COL_LENGTH('EntrepreneurProfiles', 'DeletedProjectsCount') IS NULL
    ALTER TABLE EntrepreneurProfiles ADD DeletedProjectsCount int NOT NULL CONSTRAINT DF_EntrepreneurProfiles_DeletedProjectsCount DEFAULT 0;

IF COL_LENGTH('EntrepreneurProfiles', 'EntrepreneurBlockedCount') IS NULL
    ALTER TABLE EntrepreneurProfiles ADD EntrepreneurBlockedCount int NOT NULL CONSTRAINT DF_EntrepreneurProfiles_EntrepreneurBlockedCount DEFAULT 0;
