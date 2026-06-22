IF COL_LENGTH('dbo.EntrepreneurProfiles', 'is_blocked') IS NULL
BEGIN
    ALTER TABLE dbo.EntrepreneurProfiles
    ADD is_blocked BIT NOT NULL CONSTRAINT DF_EntrepreneurProfiles_IsBlocked DEFAULT 0;
END;

IF COL_LENGTH('dbo.EntrepreneurProfiles', 'deleted_projects_count') IS NULL
BEGIN
    ALTER TABLE dbo.EntrepreneurProfiles
    ADD deleted_projects_count INT NOT NULL CONSTRAINT DF_EntrepreneurProfiles_DeletedProjectsCount DEFAULT 0;
END;

IF COL_LENGTH('dbo.EntrepreneurProfiles', 'entrepreneur_blocked_count') IS NULL
BEGIN
    ALTER TABLE dbo.EntrepreneurProfiles
    ADD entrepreneur_blocked_count INT NOT NULL CONSTRAINT DF_EntrepreneurProfiles_BlockedCount DEFAULT 0;
END;
