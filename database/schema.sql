-- ============================================================
--  Investly Database Schema — PostgreSQL
--  Compatible with: PostgreSQL 13+
--
--  Run order:
--    1. schema.sql              ← YOU ARE HERE
--    2. views.sql
--    3. stored_procedures.sql
--    4. seed.sql
--
--  How to run (pick one):
--
--  Option A — pgAdmin:
--    Open pgAdmin → your database → Query Tool → paste this file → F5
--
--  Option B — terminal:
--    psql -U postgres -d InvestlyDB -f schema.sql
--
--  Option C — DBeaver:
--    Connect to your DB → SQL Editor → paste → Ctrl+Enter
-- ============================================================

-- Enable UUID generation (built-in from PostgreSQL 13+, but this
-- extension covers older versions too)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
--  1. USERS
--     Every person who uses the app gets one row.
--     Role controls what screens/actions they can access.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic identity
    name                 VARCHAR(100) NOT NULL,
    phone                VARCHAR(20)  NOT NULL UNIQUE,     -- Libya format: +218XXXXXXXXX
    email                VARCHAR(150) UNIQUE,
    password_hash        VARCHAR(500),                     -- BCrypt hash

    -- Role:
    --   investor → can browse and invest in projects
    --   owner    → can create and manage projects
    --   admin    → full admin dashboard access
    --   guest    → read-only, no investment actions
    role                 VARCHAR(20)  NOT NULL DEFAULT 'investor'
                         CHECK (role IN ('investor', 'owner', 'admin', 'guest')),

    -- Profile
    age                  INTEGER      CHECK (age >= 18 AND age <= 120),
    gender               VARCHAR(10)  CHECK (gender IN ('male', 'female', 'other')),
    location             VARCHAR(200),
    passport_url         VARCHAR(500),           -- uploaded passport image URL
    company_name         VARCHAR(200),           -- only used when role = 'owner'
    bio                  TEXT,
    avatar               VARCHAR(500),

    -- Auto-generated member ID shown in the app  (e.g. INV-00123)
    member_id            VARCHAR(50)  UNIQUE,

    -- Account state
    status               VARCHAR(20)  NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('active', 'pending', 'suspended', 'banned')),

    -- KYC = Know Your Customer (passport verification)
    --   none     → never submitted
    --   pending  → submitted, waiting for admin review
    --   approved → verified, can invest
    --   rejected → docs rejected, must resubmit
    is_verified          BOOLEAN      NOT NULL DEFAULT FALSE,
    kyc_status           VARCHAR(20)  NOT NULL DEFAULT 'none'
                         CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected')),
    kyc_rejection_reason VARCHAR(500),

    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups (login, admin filters)
CREATE INDEX IF NOT EXISTS idx_users_phone    ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_status   ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_kyc      ON users (kyc_status);


-- ============================================================
--  2. WALLETS
--     One wallet per user. Balance is stored here; individual
--     transactions are in wallet_transactions.
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
    id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID          NOT NULL UNIQUE,    -- one wallet per user

    balance            NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_deposits     NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (total_deposits >= 0),
    total_withdrawals  NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (total_withdrawals >= 0),

    -- frozen = admin locked the wallet (user cannot send/receive)
    status             VARCHAR(20)   NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'frozen', 'inactive')),

    last_activity      TIMESTAMPTZ,
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets (user_id);


-- ============================================================
--  3. CATEGORIES
--     Lookup table for project categories.
--     Stored once here — not repeated in every project row.
--     (Fixes 3NF: category_ar/category_en used to live on each
--      project row even though they only depend on the category
--      code, not on the project itself.)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id      VARCHAR(20)  PRIMARY KEY,    -- 'tech', 'energy', 'agri', etc.
    name_ar VARCHAR(50)  NOT NULL,
    name_en VARCHAR(50)  NOT NULL,
    icon    VARCHAR(50)                  -- icon name used in the mobile app
);

-- Seed the 6 fixed categories immediately so the FK below works
INSERT INTO categories (id, name_ar, name_en, icon) VALUES
    ('tech',        'تقنية',        'Technology',      'hardware-chip-outline'),
    ('energy',      'طاقة متجددة',  'Renewable Energy', 'flash-outline'),
    ('agri',        'زراعة',        'Agriculture',      'leaf-outline'),
    ('health',      'صحة',          'Health',           'medkit-outline'),
    ('edu',         'تعليم',        'Education',        'school-outline'),
    ('realestate',  'عقارات',       'Real Estate',      'business-outline')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
--  4. PROJECTS
--     Investment opportunities listed on the platform.
--     All text fields are bilingual (Arabic + English).
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Bilingual titles and descriptions
    title_ar          VARCHAR(200)  NOT NULL,
    title_en          VARCHAR(200)  NOT NULL,
    description_ar    TEXT,
    description_en    TEXT,

    -- Category — FK to categories table (names live there, not here)
    category          VARCHAR(20)   NOT NULL
                      REFERENCES categories(id),

    -- Location (bilingual)
    city_ar           VARCHAR(100),
    city_en           VARCHAR(100),

    image_url         VARCHAR(500),

    -- Funding
    goal              NUMERIC(18,2) NOT NULL CHECK (goal > 0),
    raised            NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (raised >= 0),
    min_investment    NUMERIC(18,2) NOT NULL DEFAULT 5 CHECK (min_investment > 0),
    max_investment    NUMERIC(18,2),
    currency_code     VARCHAR(10)   NOT NULL DEFAULT 'LYD',

    -- Status lifecycle:
    --   pending   → submitted, waiting for admin approval
    --   active    → approved and accepting investments
    --   completed → goal reached or duration expired
    --   inactive  → paused by owner or admin
    --   rejected  → rejected by admin
    status            VARCHAR(20)   NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('active', 'pending', 'completed', 'inactive', 'rejected')),

    reference         VARCHAR(50)   UNIQUE,   -- human-readable ID e.g. PRJ-001
    owner_id          UUID          NOT NULL,

    -- Project timeline
    duration          INTEGER,               -- planned duration in months
    start_date        DATE,
    end_date          DATE,
    team_size         INTEGER       DEFAULT 0,
    website           VARCHAR(500),

    -- Founder contact
    founder_name      VARCHAR(100),
    founder_email     VARCHAR(150),
    founder_phone     VARCHAR(20),

    -- Counters (updated by functions)
    investors_count   INTEGER       NOT NULL DEFAULT 0,
    views_count       INTEGER       NOT NULL DEFAULT 0,

    rejection_reason  VARCHAR(500),
    is_featured       BOOLEAN       NOT NULL DEFAULT FALSE,

    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id  ON projects (owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status    ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_category  ON projects (category);
CREATE INDEX IF NOT EXISTS idx_projects_featured  ON projects (is_featured);


-- ============================================================
--  5. INVESTMENTS
--     Join table: one row per investment (User → Project).
--     This is the many-to-many between investors and projects,
--     with extra columns (amount, status, payment_method).
-- ============================================================
CREATE TABLE IF NOT EXISTS investments (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id     UUID          NOT NULL,
    investor_id    UUID          NOT NULL,

    amount         NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency_code  VARCHAR(10)   NOT NULL DEFAULT 'LYD',

    -- How the investor paid
    payment_method VARCHAR(30)   NOT NULL DEFAULT 'wallet'
                   CHECK (payment_method IN ('wallet', 'credit_card')),

    -- pending   → created, not yet confirmed
    -- completed → money deducted, project.raised updated
    -- failed    → payment failed
    -- cancelled → cancelled before completion
    status         VARCHAR(20)   NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),

    reference      VARCHAR(50)   UNIQUE,     -- e.g. INV-2024-001
    notes          VARCHAR(500),

    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    FOREIGN KEY (project_id)  REFERENCES projects(id),
    FOREIGN KEY (investor_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_investments_project_id  ON investments (project_id);
CREATE INDEX IF NOT EXISTS idx_investments_investor_id ON investments (investor_id);
CREATE INDEX IF NOT EXISTS idx_investments_status      ON investments (status);


-- ============================================================
--  6. PAYMENTS
--     Financial transactions: top-ups, investment payments,
--     refunds. Linked to an investment when paying for a project.
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id          UUID          NOT NULL,
    investment_id    UUID,                     -- NULL for wallet top-ups

    amount           NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency_code    VARCHAR(10)   NOT NULL DEFAULT 'LYD',

    method           VARCHAR(30)   NOT NULL
                     CHECK (method IN ('wallet', 'credit_card')),

    -- pending   → waiting
    -- completed → processed
    -- failed    → failed
    -- refunded  → money returned to user
    status           VARCHAR(20)   NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

    transaction_id   VARCHAR(100)  UNIQUE,     -- e.g. TXN-2024-001
    notes            VARCHAR(500),

    approved_by      UUID,
    approved_at      TIMESTAMPTZ,
    rejected_reason  VARCHAR(500),

    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id)       REFERENCES users(id),
    FOREIGN KEY (investment_id) REFERENCES investments(id),
    FOREIGN KEY (approved_by)   REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id       ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_investment_id ON payments (investment_id);


-- ============================================================
--  7. WALLET TRANSACTIONS
--     Detailed ledger of every credit/debit in a wallet.
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

    wallet_id           UUID          NOT NULL,
    user_id             UUID          NOT NULL,

    -- credit = money IN  (top-up, refund)
    -- debit  = money OUT (investment payment)
    type                VARCHAR(10)   NOT NULL
                        CHECK (type IN ('credit', 'debit')),

    amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency_code       VARCHAR(10)   NOT NULL DEFAULT 'LYD',

    -- Bilingual display labels (shown in the transaction list)
    title_ar            VARCHAR(200)  NOT NULL,
    title_en            VARCHAR(200)  NOT NULL,

    status              VARCHAR(20)   NOT NULL DEFAULT 'completed'
                        CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),

    reference           VARCHAR(100),
    admin_note          VARCHAR(500),
    related_payment_id  UUID,

    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    FOREIGN KEY (user_id)   REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_id ON wallet_transactions (wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_id   ON wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created   ON wallet_transactions (created_at DESC);


-- ============================================================
--  8. NOTIFICATIONS
--     In-app messages. target_user_id = NULL → broadcast to all.
--
--     is_read / read_at are NOT stored here because a broadcast
--     row is shared by ALL users — one flag cannot represent every
--     user's individual read state. Read tracking lives in
--     user_notification_reads (the join table below).
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- investment = about investment activity
    -- project    = project updates
    -- system     = platform-wide announcements
    -- user       = account-level (e.g. KYC approved)
    type            VARCHAR(20)  NOT NULL
                    CHECK (type IN ('investment', 'project', 'system', 'user')),

    title_ar        VARCHAR(200) NOT NULL,
    title_en        VARCHAR(200) NOT NULL,
    message_ar      TEXT         NOT NULL,
    message_en      TEXT         NOT NULL,

    target_user_id  UUID,         -- NULL = send to ALL users
    sent_by         UUID,         -- admin who sent it

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by)        REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_target  ON notifications (target_user_id);


-- ============================================================
--  9. USER NOTIFICATION READS
--     Join table: tracks which users have read which notifications.
--
--     Why a separate table?
--       A broadcast notification (target_user_id = NULL) is one row
--       shared by every user on the platform. Storing is_read on the
--       notification itself would mean "User A reads it → it appears
--       read for User B too." This table gives each user their own
--       read flag per notification.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_notification_reads (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID        NOT NULL,
    user_id         UUID        NOT NULL,
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (notification_id, user_id),   -- one row per user-notification pair

    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notif_reads_user   ON user_notification_reads (user_id);
CREATE INDEX IF NOT EXISTS idx_notif_reads_notif  ON user_notification_reads (notification_id);
CREATE INDEX IF NOT EXISTS idx_notif_reads_unread ON user_notification_reads (user_id, is_read)
    WHERE is_read = FALSE;   -- partial index — only unread rows, very fast for badge count


-- ============================================================
--  10. NOTIFICATION SETTINGS
--     Each user's notification preferences (all ON by default).
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_settings (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL UNIQUE,

    investment_alerts    BOOLEAN     NOT NULL DEFAULT TRUE,
    project_updates      BOOLEAN     NOT NULL DEFAULT TRUE,
    system_messages      BOOLEAN     NOT NULL DEFAULT TRUE,
    email_notifications  BOOLEAN     NOT NULL DEFAULT TRUE,
    push_notifications   BOOLEAN     NOT NULL DEFAULT TRUE,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================================================
--  11. REFRESH TOKENS
--     JWT refresh tokens — keeps users logged in between sessions.
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token   ON refresh_tokens (token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);


-- ============================================================
--  12. OTP CODES
--      6-digit codes sent via SMS for phone login.
--      Expires after 5 minutes, single-use only.
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_codes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phone       VARCHAR(20) NOT NULL,
    code        VARCHAR(10) NOT NULL,

    -- login    = signing in
    -- register = creating account
    -- reset    = phone-based password reset
    purpose     VARCHAR(20) NOT NULL DEFAULT 'login'
                CHECK (purpose IN ('login', 'register', 'reset')),

    expires_at  TIMESTAMPTZ NOT NULL,
    is_used     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes (phone);


-- ============================================================
--  13. PASSWORD RESET CODES
--      6-digit codes sent to email for forgot-password flow.
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(150) NOT NULL,
    code        VARCHAR(10)  NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    is_used     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_codes_email ON password_reset_codes (email);


-- ============================================================
--  14. MEDIA
--      All uploaded files (passports, project images, avatars).
-- ============================================================
CREATE TABLE IF NOT EXISTS media (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by     UUID         NOT NULL,

    url             VARCHAR(500) NOT NULL,
    file_name       VARCHAR(200),
    file_type       VARCHAR(50),               -- e.g. image/jpeg
    file_size_bytes BIGINT,

    -- passport      = KYC passport image
    -- project_image = project cover photo
    -- avatar        = profile photo
    purpose         VARCHAR(50)  CHECK (purpose IN ('passport', 'project_image', 'avatar', 'other')),

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media (uploaded_by);


-- ============================================================
--  15. ACTIVITY LOGS
--      Audit trail of every admin action in the dashboard.
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id     UUID         NOT NULL,

    -- Action codes (examples):
    --   approve_project, reject_project
    --   approve_kyc, reject_kyc
    --   ban_user, suspend_user, unsuspend_user
    --   approve_payment, reject_payment, refund_payment
    --   add_funds, send_notification
    action       VARCHAR(100) NOT NULL,

    entity_type  VARCHAR(50),       -- 'User', 'Project', 'Payment', etc.
    entity_id    VARCHAR(100),      -- the ID of the affected record

    description  VARCHAR(500),
    ip_address   VARCHAR(50),

    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_id  ON activity_logs (admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action    ON activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created   ON activity_logs (created_at DESC);


-- ============================================================
--  END OF SCHEMA
-- ============================================================
DO $$ BEGIN RAISE NOTICE 'Schema created successfully.'; END $$;
