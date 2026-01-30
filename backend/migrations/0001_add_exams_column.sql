-- Migration: Add `exams` JSONB column and convert existing exam/status string columns into exams array.
-- WARNING: Review before running in production and backup your DB.

BEGIN;

-- 1) Add new column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS exams JSONB;

-- 2) Migrate existing exam enum/text columns into the new exams JSONB array
-- This assumes columns `ielts_toefl_status` and `gre_gmat_status` exist. They will be cast to text.
UPDATE profiles
SET exams = (
  SELECT jsonb_agg(x) FROM (
    SELECT * FROM (
      VALUES
        (CASE WHEN ielts_toefl_status IS NOT NULL THEN jsonb_build_object('name', 'IELTS/TOEFL', 'status', ielts_toefl_status::text) ELSE NULL END),
        (CASE WHEN gre_gmat_status IS NOT NULL THEN jsonb_build_object('name', 'GRE/GMAT', 'status', gre_gmat_status::text) ELSE NULL END)
    ) AS vals(obj)
    WHERE obj IS NOT NULL
  ) AS t(x)
)
WHERE exams IS NULL;

-- 3) Convert graduation_year and target_intake_year to integer if they are stored as text
-- Use USING to cast existing string values to integer, safely handling empty strings.
ALTER TABLE profiles
  ALTER COLUMN graduation_year TYPE integer USING (NULLIF(trim(COALESCE(graduation_year::text, '')), '')::integer),
  ALTER COLUMN target_intake_year TYPE integer USING (NULLIF(trim(COALESCE(target_intake_year::text, '')), '')::integer);

-- 4) Convert budget_min and budget_max to integer if they are stored as text
ALTER TABLE profiles
  ALTER COLUMN budget_min TYPE integer USING (NULLIF(trim(COALESCE(budget_min::text, '')), '')::integer),
  ALTER COLUMN budget_max TYPE integer USING (NULLIF(trim(COALESCE(budget_max::text, '')), '')::integer);

-- 5) Optionally drop the old exam status columns if you are confident data has been migrated
-- DROP COLUMN ielts_toefl_status;
-- DROP COLUMN gre_gmat_status;

COMMIT;

-- Alembic hint:
-- If you're using Alembic, create a new revision and in the `upgrade()`:
-- 1) op.add_column('profiles', sa.Column('exams', postgresql.JSONB(), nullable=True))
-- 2) run a small SQL to migrate values from old columns into exams (op.execute(...))
-- 3) use op.alter_column to change column types for graduation_year/target_intake_year/budget_min/budget_max
-- 4) optionally drop old columns
-- Always test locally on a copy of your DB before running in production.
