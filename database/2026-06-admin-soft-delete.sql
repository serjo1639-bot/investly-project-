IF COL_LENGTH('Users', 'IsDeleted') IS NULL
    ALTER TABLE Users ADD IsDeleted bit NOT NULL CONSTRAINT DF_Users_IsDeleted DEFAULT 0;

IF COL_LENGTH('Projects', 'IsDeleted') IS NULL
    ALTER TABLE Projects ADD IsDeleted bit NOT NULL CONSTRAINT DF_Projects_IsDeleted DEFAULT 0;
