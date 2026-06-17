-- ============================================================
--  Investly Sample Data (Seed) — PostgreSQL
--  Run AFTER schema.sql, views.sql, stored_procedures.sql
--
--  Test accounts created:
--    Admin   : admin@investly.ly     / Admin@123
--    Investor: ahmed@test.ly         / Test@123
--    Investor: sara@test.ly          / Test@123
--    Owner   : fatima@test.ly        / Test@123
--
--  The password_hash values below are REAL BCrypt hashes that match the
--  passwords above (Admin@123 for admin, Test@123 for the rest), so these
--  accounts can sign in immediately after seeding.
-- ============================================================


-- ============================================================
--  1. USERS
-- ============================================================

INSERT INTO users (id, name, phone, email, password_hash, role, status,
                   is_verified, kyc_status, member_id, age, gender, location, created_at)
VALUES

    -- Admin
    ('11111111-1111-1111-1111-111111111111',
     'Admin User', '+218911000001', 'admin@investly.ly',
     '$2a$11$GXFETpcp7/8WEzmxf.Xjq.V.E1nZeV4xO8dvDLK7ZqcrDF/jY9MwG',
     'admin', 'active', TRUE, 'approved', 'INV-ADM-001',
     35, 'male', 'Tripoli, Libya',
     '2024-01-01 00:00:00+00'),

    -- Investor 1
    ('22222222-2222-2222-2222-222222222222',
     'Ahmed Ali', '+218911111111', 'ahmed@test.ly',
     '$2a$11$oCksVP6sM5vv4HAcGE26wur0ctYm5idMztFRwBUWVgvIT88hwsBZS',
     'investor', 'active', TRUE, 'approved', 'INV-USR-001',
     29, 'male', 'Tripoli, Libya',
     '2024-03-15 10:00:00+00'),

    -- Investor 2 (suspended)
    ('33333333-3333-3333-3333-333333333333',
     'Sara Khalil', '+218944444444', 'sara@test.ly',
     '$2a$11$oCksVP6sM5vv4HAcGE26wur0ctYm5idMztFRwBUWVgvIT88hwsBZS',
     'investor', 'suspended', TRUE, 'approved', 'INV-USR-002',
     31, 'female', 'Zawiya, Libya',
     '2024-02-10 10:00:00+00'),

    -- Investor 3 (pending KYC)
    ('44444444-4444-4444-4444-444444444444',
     'Omar Mansour', '+218933333333', 'omar@test.ly',
     '$2a$11$oCksVP6sM5vv4HAcGE26wur0ctYm5idMztFRwBUWVgvIT88hwsBZS',
     'investor', 'pending', FALSE, 'pending', 'INV-USR-003',
     22, 'male', 'Misrata, Libya',
     '2024-05-01 10:00:00+00'),

    -- Project Owner
    ('55555555-5555-5555-5555-555555555555',
     'Fatima Hassan', '+218922222222', 'fatima@test.ly',
     '$2a$11$oCksVP6sM5vv4HAcGE26wur0ctYm5idMztFRwBUWVgvIT88hwsBZS',
     'owner', 'active', TRUE, 'approved', 'INV-OWN-001',
     34, 'female', 'Benghazi, Libya',
     '2024-04-20 10:00:00+00');


-- ============================================================
--  2. WALLETS
-- ============================================================

INSERT INTO wallets (user_id, balance, total_deposits, total_withdrawals, status)
VALUES
    ('11111111-1111-1111-1111-111111111111',  0,      0,      0,     'active'),   -- admin
    ('22222222-2222-2222-2222-222222222222',  5000,   45000,  40000, 'active'),   -- ahmed
    ('33333333-3333-3333-3333-333333333333',  2500,   15000,  12500, 'frozen'),   -- sara (suspended)
    ('44444444-4444-4444-4444-444444444444',  0,      0,      0,     'active'),   -- omar
    ('55555555-5555-5555-5555-555555555555',  0,      0,      0,     'active');   -- fatima


-- ============================================================
--  3. PROJECTS
-- ============================================================

-- NOTE: category_ar / category_en are no longer columns on projects.
--       Category names now live in the categories table (added to schema.sql).
--       The categories table was seeded inside schema.sql itself.

INSERT INTO projects (id, title_ar, title_en, description_ar, description_en,
    category, city_ar, city_en,
    goal, raised, min_investment, currency_code, status, reference, owner_id,
    duration, start_date, end_date, founder_name, founder_email, founder_phone,
    investors_count, views_count, is_featured, created_at)
VALUES

    -- Project 1: Active tech project
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'منصة تقنية متقدمة', 'Advanced Tech Platform',
     'منصة تقنية مبتكرة تهدف لتطوير حلول برمجية متكاملة للشركات الليبية.',
     'An innovative tech platform delivering integrated software solutions for Libyan businesses.',
     'tech', 'طرابلس', 'Tripoli',
     100000, 65000, 500, 'LYD', 'active', 'PRJ-001',
     '55555555-5555-5555-5555-555555555555',
     12, '2024-02-01', '2025-02-01',
     'Fatima Hassan', 'fatima@tech.ly', '+218922222222',
     12, 340, TRUE, '2024-02-01 10:00:00+00'),

    -- Project 2: Active energy project
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'مزرعة طاقة شمسية', 'Solar Energy Farm',
     'مزرعة طاقة شمسية متجددة لتوفير الكهرباء للمجتمعات الريفية.',
     'Renewable solar energy for rural communities across Libya.',
     'energy', 'بنغازي', 'Benghazi',
     500000, 120000, 1000, 'LYD', 'active', 'PRJ-002',
     '55555555-5555-5555-5555-555555555555',
     24, '2024-03-10', '2026-03-10',
     'Fatima Hassan', 'fatima@energy.ly', '+218922222222',
     8, 210, TRUE, '2024-03-10 10:00:00+00'),

    -- Project 3: Pending approval
    ('cccccccc-cccc-cccc-cccc-cccccccccccc',
     'مزرعة ذكية', 'Smart Agriculture',
     'مزرعة تستخدم تقنيات إنترنت الأشياء والري الذكي.',
     'Modern farming using IoT and smart irrigation systems.',
     'agri', 'مصراتة', 'Misrata',
     80000, 0, 250, 'LYD', 'pending', 'PRJ-003',
     '55555555-5555-5555-5555-555555555555',
     NULL, NULL, NULL,
     'Fatima Hassan', 'fatima@agri.ly', '+218922222222',
     0, 45, FALSE, '2024-05-01 10:00:00+00'),

    -- Project 4: Completed
    ('dddddddd-dddd-dddd-dddd-dddddddddddd',
     'عيادة صحية مجتمعية', 'Community Health Clinic',
     'عيادة صحية متكاملة في طرابلس تخدم المجتمع المحلي.',
     'A full-service community health clinic in Tripoli.',
     'health', 'طرابلس', 'Tripoli',
     200000, 200000, 1000, 'LYD', 'completed', 'PRJ-004',
     '55555555-5555-5555-5555-555555555555',
     NULL, NULL, NULL,
     'Fatima Hassan', 'fatima@health.ly', '+218922222222',
     25, 890, FALSE, '2023-11-01 10:00:00+00');


-- ============================================================
--  4. INVESTMENTS
-- ============================================================

INSERT INTO investments (id, project_id, investor_id, amount, currency_code,
                         payment_method, status, reference, created_at)
VALUES
    ('c1111111-1111-1111-1111-111111111111',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     '22222222-2222-2222-2222-222222222222',
     2500, 'LYD', 'wallet', 'completed', 'INV-2024-001', '2024-04-01 10:00:00+00'),

    ('c2222222-2222-2222-2222-222222222222',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     '22222222-2222-2222-2222-222222222222',
     5000, 'LYD', 'credit_card', 'completed', 'INV-2024-002', '2024-04-15 10:00:00+00'),

    ('c3333333-3333-3333-3333-333333333333',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     '33333333-3333-3333-3333-333333333333',
     1000, 'LYD', 'wallet', 'pending', 'INV-2024-003', '2024-05-01 10:00:00+00'),

    ('c4444444-4444-4444-4444-444444444444',
     'dddddddd-dddd-dddd-dddd-dddddddddddd',
     '33333333-3333-3333-3333-333333333333',
     10000, 'LYD', 'credit_card', 'completed', 'INV-2024-004', '2024-01-10 10:00:00+00');


-- ============================================================
--  5. PAYMENTS
-- ============================================================

INSERT INTO payments (id, user_id, investment_id, amount, currency_code,
                      method, status, transaction_id, approved_by, approved_at, created_at)
VALUES
    ('d1111111-1111-1111-1111-111111111111',
     '22222222-2222-2222-2222-222222222222',
     'c1111111-1111-1111-1111-111111111111',
     2500, 'LYD', 'wallet', 'completed', 'TXN-2024-001',
     '11111111-1111-1111-1111-111111111111', '2024-04-01 11:00:00+00',
     '2024-04-01 10:00:00+00'),

    ('d2222222-2222-2222-2222-222222222222',
     '22222222-2222-2222-2222-222222222222',
     'c2222222-2222-2222-2222-222222222222',
     5000, 'LYD', 'credit_card', 'completed', 'TXN-2024-002',
     '11111111-1111-1111-1111-111111111111', '2024-04-15 11:00:00+00',
     '2024-04-15 10:00:00+00'),

    ('d3333333-3333-3333-3333-333333333333',
     '33333333-3333-3333-3333-333333333333',
     'c3333333-3333-3333-3333-333333333333',
     1000, 'LYD', 'wallet', 'pending', 'TXN-2024-003',
     NULL, NULL, '2024-05-01 10:00:00+00');


-- ============================================================
--  6. WALLET TRANSACTIONS
-- ============================================================

INSERT INTO wallet_transactions (id, wallet_id, user_id, type, amount, currency_code,
                                  title_ar, title_en, status, reference, created_at)
SELECT
    gen_random_uuid(),
    w.id,
    w.user_id,
    tx.type,
    tx.amount,
    'LYD',
    tx.title_ar,
    tx.title_en,
    'completed',
    tx.reference,
    tx.created_at
FROM wallets w
JOIN (VALUES
    ('22222222-2222-2222-2222-222222222222'::UUID, 'credit', 45000::NUMERIC, 'إيداع رصيد',              'Wallet Deposit',                      'DEP-001',      '2024-03-01 10:00:00+00'::TIMESTAMPTZ),
    ('22222222-2222-2222-2222-222222222222'::UUID, 'debit',   2500::NUMERIC, 'دفع استثمار - منصة تقنية','Investment - Advanced Tech Platform',  'INV-2024-001', '2024-04-01 10:00:00+00'::TIMESTAMPTZ),
    ('22222222-2222-2222-2222-222222222222'::UUID, 'debit',   5000::NUMERIC, 'دفع استثمار - طاقة شمسية','Investment - Solar Energy Farm',       'INV-2024-002', '2024-04-15 10:00:00+00'::TIMESTAMPTZ),
    ('33333333-3333-3333-3333-333333333333'::UUID, 'credit', 15000::NUMERIC, 'إيداع رصيد',              'Wallet Deposit',                      'DEP-002',      '2024-01-01 10:00:00+00'::TIMESTAMPTZ),
    ('33333333-3333-3333-3333-333333333333'::UUID, 'debit',  10000::NUMERIC, 'دفع استثمار - عيادة صحية','Investment - Health Clinic',           'INV-2024-004', '2024-01-10 10:00:00+00'::TIMESTAMPTZ)
) AS tx(user_id, type, amount, title_ar, title_en, reference, created_at)
ON w.user_id = tx.user_id;


-- ============================================================
--  7. NOTIFICATIONS
-- ============================================================

-- is_read / read_at are no longer on the notifications table.
-- Read state is tracked per-user in user_notification_reads below.
INSERT INTO notifications (id, type, title_ar, title_en, message_ar, message_en,
                            target_user_id, sent_by, created_at)
VALUES
    -- Targeted: only ahmed sees this
    ('e1111111-1111-1111-1111-111111111111',
     'investment',
     'تأكيد مساهمتك', 'Investment Confirmed',
     'تمت معالجة مساهمتك في مشروع "منصة تقنية متقدمة" بنجاح.',
     'Your contribution to "Advanced Tech Platform" has been processed successfully.',
     '22222222-2222-2222-2222-222222222222',
     '11111111-1111-1111-1111-111111111111',
     NOW() - INTERVAL '2 hours'),

    -- Broadcast: target_user_id = NULL means sent to ALL users
    ('e2222222-2222-2222-2222-222222222222',
     'system',
     'مرحباً بك في Investly', 'Welcome to Investly',
     'نحن سعداء بانضمامك. ابدأ باستكشاف المشاريع المتاحة.',
     'We are glad to have you. Start exploring available projects.',
     NULL,
     '11111111-1111-1111-1111-111111111111',
     NOW() - INTERVAL '1 day'),

    -- Targeted: only ahmed sees this
    ('e3333333-3333-3333-3333-333333333333',
     'user',
     'تم التحقق من هويتك', 'Identity Verified',
     'تم الموافقة على طلب التحقق من هويتك. حسابك الآن نشط.',
     'Your identity verification has been approved. Your account is now active.',
     '22222222-2222-2222-2222-222222222222',
     '11111111-1111-1111-1111-111111111111',
     NOW() - INTERVAL '3 days');


-- ============================================================
--  7b. USER NOTIFICATION READS
--  Each row = one user's read state for one notification.
--  Broadcast notifications need one row per user to track reads.
-- ============================================================

INSERT INTO user_notification_reads
    (notification_id, user_id, is_read, read_at)
VALUES
    -- ahmed: Investment Confirmed → unread
    ('e1111111-1111-1111-1111-111111111111',
     '22222222-2222-2222-2222-222222222222',
     FALSE, NULL),

    -- ahmed: Welcome → read
    ('e2222222-2222-2222-2222-222222222222',
     '22222222-2222-2222-2222-222222222222',
     TRUE, NOW() - INTERVAL '20 hours'),

    -- sara: Welcome broadcast → unread
    ('e2222222-2222-2222-2222-222222222222',
     '33333333-3333-3333-3333-333333333333',
     FALSE, NULL),

    -- omar: Welcome broadcast → unread
    ('e2222222-2222-2222-2222-222222222222',
     '44444444-4444-4444-4444-444444444444',
     FALSE, NULL),

    -- ahmed: Identity Verified → read
    ('e3333333-3333-3333-3333-333333333333',
     '22222222-2222-2222-2222-222222222222',
     TRUE, NOW() - INTERVAL '2 days');


-- ============================================================
--  8. NOTIFICATION SETTINGS (defaults ON for all test users)
-- ============================================================

INSERT INTO notification_settings (user_id)
VALUES
    ('22222222-2222-2222-2222-222222222222'),
    ('33333333-3333-3333-3333-333333333333'),
    ('44444444-4444-4444-4444-444444444444'),
    ('55555555-5555-5555-5555-555555555555');


-- ============================================================
--  9. ACTIVITY LOGS
-- ============================================================

INSERT INTO activity_logs (id, admin_id, action, entity_type, entity_id, description, created_at)
VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'approve_kyc', 'User', '22222222-2222-2222-2222-222222222222',
     'KYC approved — passport verified',
     NOW() - INTERVAL '3 days'),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'approve_project', 'Project', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'Project approved and set to active',
     NOW() - INTERVAL '10 days'),

    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
     'suspend_user', 'User', '33333333-3333-3333-3333-333333333333',
     'Suspicious activity detected',
     NOW() - INTERVAL '2 days');


-- ============================================================
--  VERIFY — count every table after seeding
-- ============================================================
SELECT 'categories'               AS table_name, COUNT(*) AS rows FROM categories
UNION ALL SELECT 'users',                         COUNT(*) FROM users
UNION ALL SELECT 'wallets',                       COUNT(*) FROM wallets
UNION ALL SELECT 'projects',                      COUNT(*) FROM projects
UNION ALL SELECT 'investments',                   COUNT(*) FROM investments
UNION ALL SELECT 'payments',                      COUNT(*) FROM payments
UNION ALL SELECT 'wallet_transactions',           COUNT(*) FROM wallet_transactions
UNION ALL SELECT 'notifications',                 COUNT(*) FROM notifications
UNION ALL SELECT 'user_notification_reads',       COUNT(*) FROM user_notification_reads
UNION ALL SELECT 'activity_logs',                 COUNT(*) FROM activity_logs
ORDER BY table_name;

DO $$ BEGIN RAISE NOTICE 'Seed data inserted successfully.'; END $$;
