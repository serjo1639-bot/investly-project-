-- ============================================================
--  Investly Database Views — PostgreSQL
--  Run AFTER schema.sql
--
--  Views are pre-written queries the ASP.NET API can SELECT
--  from like a normal table — no complex JOINs needed in C#.
-- ============================================================


-- ============================================================
--  vw_project_summary
--  Full project info with owner name and progress percentage.
--
--  Used by: GET /projects, GET /projects/featured
-- ============================================================
CREATE OR REPLACE VIEW vw_project_summary AS
SELECT
    p.id,
    p.title_ar,
    p.title_en,
    p.description_ar,
    p.description_en,

    -- Category code + bilingual names from the categories table
    -- (names no longer stored on each project row — fetched from lookup)
    p.category,
    c.name_ar      AS category_ar,
    c.name_en      AS category_en,
    c.icon         AS category_icon,

    p.city_ar,
    p.city_en,
    p.image_url,
    p.goal,
    p.raised,
    p.min_investment,
    p.max_investment,
    p.currency_code,
    p.status,
    p.reference,
    p.owner_id,
    p.duration,
    p.start_date,
    p.end_date,
    p.team_size,
    p.website,
    p.founder_name,
    p.founder_email,
    p.founder_phone,
    p.investors_count,
    p.views_count,
    p.is_featured,
    p.rejection_reason,
    p.created_at,
    p.updated_at,

    -- Computed progress 0–100 %
    CASE
        WHEN p.goal > 0 THEN ROUND((p.raised / p.goal) * 100)::INTEGER
        ELSE 0
    END AS progress,

    -- Owner info (joined from users)
    u.name         AS owner_name,
    u.company_name AS owner_company_name,
    u.phone        AS owner_phone,
    u.email        AS owner_email

FROM projects p
JOIN users      u ON p.owner_id = u.id
JOIN categories c ON p.category  = c.id;


-- ============================================================
--  vw_user_summary
--  User info with wallet balance and investment totals.
--
--  Used by: GET /users/:id, GET /admin/users
-- ============================================================
CREATE OR REPLACE VIEW vw_user_summary AS
SELECT
    u.id,
    u.name,
    u.phone,
    u.email,
    u.role,
    u.age,
    u.gender,
    u.location,
    u.passport_url,
    u.company_name,
    u.bio,
    u.avatar,
    u.member_id,
    u.status,
    u.is_verified,
    u.kyc_status,
    u.kyc_rejection_reason,
    u.created_at,
    u.updated_at,

    -- Wallet (LEFT JOIN so users without a wallet still appear)
    COALESCE(w.balance,           0) AS wallet_balance,
    COALESCE(w.total_deposits,    0) AS total_topups,
    COALESCE(w.total_withdrawals, 0) AS total_withdrawals,
    w.status                         AS wallet_status,

    -- Investment summary
    COALESCE(inv.total_invested,   0) AS contribution_total,
    COALESCE(inv.investment_count, 0) AS contributions_count,

    -- Project count (for owners)
    COALESCE(proj.project_count, 0)   AS projects_count

FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
LEFT JOIN (
    -- Sum of completed investments per investor
    SELECT
        investor_id,
        SUM(amount)  AS total_invested,
        COUNT(*)     AS investment_count
    FROM investments
    WHERE status = 'completed'
    GROUP BY investor_id
) inv ON u.id = inv.investor_id
LEFT JOIN (
    -- Project count per owner
    SELECT owner_id, COUNT(*) AS project_count
    FROM projects
    GROUP BY owner_id
) proj ON u.id = proj.owner_id;


-- ============================================================
--  vw_admin_dashboard_stats
--  Single-row summary for the admin dashboard home screen.
--
--  Used by: GET /admin/stats
-- ============================================================
CREATE OR REPLACE VIEW vw_admin_dashboard_stats AS
SELECT
    -- User counts
    (SELECT COUNT(*) FROM users WHERE role != 'admin')                                   AS total_users,
    (SELECT COUNT(*) FROM users WHERE role != 'admin' AND status = 'active')             AS active_users,
    (SELECT COUNT(*) FROM users WHERE role != 'admin'
        AND created_at::DATE = CURRENT_DATE)                                             AS new_users_today,
    (SELECT COUNT(*) FROM users WHERE role != 'admin'
        AND created_at >= NOW() - INTERVAL '7 days')                                     AS new_users_this_week,

    -- Project counts
    (SELECT COUNT(*) FROM projects)                                                      AS total_projects,
    (SELECT COUNT(*) FROM projects WHERE status = 'active')                              AS active_projects,
    (SELECT COUNT(*) FROM projects WHERE status = 'pending')                             AS pending_projects,
    (SELECT COUNT(*) FROM projects WHERE status = 'completed')                           AS completed_projects,

    -- Investment counts
    (SELECT COUNT(*)                     FROM investments)                               AS total_investments,
    (SELECT COALESCE(SUM(amount), 0)     FROM investments WHERE status = 'completed')   AS total_revenue,

    -- Payment counts
    (SELECT COUNT(*) FROM payments)                                                      AS total_transactions,

    -- Success rate = completed / all payments (%)
    CASE
        WHEN (SELECT COUNT(*) FROM payments) > 0
        THEN ROUND(
            (SELECT COUNT(*) FROM payments WHERE status = 'completed') * 100.0
            / (SELECT COUNT(*) FROM payments)
        )::INTEGER
        ELSE 0
    END                                                                                  AS success_rate;


-- ============================================================
--  vw_investment_details
--  Investment with project title and investor name.
--
--  Used by: GET /investments/me, GET /admin/investments
-- ============================================================
CREATE OR REPLACE VIEW vw_investment_details AS
SELECT
    i.id,
    i.amount,
    i.currency_code,
    i.payment_method,
    i.status,
    i.reference,
    i.notes,
    i.created_at,
    i.updated_at,

    i.project_id,
    p.title_ar  AS project_title_ar,
    p.title_en  AS project_title_en,

    i.investor_id,
    u.name      AS investor_name,
    u.phone     AS investor_phone

FROM investments i
JOIN projects p ON i.project_id  = p.id
JOIN users    u ON i.investor_id = u.id;


-- ============================================================
--  vw_payment_details
--  Payment with user name and approver name.
--
--  Used by: GET /admin/payments, GET /payments/history
-- ============================================================
CREATE OR REPLACE VIEW vw_payment_details AS
SELECT
    p.id,
    p.amount,
    p.currency_code,
    p.method,
    p.status,
    p.transaction_id,
    p.notes,
    p.rejected_reason,
    p.approved_at,
    p.created_at,
    p.updated_at,

    p.user_id,
    u.name         AS user_name,
    u.phone        AS user_phone,

    p.approved_by,
    a.name         AS approved_by_name,

    p.investment_id

FROM payments p
JOIN  users u ON p.user_id     = u.id
LEFT JOIN users a ON p.approved_by = a.id;


-- ============================================================
--  vw_wallet_details
--  Wallet with user info — for the admin wallets page.
--
--  Used by: GET /admin/wallets
-- ============================================================
CREATE OR REPLACE VIEW vw_wallet_details AS
SELECT
    w.id              AS wallet_id,
    w.user_id,
    w.balance,
    w.total_deposits,
    w.total_withdrawals,
    w.status          AS wallet_status,
    w.last_activity,

    u.name            AS user_name,
    u.email           AS user_email,
    u.phone           AS user_phone

FROM wallets w
JOIN users u ON w.user_id = u.id;


DO $$ BEGIN RAISE NOTICE 'Views created successfully.'; END $$;
