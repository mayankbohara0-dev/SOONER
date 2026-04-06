-- ============================================================
--  SOONER — Supabase Database Schema
--  Run this once in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  streak        INT  NOT NULL DEFAULT 0,
  consistency_score INT NOT NULL DEFAULT 0,
  achievements  JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. GOALS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name      TEXT NOT NULL,
  product_emoji     TEXT NOT NULL DEFAULT '🎯',
  product_color     TEXT NOT NULL DEFAULT '#0077FF',
  target_price      NUMERIC(12,2) NOT NULL,
  saved_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  monthly_amount    NUMERIC(12,2) NOT NULL,
  timeline          INT  NOT NULL,               -- months
  months_completed  INT  NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'paused', 'completed', 'purchased')),
  price_locked      BOOLEAN NOT NULL DEFAULT TRUE,
  locked_price      NUMERIC(12,2),
  reward_pct        NUMERIC(5,2) NOT NULL DEFAULT 0,
  reward_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 3. TRANSACTIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id         UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('deposit', 'reward', 'purchase', 'refund')),
  amount          NUMERIC(12,2) NOT NULL,
  note            TEXT,
  idempotency_key TEXT UNIQUE,               -- prevents duplicate deposits
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 4. AUDIT LOGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event      TEXT NOT NULL,
  meta       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ══ ROW LEVEL SECURITY (RLS) ════════════════════════════════
-- Users can only see/modify their own data

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs   ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Own profile only" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Goals
CREATE POLICY "Own goals only" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Own transactions only" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Audit logs (insert only — no reads for users)
CREATE POLICY "Insert audit log" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ══ INDEXES ═════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_goals_user_id        ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_goal_id ON public.transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id        ON public.audit_logs(user_id);
