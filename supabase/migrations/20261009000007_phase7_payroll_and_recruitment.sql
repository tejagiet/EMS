-- Migration: 20261009000007_phase7_payroll_and_recruitment
-- Description: Phase 7 Schema — Salary Structures, Payroll Runs, Payroll Records (Payslips),
--              Payroll Approval History, Job Postings, Candidates, Pipeline History,
--              Interviews, Job Offers, Transactional RPCs, and Multi-Level RLS Policies.
-- Institution: GIET Polytechnic College
-- Department: Artificial Intelligence (AI) Department
-- Batch: 2024–2027
-- Project: Employee Management System (EMS)
-- Team: T-1
-- Publisher ID: GIETP-AI-IT-EMS-T1-2026
-- Phase: 7

-- =============================================================================
-- SECTION 1: Update Notification Type Constraint to support Phase 7
-- =============================================================================

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'leave_submitted', 'leave_approved', 'leave_rejected',
    'correction_submitted', 'correction_reviewed', 'shift_assigned',
    'payroll_submitted', 'payroll_approved', 'payroll_rejected', 'payslip_ready',
    'candidate_stage_changed', 'interview_scheduled', 'offer_created', 'candidate_hired',
    'system'
  ));

-- =============================================================================
-- SECTION 2: Payroll Module Tables
-- =============================================================================

-- 2.1 Salary Structures
CREATE TABLE IF NOT EXISTS public.salary_structures (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  employee_id       UUID          NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  base_salary       NUMERIC(12,2) NOT NULL CHECK (base_salary >= 0),
  currency          TEXT          NOT NULL DEFAULT 'INR',
  payment_frequency TEXT          NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'bi_weekly', 'weekly')),
  allowances        JSONB         NOT NULL DEFAULT '[]'::jsonb,
  deductions        JSONB         NOT NULL DEFAULT '[]'::jsonb,
  effective_from    DATE          NOT NULL,
  effective_to      DATE,
  is_active         BOOLEAN       NOT NULL DEFAULT true,
  notes             TEXT,
  created_by        UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_salary_structure_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_salary_structures_org    ON public.salary_structures (organization_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_emp    ON public.salary_structures (employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_active ON public.salary_structures (is_active, effective_from);

CREATE OR REPLACE TRIGGER trg_salary_structures_set_updated_at
  BEFORE UPDATE ON public.salary_structures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.2 Payroll Runs (Monthly/Periodic Batches)
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  title             TEXT          NOT NULL,
  period_start      DATE          NOT NULL,
  period_end        DATE          NOT NULL,
  payment_date      DATE          NOT NULL,
  status            TEXT          NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled')),
  total_gross       NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_gross >= 0),
  total_deductions  NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_deductions >= 0),
  total_net         NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total_net >= 0),
  employee_count    INTEGER       NOT NULL DEFAULT 0 CHECK (employee_count >= 0),
  is_locked         BOOLEAN       NOT NULL DEFAULT false,
  prepared_by       UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  approved_by       UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payroll_runs_org_period UNIQUE (organization_id, period_start, period_end),
  CONSTRAINT chk_payroll_runs_dates CHECK (period_end >= period_start)
);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payroll_runs_org        ON public.payroll_runs (organization_id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status     ON public.payroll_runs (status);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period     ON public.payroll_runs (period_start, period_end);

CREATE OR REPLACE TRIGGER trg_payroll_runs_set_updated_at
  BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.3 Payroll Records / Payslips
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id       UUID          NOT NULL REFERENCES public.payroll_runs (id) ON DELETE CASCADE,
  organization_id      UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  employee_id          UUID          NOT NULL REFERENCES public.employees (id) ON DELETE RESTRICT,
  salary_structure_id  UUID          REFERENCES public.salary_structures (id) ON DELETE SET NULL,
  base_salary          NUMERIC(12,2) NOT NULL CHECK (base_salary >= 0),
  gross_salary         NUMERIC(12,2) NOT NULL CHECK (gross_salary >= 0),
  total_deductions     NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_deductions >= 0),
  net_salary           NUMERIC(12,2) NOT NULL CHECK (net_salary >= 0),
  allowances_breakdown JSONB         NOT NULL DEFAULT '[]'::jsonb,
  deductions_breakdown JSONB         NOT NULL DEFAULT '[]'::jsonb,
  payslip_number       TEXT          NOT NULL UNIQUE,
  payment_status       TEXT          NOT NULL DEFAULT 'pending'
                                     CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_method       TEXT          NOT NULL DEFAULT 'bank_transfer'
                                     CHECK (payment_method IN ('bank_transfer', 'cheque', 'cash')),
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payroll_record_run_emp UNIQUE (payroll_run_id, employee_id)
);

ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payroll_records_run     ON public.payroll_records (payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_emp     ON public.payroll_records (employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_org     ON public.payroll_records (organization_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_slip    ON public.payroll_records (payslip_number);

CREATE OR REPLACE TRIGGER trg_payroll_records_set_updated_at
  BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.4 Payroll Approval History & Audit Trail
CREATE TABLE IF NOT EXISTS public.payroll_approval_history (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id  UUID          NOT NULL REFERENCES public.payroll_runs (id) ON DELETE CASCADE,
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  actor_id        UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  action          TEXT          NOT NULL
                                CHECK (action IN ('created', 'submitted', 'approved', 'rejected', 'locked', 'corrected')),
  comments        TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payroll_approval_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payroll_history_run ON public.payroll_approval_history (payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_history_org ON public.payroll_approval_history (organization_id);

-- 2.5 Immutability Guard Triggers for Approved Runs
CREATE OR REPLACE FUNCTION public.enforce_payroll_run_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- If the run is already locked/approved, forbid updates to financial columns or deletion
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_locked = true AND NEW.is_locked = true THEN
      IF (NEW.total_gross IS DISTINCT FROM OLD.total_gross) OR
         (NEW.total_deductions IS DISTINCT FROM OLD.total_deductions) OR
         (NEW.total_net IS DISTINCT FROM OLD.total_net) OR
         (NEW.period_start IS DISTINCT FROM OLD.period_start) OR
         (NEW.period_end IS DISTINCT FROM OLD.period_end) THEN
        RAISE EXCEPTION 'Approved and locked payroll runs cannot be altered. Initiate an authorized correction workflow.'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_locked = true OR OLD.status = 'approved' THEN
      RAISE EXCEPTION 'Approved or locked payroll runs cannot be deleted.'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER trg_payroll_runs_immutability
  BEFORE UPDATE OR DELETE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_payroll_run_immutability();

CREATE OR REPLACE FUNCTION public.enforce_payroll_record_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_is_locked BOOLEAN;
BEGIN
  SELECT is_locked INTO v_is_locked
  FROM public.payroll_runs
  WHERE id = COALESCE(OLD.payroll_run_id, NEW.payroll_run_id);

  IF v_is_locked = true THEN
    RAISE EXCEPTION 'Payroll records belonging to locked/approved payroll runs cannot be modified or removed.'
      USING ERRCODE = 'check_violation';
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_payroll_records_immutability
  BEFORE UPDATE OR DELETE ON public.payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.enforce_payroll_record_immutability();

-- =============================================================================
-- SECTION 3: Recruitment Module Tables
-- =============================================================================

-- 3.1 Job Postings
CREATE TABLE IF NOT EXISTS public.job_postings (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  department_id     UUID          REFERENCES public.departments (id) ON DELETE SET NULL,
  designation_id    UUID          REFERENCES public.designations (id) ON DELETE SET NULL,
  hiring_manager_id UUID          REFERENCES public.employees (id) ON DELETE SET NULL,
  title             TEXT          NOT NULL,
  code              TEXT          NOT NULL,
  description       TEXT          NOT NULL,
  requirements      TEXT,
  location          TEXT          NOT NULL DEFAULT 'On-site',
  employment_type   TEXT          NOT NULL DEFAULT 'full_time'
                                  CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'probation')),
  vacancy_count     INTEGER       NOT NULL DEFAULT 1 CHECK (vacancy_count > 0),
  min_salary        NUMERIC(12,2) CHECK (min_salary IS NULL OR min_salary >= 0),
  max_salary        NUMERIC(12,2) CHECK (max_salary IS NULL OR max_salary >= 0),
  status            TEXT          NOT NULL DEFAULT 'published'
                                  CHECK (status IN ('draft', 'published', 'closed', 'on_hold')),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_job_postings_org_code UNIQUE (organization_id, code)
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_job_postings_org    ON public.job_postings (organization_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings (status);
CREATE INDEX IF NOT EXISTS idx_job_postings_dept   ON public.job_postings (department_id);

CREATE OR REPLACE TRIGGER trg_job_postings_set_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.2 Candidates
CREATE TABLE IF NOT EXISTS public.candidates (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  job_posting_id    UUID          NOT NULL REFERENCES public.job_postings (id) ON DELETE RESTRICT,
  first_name        TEXT          NOT NULL,
  last_name         TEXT          NOT NULL,
  email             TEXT          NOT NULL,
  phone             TEXT,
  stage             TEXT          NOT NULL DEFAULT 'applied'
                                  CHECK (stage IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected')),
  resume_url        TEXT,
  notes             TEXT,
  source            TEXT          DEFAULT 'direct',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_candidate_job_email UNIQUE (job_posting_id, email)
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_candidates_org   ON public.candidates (organization_id);
CREATE INDEX IF NOT EXISTS idx_candidates_job   ON public.candidates (job_posting_id);
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON public.candidates (stage);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates (email);

CREATE OR REPLACE TRIGGER trg_candidates_set_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.3 Candidate Stage History
CREATE TABLE IF NOT EXISTS public.candidate_stage_history (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID          NOT NULL REFERENCES public.candidates (id) ON DELETE CASCADE,
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  from_stage      TEXT          NOT NULL,
  to_stage        TEXT          NOT NULL,
  changed_by      UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.candidate_stage_history ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_candidate_history_cand ON public.candidate_stage_history (candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_history_org  ON public.candidate_stage_history (organization_id);

-- 3.4 Interviews
CREATE TABLE IF NOT EXISTS public.interviews (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id      UUID          NOT NULL REFERENCES public.candidates (id) ON DELETE CASCADE,
  organization_id   UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  job_posting_id    UUID          NOT NULL REFERENCES public.job_postings (id) ON DELETE RESTRICT,
  interview_type    TEXT          NOT NULL DEFAULT 'technical'
                                  CHECK (interview_type IN ('screening', 'technical', 'hr', 'management')),
  scheduled_at      TIMESTAMPTZ   NOT NULL,
  duration_minutes  INTEGER       NOT NULL DEFAULT 45 CHECK (duration_minutes > 0),
  interviewer_name  TEXT          NOT NULL,
  status            TEXT          NOT NULL DEFAULT 'scheduled'
                                  CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  rating            INTEGER       CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  feedback          TEXT,
  recommendation    TEXT          CHECK (recommendation IS NULL OR recommendation IN ('strong_hire', 'hire', 'undecided', 'reject')),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_interviews_cand ON public.interviews (candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_org  ON public.interviews (organization_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON public.interviews (scheduled_at);

CREATE OR REPLACE TRIGGER trg_interviews_set_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.5 Job Offers
CREATE TABLE IF NOT EXISTS public.job_offers (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id      UUID          NOT NULL REFERENCES public.candidates (id) ON DELETE CASCADE,
  organization_id   UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  job_posting_id    UUID          NOT NULL REFERENCES public.job_postings (id) ON DELETE RESTRICT,
  designation_id    UUID          REFERENCES public.designations (id) ON DELETE SET NULL,
  department_id     UUID          REFERENCES public.departments (id) ON DELETE SET NULL,
  offered_salary    NUMERIC(12,2) NOT NULL CHECK (offered_salary >= 0),
  joining_date      DATE          NOT NULL,
  status            TEXT          NOT NULL DEFAULT 'draft'
                                  CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'withdrawn')),
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_job_offers_cand ON public.job_offers (candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_org  ON public.job_offers (organization_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_stat ON public.job_offers (status);

CREATE OR REPLACE TRIGGER trg_job_offers_set_updated_at
  BEFORE UPDATE ON public.job_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 4: Authoritative PostgreSQL RPCs & Business Functions
-- =============================================================================

-- 4.1 Calculate / Create Payroll Run
CREATE OR REPLACE FUNCTION public.create_payroll_run(
  p_org_id UUID,
  p_title TEXT,
  p_period_start DATE,
  p_period_end DATE,
  p_payment_date DATE,
  p_preparer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run_id UUID;
  v_emp RECORD;
  v_sal RECORD;
  v_emp_count INTEGER := 0;
  v_tot_gross NUMERIC(14,2) := 0.00;
  v_tot_ded   NUMERIC(14,2) := 0.00;
  v_tot_net   NUMERIC(14,2) := 0.00;
  v_gross     NUMERIC(12,2);
  v_ded       NUMERIC(12,2);
  v_net       NUMERIC(12,2);
  v_slip_num  TEXT;
  v_period_str TEXT := TO_CHAR(p_period_start, 'YYYYMM');
BEGIN
  -- Date check
  IF p_period_end < p_period_start THEN
    RETURN jsonb_build_object('success', false, 'error', 'Period end date must be on or after start date.');
  END IF;

  -- Duplicate check for same org and period
  IF EXISTS (
    SELECT 1 FROM public.payroll_runs
    WHERE organization_id = p_org_id
      AND period_start = p_period_start
      AND period_end = p_period_end
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'A payroll run already exists for this organization and period.');
  END IF;

  -- Insert Draft Run
  INSERT INTO public.payroll_runs (
    organization_id, title, period_start, period_end, payment_date,
    status, prepared_by, created_at, updated_at
  )
  VALUES (
    p_org_id, p_title, p_period_start, p_period_end, p_payment_date,
    'draft', p_preparer_id, NOW(), NOW()
  )
  RETURNING id INTO v_run_id;

  -- Iterate through active employees
  FOR v_emp IN
    SELECT e.id, e.employee_code, e.first_name, e.last_name
    FROM public.employees e
    WHERE e.organization_id = p_org_id
      AND e.employment_status = 'active'
    ORDER BY e.employee_code ASC
  LOOP
    -- Fetch active salary structure valid for this period
    SELECT * INTO v_sal
    FROM public.salary_structures ss
    WHERE ss.organization_id = p_org_id
      AND ss.employee_id = v_emp.id
      AND ss.is_active = true
      AND ss.effective_from <= p_period_end
      AND (ss.effective_to IS NULL OR ss.effective_to >= p_period_start)
    ORDER BY ss.effective_from DESC
    LIMIT 1;

    IF v_sal.id IS NOT NULL THEN
      -- Calculate Gross = base_salary + sum of allowances
      DECLARE
        v_allowance_sum NUMERIC(12,2) := 0.00;
        v_deduction_sum NUMERIC(12,2) := 0.00;
        v_elem JSONB;
      BEGIN
        FOR v_elem IN SELECT * FROM jsonb_array_elements(v_sal.allowances)
        LOOP
          v_allowance_sum := v_allowance_sum + COALESCE((v_elem->>'amount')::numeric, 0.00);
        END LOOP;

        FOR v_elem IN SELECT * FROM jsonb_array_elements(v_sal.deductions)
        LOOP
          v_deduction_sum := v_deduction_sum + COALESCE((v_elem->>'amount')::numeric, 0.00);
        END LOOP;

        v_gross := ROUND(v_sal.base_salary + v_allowance_sum, 2);
        v_ded   := ROUND(v_deduction_sum, 2);
        v_net   := GREATEST(0.00, ROUND(v_gross - v_ded, 2));

        v_slip_num := 'PS-' || v_period_str || '-' || v_emp.employee_code;

        -- Insert line item
        INSERT INTO public.payroll_records (
          payroll_run_id, organization_id, employee_id, salary_structure_id,
          base_salary, gross_salary, total_deductions, net_salary,
          allowances_breakdown, deductions_breakdown, payslip_number,
          payment_status, payment_method, created_at, updated_at
        )
        VALUES (
          v_run_id, p_org_id, v_emp.id, v_sal.id,
          v_sal.base_salary, v_gross, v_ded, v_net,
          v_sal.allowances, v_sal.deductions, v_slip_num,
          'pending', 'bank_transfer', NOW(), NOW()
        );

        v_emp_count := v_emp_count + 1;
        v_tot_gross := v_tot_gross + v_gross;
        v_tot_ded   := v_tot_ded + v_ded;
        v_tot_net   := v_tot_net + v_net;
      END;
    END IF;
  END LOOP;

  -- Update run totals
  UPDATE public.payroll_runs
  SET total_gross = v_tot_gross,
      total_deductions = v_tot_ded,
      total_net = v_tot_net,
      employee_count = v_emp_count,
      updated_at = NOW()
  WHERE id = v_run_id;

  -- Audit history
  INSERT INTO public.payroll_approval_history (
    payroll_run_id, organization_id, actor_id, action, comments
  )
  VALUES (
    v_run_id, p_org_id, p_preparer_id, 'created',
    'Payroll run created with ' || v_emp_count || ' eligible employees.'
  );

  RETURN jsonb_build_object(
    'success', true,
    'payroll_run_id', v_run_id,
    'employee_count', v_emp_count,
    'total_gross', v_tot_gross,
    'total_net', v_tot_net
  );
END;
$$;

-- 4.2 Process Payroll Run Decision (Submit, Approve, Reject, Correct)
CREATE OR REPLACE FUNCTION public.process_payroll_run_decision(
  p_run_id UUID,
  p_decision TEXT,
  p_actor_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run RECORD;
  v_rec RECORD;
  v_prof_id UUID;
BEGIN
  SELECT * INTO v_run
  FROM public.payroll_runs
  WHERE id = p_run_id;

  IF v_run.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payroll run not found.');
  END IF;

  IF p_decision = 'submit' THEN
    IF v_run.status != 'draft' AND v_run.status != 'rejected' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only draft or rejected runs can be submitted for approval.');
    END IF;

    UPDATE public.payroll_runs
    SET status = 'pending_approval',
        rejection_reason = NULL,
        updated_at = NOW()
    WHERE id = p_run_id;

    INSERT INTO public.payroll_approval_history (payroll_run_id, organization_id, actor_id, action, comments)
    VALUES (p_run_id, v_run.organization_id, p_actor_id, 'submitted', p_notes);

  ELSIF p_decision = 'approve' THEN
    IF v_run.status != 'pending_approval' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only pending runs can be approved.');
    END IF;

    -- Freeze and lock run
    UPDATE public.payroll_runs
    SET status = 'approved',
        is_locked = true,
        approved_by = p_actor_id,
        approved_at = NOW(),
        updated_at = NOW()
    WHERE id = p_run_id;

    INSERT INTO public.payroll_approval_history (payroll_run_id, organization_id, actor_id, action, comments)
    VALUES (p_run_id, v_run.organization_id, p_actor_id, 'approved', p_notes);

    -- Dispatch payslip_ready notification to each employee profile
    FOR v_rec IN
      SELECT pr.id, pr.payslip_number, e.profile_id
      FROM public.payroll_records pr
      JOIN public.employees e ON e.id = pr.employee_id
      WHERE pr.payroll_run_id = p_run_id AND e.profile_id IS NOT NULL
    LOOP
      INSERT INTO public.notifications (
        organization_id, recipient_profile_id, title, message, type, link
      )
      VALUES (
        v_run.organization_id,
        v_rec.profile_id,
        'Payslip Published',
        'Your payslip (' || v_rec.payslip_number || ') for ' || v_run.title || ' is now available.',
        'payslip_ready',
        '/portal/employee#payslips'
      );
    END LOOP;

  ELSIF p_decision = 'reject' THEN
    IF v_run.status != 'pending_approval' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Only pending runs can be rejected.');
    END IF;

    IF p_notes IS NULL OR TRIM(p_notes) = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Rejection reason is required.');
    END IF;

    UPDATE public.payroll_runs
    SET status = 'rejected',
        rejection_reason = p_notes,
        updated_at = NOW()
    WHERE id = p_run_id;

    INSERT INTO public.payroll_approval_history (payroll_run_id, organization_id, actor_id, action, comments)
    VALUES (p_run_id, v_run.organization_id, p_actor_id, 'rejected', p_notes);

  ELSIF p_decision = 'correct' THEN
    -- Audited unlock for authorized corrections
    IF p_notes IS NULL OR TRIM(p_notes) = '' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Correction justification is required.');
    END IF;

    UPDATE public.payroll_runs
    SET is_locked = false,
        status = 'draft',
        updated_at = NOW()
    WHERE id = p_run_id;

    INSERT INTO public.payroll_approval_history (payroll_run_id, organization_id, actor_id, action, comments)
    VALUES (p_run_id, v_run.organization_id, p_actor_id, 'corrected', p_notes);

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid payroll decision action.');
  END IF;

  RETURN jsonb_build_object('success', true, 'status', p_decision);
END;
$$;

-- 4.3 Candidate Stage Transition Workflow
CREATE OR REPLACE FUNCTION public.transition_candidate_stage(
  p_candidate_id UUID,
  p_to_stage TEXT,
  p_actor_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cand RECORD;
  v_valid BOOLEAN := false;
BEGIN
  SELECT * INTO v_cand
  FROM public.candidates
  WHERE id = p_candidate_id;

  IF v_cand.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Candidate record not found.');
  END IF;

  -- Valid transition paths:
  -- applied -> screening, rejected
  -- screening -> interview, rejected
  -- interview -> offer, rejected
  -- offer -> hired, rejected
  -- any -> rejected (allowed at any point)
  IF p_to_stage = 'rejected' THEN
    v_valid := (v_cand.stage != 'hired'); -- Cannot reject after already hired
  ELSIF v_cand.stage = 'applied' AND p_to_stage = 'screening' THEN
    v_valid := true;
  ELSIF v_cand.stage = 'screening' AND p_to_stage = 'interview' THEN
    v_valid := true;
  ELSIF v_cand.stage = 'interview' AND p_to_stage = 'offer' THEN
    v_valid := true;
  ELSIF v_cand.stage = 'offer' AND p_to_stage = 'hired' THEN
    v_valid := true;
  END IF;

  IF NOT v_valid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid stage transition from ' || v_cand.stage || ' to ' || p_to_stage || '.'
    );
  END IF;

  -- Update candidate stage
  UPDATE public.candidates
  SET stage = p_to_stage,
      updated_at = NOW()
  WHERE id = p_candidate_id;

  -- Record audit history
  INSERT INTO public.candidate_stage_history (
    candidate_id, organization_id, from_stage, to_stage, changed_by, notes
  )
  VALUES (
    p_candidate_id, v_cand.organization_id, v_cand.stage, p_to_stage, p_actor_id, p_notes
  );

  RETURN jsonb_build_object(
    'success', true,
    'candidate_id', p_candidate_id,
    'from_stage', v_cand.stage,
    'to_stage', p_to_stage
  );
END;
$$;

-- 4.4 Hire Candidate and Handoff to Employee Onboarding (Atomic & Idempotent)
CREATE OR REPLACE FUNCTION public.hire_candidate_to_employee(
  p_candidate_id UUID,
  p_branch_id UUID,
  p_actor_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cand RECORD;
  v_offer RECORD;
  v_existing_emp RECORD;
  v_emp_code TEXT;
  v_new_emp_id UUID;
  v_emp_count INTEGER;
  v_base_sal NUMERIC(12,2);
  v_hra NUMERIC(12,2);
  v_special NUMERIC(12,2);
  v_pf NUMERIC(12,2);
  v_allowances JSONB;
  v_deductions JSONB;
BEGIN
  -- 1. Fetch candidate
  SELECT * INTO v_cand
  FROM public.candidates
  WHERE id = p_candidate_id;

  IF v_cand.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Candidate not found.');
  END IF;

  IF v_cand.stage = 'hired' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Candidate is already marked as hired.');
  END IF;

  -- 2. Fetch accepted offer
  SELECT * INTO v_offer
  FROM public.job_offers
  WHERE candidate_id = p_candidate_id
    AND status = 'accepted'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_offer.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'An accepted job offer is required before hiring candidate.');
  END IF;

  -- 3. Idempotency Check: Prevent duplicate employee with same work email in organization
  SELECT id, employee_code INTO v_existing_emp
  FROM public.employees
  WHERE organization_id = v_cand.organization_id
    AND LOWER(work_email) = LOWER(v_cand.email);

  IF v_existing_emp.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'An employee with email ' || v_cand.email || ' already exists (' || v_existing_emp.employee_code || ').'
    );
  END IF;

  -- 4. Generate next employee code (Format: EMP000X)
  SELECT COUNT(*) + 1 INTO v_emp_count
  FROM public.employees
  WHERE organization_id = v_cand.organization_id;

  v_emp_code := 'EMP' || LPAD(v_emp_count::text, 4, '0');

  -- Ensure code uniqueness
  WHILE EXISTS (SELECT 1 FROM public.employees WHERE organization_id = v_cand.organization_id AND employee_code = v_emp_code) LOOP
    v_emp_count := v_emp_count + 1;
    v_emp_code := 'EMP' || LPAD(v_emp_count::text, 4, '0');
  END LOOP;

  -- 5. Insert new Employee
  INSERT INTO public.employees (
    organization_id, branch_id, department_id, designation_id,
    employee_code, employment_type, employment_status,
    date_of_joining, work_email, work_phone,
    first_name, last_name, is_active,
    created_at, updated_at
  )
  VALUES (
    v_cand.organization_id, p_branch_id, v_offer.department_id, v_offer.designation_id,
    v_emp_code, 'full_time', 'active',
    v_offer.joining_date, v_cand.email, v_cand.phone,
    v_cand.first_name, v_cand.last_name, true,
    NOW(), NOW()
  )
  RETURNING id INTO v_new_emp_id;

  -- 6. Setup initial Salary Structure from offer compensation
  v_base_sal := ROUND(v_offer.offered_salary * 0.50, 2);
  v_hra      := ROUND(v_offer.offered_salary * 0.30, 2);
  v_special  := ROUND(v_offer.offered_salary * 0.20, 2);
  v_pf       := ROUND(v_base_sal * 0.12, 2);

  v_allowances := jsonb_build_array(
    jsonb_build_object('code', 'HRA', 'name', 'House Rent Allowance', 'amount', v_hra, 'type', 'fixed'),
    jsonb_build_object('code', 'SPECIAL', 'name', 'Special Allowance', 'amount', v_special, 'type', 'fixed')
  );

  v_deductions := jsonb_build_array(
    jsonb_build_object('code', 'PF', 'name', 'Provident Fund', 'amount', v_pf, 'type', 'fixed'),
    jsonb_build_object('code', 'PT', 'name', 'Professional Tax', 'amount', 200.00, 'type', 'fixed')
  );

  INSERT INTO public.salary_structures (
    organization_id, employee_id, base_salary, currency,
    payment_frequency, allowances, deductions,
    effective_from, is_active, notes, created_by,
    created_at, updated_at
  )
  VALUES (
    v_cand.organization_id, v_new_emp_id, v_base_sal, 'INR',
    'monthly', v_allowances, v_deductions,
    v_offer.joining_date, true, 'Initial structure created from accepted offer.', p_actor_id,
    NOW(), NOW()
  );

  -- 7. Update candidate stage to 'hired'
  UPDATE public.candidates
  SET stage = 'hired',
      updated_at = NOW()
  WHERE id = p_candidate_id;

  -- 8. Record stage history
  INSERT INTO public.candidate_stage_history (
    candidate_id, organization_id, from_stage, to_stage, changed_by, notes
  )
  VALUES (
    p_candidate_id, v_cand.organization_id, v_cand.stage, 'hired', p_actor_id,
    COALESCE(p_notes, 'Hired and successfully onboarded as employee ' || v_emp_code)
  );

  -- 9. Insert Notification for HR
  INSERT INTO public.notifications (
    organization_id, recipient_profile_id, title, message, type, link
  )
  SELECT
    v_cand.organization_id,
    p.id,
    'Candidate Onboarded',
    v_cand.first_name || ' ' || v_cand.last_name || ' has been hired as ' || v_emp_code || '.',
    'candidate_hired',
    '/portal/hr/employees/' || v_new_emp_id
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.profile_id = p.id
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.organization_id = v_cand.organization_id
    AND r.code IN ('hr_manager', 'super_admin', 'org_admin')
  LIMIT 5;

  RETURN jsonb_build_object(
    'success', true,
    'employee_id', v_new_emp_id,
    'employee_code', v_emp_code,
    'joining_date', v_offer.joining_date
  );
END;
$$;

-- =============================================================================
-- SECTION 5: Granular Row Level Security (RLS) Policies
-- =============================================================================

-- 5.1 salary_structures
CREATE POLICY salary_structures_select ON public.salary_structures
  FOR SELECT USING (
    (public.is_org_member(organization_id) AND public.has_permission('payroll.read'))
    OR
    (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()))
  );

CREATE POLICY salary_structures_insert ON public.salary_structures
  FOR INSERT WITH CHECK (
    public.is_org_member(organization_id) AND public.has_permission('payroll.write')
  );

CREATE POLICY salary_structures_update ON public.salary_structures
  FOR UPDATE USING (
    public.is_org_member(organization_id) AND public.has_permission('payroll.write')
  );

-- 5.2 payroll_runs
CREATE POLICY payroll_runs_select ON public.payroll_runs
  FOR SELECT USING (
    public.is_org_member(organization_id) AND public.has_permission('payroll.read')
  );

CREATE POLICY payroll_runs_insert ON public.payroll_runs
  FOR INSERT WITH CHECK (
    public.is_org_member(organization_id) AND public.has_permission('payroll.write')
  );

CREATE POLICY payroll_runs_update ON public.payroll_runs
  FOR UPDATE USING (
    public.is_org_member(organization_id) AND
    (public.has_permission('payroll.write') OR public.has_permission('payroll.approve'))
  );

-- 5.3 payroll_records
CREATE POLICY payroll_records_select ON public.payroll_records
  FOR SELECT USING (
    (public.is_org_member(organization_id) AND public.has_permission('payroll.read'))
    OR
    (employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid()))
  );

CREATE POLICY payroll_records_insert ON public.payroll_records
  FOR INSERT WITH CHECK (
    public.is_org_member(organization_id) AND public.has_permission('payroll.write')
  );

-- 5.4 payroll_approval_history
CREATE POLICY payroll_history_select ON public.payroll_approval_history
  FOR SELECT USING (
    public.is_org_member(organization_id) AND public.has_permission('payroll.read')
  );

CREATE POLICY payroll_history_insert ON public.payroll_approval_history
  FOR INSERT WITH CHECK (
    public.is_org_member(organization_id) AND
    (public.has_permission('payroll.write') OR public.has_permission('payroll.approve'))
  );

-- 5.5 job_postings
CREATE POLICY job_postings_select ON public.job_postings
  FOR SELECT USING (
    public.is_org_member(organization_id)
  );

CREATE POLICY job_postings_insert ON public.job_postings
  FOR INSERT WITH CHECK (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.write')
  );

CREATE POLICY job_postings_update ON public.job_postings
  FOR UPDATE USING (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.write')
  );

CREATE POLICY job_postings_delete ON public.job_postings
  FOR DELETE USING (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.write')
  );

-- 5.6 candidates
CREATE POLICY candidates_select ON public.candidates
  FOR SELECT USING (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.read')
  );

CREATE POLICY candidates_insert ON public.candidates
  FOR INSERT WITH CHECK (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.write')
  );

CREATE POLICY candidates_update ON public.candidates
  FOR UPDATE USING (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.write')
  );

-- 5.7 candidate_stage_history
CREATE POLICY candidate_history_select ON public.candidate_stage_history
  FOR SELECT USING (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.read')
  );

CREATE POLICY candidate_history_insert ON public.candidate_stage_history
  FOR INSERT WITH CHECK (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.write')
  );

-- 5.8 interviews
CREATE POLICY interviews_select ON public.interviews
  FOR SELECT USING (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.read')
  );

CREATE POLICY interviews_insert ON public.interviews
  FOR INSERT WITH CHECK (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.write')
  );

CREATE POLICY interviews_update ON public.interviews
  FOR UPDATE USING (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.write')
  );

-- 5.9 job_offers
CREATE POLICY job_offers_select ON public.job_offers
  FOR SELECT USING (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.read')
  );

CREATE POLICY job_offers_insert ON public.job_offers
  FOR INSERT WITH CHECK (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.write')
  );

CREATE POLICY job_offers_update ON public.job_offers
  FOR UPDATE USING (
    public.is_org_member(organization_id) AND public.has_permission('recruitment.write')
  );

-- Grant RPC execution
GRANT EXECUTE ON FUNCTION public.create_payroll_run(UUID, TEXT, DATE, DATE, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payroll_run_decision(UUID, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_candidate_stage(UUID, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hire_candidate_to_employee(UUID, UUID, UUID, TEXT) TO authenticated;
