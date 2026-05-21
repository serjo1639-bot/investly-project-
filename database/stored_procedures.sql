-- ============================================================
--  Investly Stored Procedures (Functions) — PostgreSQL
--  Run AFTER schema.sql and views.sql
--
--  PostgreSQL uses PL/pgSQL "functions" instead of SQL Server
--  "stored procedures". They work the same way from your
--  ASP.NET code — just call them with SELECT fn_name(params).
--
--  Each function runs as a single atomic transaction — if any
--  step fails, ALL steps are rolled back automatically.
-- ============================================================


-- ============================================================
--  fn_confirm_investment
--  Called when an investor confirms a payment in the app.
--
--  Steps (all or nothing):
--    1. Validate investor, project, amount, balance
--    2. Deduct amount from investor wallet
--    3. Write a WalletTransaction row (debit)
--    4. Create an Investment row
--    5. Create a Payment row
--    6. Add amount to project.raised
--    7. Increment project.investors_count (if first investment)
--
--  Returns integer result code:
--    0  = success
--    1  = investor not found
--    2  = project not found or not active
--    3  = insufficient wallet balance
--    4  = amount below minimum investment
--   -1  = unexpected database error
--
--  ASP.NET call example:
--    var result = await db.Database.ExecuteSqlRawAsync(
--        "SELECT fn_confirm_investment({0}, {1}, {2}, {3})",
--        investorId, projectId, amount, paymentMethod);
-- ============================================================
CREATE OR REPLACE FUNCTION fn_confirm_investment(
    p_investor_id    UUID,
    p_project_id     UUID,
    p_amount         NUMERIC(18,2),
    p_payment_method VARCHAR(30) DEFAULT 'wallet'
)
RETURNS INTEGER AS $$
DECLARE
    v_min_investment NUMERIC(18,2);
    v_balance        NUMERIC(18,2);
    v_investment_id  UUID := gen_random_uuid();
    v_payment_id     UUID := gen_random_uuid();
    v_transaction_id VARCHAR(100);
    v_reference      VARCHAR(50);
    v_wallet_id      UUID;
    v_title_ar       VARCHAR(200);
    v_title_en       VARCHAR(200);
BEGIN
    -- 1. Investor must exist
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_investor_id) THEN
        RETURN 1;
    END IF;

    -- 2. Project must exist and be active
    SELECT min_investment INTO v_min_investment
    FROM projects
    WHERE id = p_project_id AND status = 'active';

    IF v_min_investment IS NULL THEN
        RETURN 2;
    END IF;

    -- 3. Amount must meet minimum
    IF p_amount < v_min_investment THEN
        RETURN 4;
    END IF;

    -- 4. Wallet must have enough balance (wallet payments only)
    IF p_payment_method = 'wallet' THEN
        SELECT balance INTO v_balance
        FROM wallets WHERE user_id = p_investor_id;

        IF COALESCE(v_balance, 0) < p_amount THEN
            RETURN 3;
        END IF;
    END IF;

    -- All checks passed — generate references
    v_transaction_id := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LEFT(gen_random_uuid()::TEXT, 8);
    v_reference      := 'INV-' || TO_CHAR(NOW(), 'YYYY')     || '-' || LEFT(gen_random_uuid()::TEXT, 8);

    -- Get wallet and project title
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_investor_id;
    SELECT title_ar, title_en INTO v_title_ar, v_title_en FROM projects WHERE id = p_project_id;

    -- STEP 1: Deduct from wallet
    IF p_payment_method = 'wallet' THEN
        UPDATE wallets SET
            balance            = balance - p_amount,
            total_withdrawals  = total_withdrawals + p_amount,
            last_activity      = NOW(),
            updated_at         = NOW()
        WHERE user_id = p_investor_id;
    END IF;

    -- STEP 2: Write wallet transaction (debit)
    INSERT INTO wallet_transactions
        (id, wallet_id, user_id, type, amount, currency_code,
         title_ar, title_en, status, reference, related_payment_id)
    VALUES (
        gen_random_uuid(), v_wallet_id, p_investor_id,
        'debit', p_amount, 'LYD',
        'دفع استثمار - ' || v_title_ar,
        'Investment Payment - ' || v_title_en,
        'completed', v_reference, v_payment_id
    );

    -- STEP 3: Create investment record
    INSERT INTO investments
        (id, project_id, investor_id, amount, currency_code,
         payment_method, status, reference)
    VALUES (
        v_investment_id, p_project_id, p_investor_id,
        p_amount, 'LYD', p_payment_method, 'completed', v_reference
    );

    -- STEP 4: Create payment record
    INSERT INTO payments
        (id, user_id, investment_id, amount, currency_code,
         method, status, transaction_id)
    VALUES (
        v_payment_id, p_investor_id, v_investment_id,
        p_amount, 'LYD', p_payment_method, 'completed', v_transaction_id
    );

    -- STEP 5: Add to project fundraising total
    UPDATE projects SET
        raised     = raised + p_amount,
        updated_at = NOW()
    WHERE id = p_project_id;

    -- STEP 6: Increment investor count only if this is the investor's first investment here
    IF NOT EXISTS (
        SELECT 1 FROM investments
        WHERE project_id = p_project_id
          AND investor_id = p_investor_id
          AND id != v_investment_id
          AND status = 'completed'
    ) THEN
        UPDATE projects SET
            investors_count = investors_count + 1
        WHERE id = p_project_id;
    END IF;

    RETURN 0;  -- success

EXCEPTION WHEN OTHERS THEN
    RETURN -1;   -- unexpected DB error (caller checks for -1 and shows generic error)
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  fn_top_up_wallet
--  Adds funds to a user's wallet.
--
--  Steps:
--    1. Create wallet row if it doesn't exist
--    2. Increase wallet balance + total_deposits
--    3. Write a WalletTransaction row (credit)
--    4. Create a Payment row
--
--  Returns: new wallet balance
-- ============================================================
CREATE OR REPLACE FUNCTION fn_top_up_wallet(
    p_user_id  UUID,
    p_amount   NUMERIC(18,2),
    p_method   VARCHAR(30)  DEFAULT 'credit_card',  -- credit_card (bank card via app) or wallet (admin adjustment)
    p_reason   VARCHAR(50)  DEFAULT 'deposit',       -- deposit, bonus, refund, adjustment
    p_admin_id UUID         DEFAULT NULL
)
RETURNS NUMERIC(18,2) AS $$
DECLARE
    v_wallet_id      UUID;
    v_transaction_id VARCHAR(100);
    v_title_ar       VARCHAR(200);
    v_title_en       VARCHAR(200);
    v_new_balance    NUMERIC(18,2);
BEGIN
    -- Create wallet if this user doesn't have one yet
    IF NOT EXISTS (SELECT 1 FROM wallets WHERE user_id = p_user_id) THEN
        INSERT INTO wallets (user_id) VALUES (p_user_id);
    END IF;

    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;

    v_transaction_id := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LEFT(gen_random_uuid()::TEXT, 8);

    -- Bilingual title: bank card top-up (app flow) vs admin/other reasons
    IF p_method = 'credit_card' THEN
        v_title_ar := 'شحن عبر البطاقة البنكية';
        v_title_en := 'Bank Card Top-up';
    ELSE
        v_title_ar := CASE p_reason
            WHEN 'deposit'    THEN 'إيداع رصيد'
            WHEN 'bonus'      THEN 'مكافأة'
            WHEN 'refund'     THEN 'استرجاع دفعة'
            WHEN 'adjustment' THEN 'تعديل رصيد'
            ELSE 'إيداع'
        END;
        v_title_en := CASE p_reason
            WHEN 'deposit'    THEN 'Wallet Deposit'
            WHEN 'bonus'      THEN 'Bonus Credit'
            WHEN 'refund'     THEN 'Payment Refund'
            WHEN 'adjustment' THEN 'Balance Adjustment'
            ELSE 'Credit'
        END;
    END IF;

    -- Update wallet balance
    UPDATE wallets SET
        balance         = balance + p_amount,
        total_deposits  = total_deposits + p_amount,
        last_activity   = NOW(),
        updated_at      = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_new_balance;

    -- Write wallet transaction (credit)
    INSERT INTO wallet_transactions
        (id, wallet_id, user_id, type, amount, currency_code,
         title_ar, title_en, status)
    VALUES (
        gen_random_uuid(), v_wallet_id, p_user_id,
        'credit', p_amount, 'LYD',
        v_title_ar, v_title_en, 'completed'
    );

    -- Write payment record
    INSERT INTO payments
        (id, user_id, amount, currency_code, method, status,
         transaction_id, notes, approved_by, approved_at)
    VALUES (
        gen_random_uuid(), p_user_id, p_amount, 'LYD', p_method, 'completed',
        v_transaction_id, p_reason, p_admin_id,
        CASE WHEN p_admin_id IS NOT NULL THEN NOW() ELSE NULL END
    );

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  fn_approve_kyc
--  Admin approves a user's identity verification.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_approve_kyc(
    p_user_id  UUID,
    p_admin_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET
        kyc_status  = 'approved',
        is_verified = TRUE,
        status      = CASE WHEN status = 'pending' THEN 'active' ELSE status END,
        updated_at  = NOW()
    WHERE id = p_user_id;

    INSERT INTO activity_logs (id, admin_id, action, entity_type, entity_id, description)
    VALUES (gen_random_uuid(), p_admin_id, 'approve_kyc', 'User',
            p_user_id::TEXT, 'KYC approved — user identity verified');
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  fn_reject_kyc
--  Admin rejects a user's identity verification.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_reject_kyc(
    p_user_id  UUID,
    p_admin_id UUID,
    p_reason   VARCHAR(500) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET
        kyc_status           = 'rejected',
        kyc_rejection_reason = p_reason,
        is_verified          = FALSE,
        updated_at           = NOW()
    WHERE id = p_user_id;

    INSERT INTO activity_logs (id, admin_id, action, entity_type, entity_id, description)
    VALUES (gen_random_uuid(), p_admin_id, 'reject_kyc', 'User',
            p_user_id::TEXT, COALESCE(p_reason, 'KYC rejected by admin'));
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  fn_approve_project
--  Admin approves a pending project → sets status to active.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_approve_project(
    p_project_id UUID,
    p_admin_id   UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE projects SET
        status     = 'active',
        updated_at = NOW()
    WHERE id = p_project_id AND status = 'pending';

    INSERT INTO activity_logs (id, admin_id, action, entity_type, entity_id, description)
    VALUES (gen_random_uuid(), p_admin_id, 'approve_project', 'Project',
            p_project_id::TEXT, 'Project approved and set to active');
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  fn_reject_project
--  Admin rejects a pending project.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_reject_project(
    p_project_id UUID,
    p_admin_id   UUID,
    p_reason     VARCHAR(500) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE projects SET
        status           = 'rejected',
        rejection_reason = p_reason,
        updated_at       = NOW()
    WHERE id = p_project_id;

    INSERT INTO activity_logs (id, admin_id, action, entity_type, entity_id, description)
    VALUES (gen_random_uuid(), p_admin_id, 'reject_project', 'Project',
            p_project_id::TEXT, COALESCE(p_reason, 'Project rejected by admin'));
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  fn_refund_payment
--  Refunds a completed payment back to the user's wallet.
--
--  Steps:
--    1. Set payment status = refunded
--    2. Set investment status = cancelled
--    3. Subtract from project.raised
--    4. Credit the user's wallet
--    5. Write wallet transaction (credit)
--    6. Write activity log
-- ============================================================
CREATE OR REPLACE FUNCTION fn_refund_payment(
    p_payment_id UUID,
    p_admin_id   UUID
)
RETURNS VOID AS $$
DECLARE
    v_user_id       UUID;
    v_amount        NUMERIC(18,2);
    v_investment_id UUID;
    v_project_id    UUID;
    v_wallet_id     UUID;
BEGIN
    -- Get payment details
    SELECT user_id, amount, investment_id
    INTO   v_user_id, v_amount, v_investment_id
    FROM   payments
    WHERE  id = p_payment_id AND status = 'completed';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Payment not found or not in completed state';
    END IF;

    IF v_investment_id IS NOT NULL THEN
        SELECT project_id INTO v_project_id
        FROM investments WHERE id = v_investment_id;
    END IF;

    -- 1. Mark payment as refunded
    UPDATE payments SET
        status     = 'refunded',
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- 2. Cancel the investment
    IF v_investment_id IS NOT NULL THEN
        UPDATE investments SET
            status     = 'cancelled',
            updated_at = NOW()
        WHERE id = v_investment_id;

        -- 3. Reduce project raised amount
        UPDATE projects SET
            raised          = GREATEST(0, raised - v_amount),
            investors_count = GREATEST(0, investors_count - 1),
            updated_at      = NOW()
        WHERE id = v_project_id;
    END IF;

    -- 4. Credit wallet
    UPDATE wallets SET
        balance        = balance + v_amount,
        total_deposits = total_deposits + v_amount,
        last_activity  = NOW(),
        updated_at     = NOW()
    WHERE user_id = v_user_id;

    -- 5. Write wallet transaction (credit)
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = v_user_id;

    INSERT INTO wallet_transactions
        (id, wallet_id, user_id, type, amount, currency_code,
         title_ar, title_en, status, related_payment_id)
    VALUES (
        gen_random_uuid(), v_wallet_id, v_user_id,
        'credit', v_amount, 'LYD',
        'استرجاع دفعة', 'Payment Refund',
        'completed', p_payment_id
    );

    -- 6. Activity log
    INSERT INTO activity_logs (id, admin_id, action, entity_type, entity_id, description)
    VALUES (gen_random_uuid(), p_admin_id, 'refund_payment', 'Payment',
            p_payment_id::TEXT, 'Payment refunded to user wallet');
END;
$$ LANGUAGE plpgsql;


-- ============================================================
--  fn_suspend_user / fn_unsuspend_user / fn_ban_user
-- ============================================================
CREATE OR REPLACE FUNCTION fn_suspend_user(
    p_user_id  UUID, p_admin_id UUID, p_reason VARCHAR(500) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE users SET status = 'suspended', updated_at = NOW() WHERE id = p_user_id;
    INSERT INTO activity_logs (id, admin_id, action, entity_type, entity_id, description)
    VALUES (gen_random_uuid(), p_admin_id, 'suspend_user', 'User',
            p_user_id::TEXT, COALESCE(p_reason, 'Account suspended by admin'));
END; $$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION fn_unsuspend_user(
    p_user_id UUID, p_admin_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE users SET status = 'active', updated_at = NOW() WHERE id = p_user_id;
    INSERT INTO activity_logs (id, admin_id, action, entity_type, entity_id, description)
    VALUES (gen_random_uuid(), p_admin_id, 'unsuspend_user', 'User',
            p_user_id::TEXT, 'Account suspension lifted');
END; $$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION fn_ban_user(
    p_user_id UUID, p_admin_id UUID, p_reason VARCHAR(500) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE users   SET status = 'banned',  updated_at = NOW() WHERE id = p_user_id;
    UPDATE wallets SET status = 'frozen',  updated_at = NOW() WHERE user_id = p_user_id;
    INSERT INTO activity_logs (id, admin_id, action, entity_type, entity_id, description)
    VALUES (gen_random_uuid(), p_admin_id, 'ban_user', 'User',
            p_user_id::TEXT, COALESCE(p_reason, 'Account permanently banned'));
END; $$ LANGUAGE plpgsql;


DO $$ BEGIN RAISE NOTICE 'Stored procedures created successfully.'; END $$;
