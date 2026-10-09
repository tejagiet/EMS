-- Migration: 20261009000008_phase8_operations_and_talent
-- Description: Phase 8 Schema — Onboarding, Offboarding, Performance Management,
--              Employee Tasks, IT Assets, Documents, Announcements, and Shared Approvals.
-- Institution: GIET Polytechnic College
-- Department: Artificial Intelligence (AI) Department
-- Batch: 2024–2027
-- Project: Employee Management System (EMS)
-- Team: T-1
-- Publisher ID: GIETP-AI-IT-EMS-T1-2026
-- Phase: 8

-- =============================================================================
-- SECTION 1: Update Notification Type Constraint to support Phase 8
-- =============================================================================

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'leave_submitted', 'leave_approved', 'leave_rejected',
    'correction_submitted', 'correction_reviewed', 'shift_assigned',
    'payroll_submitted', 'payroll_approved', 'payroll_rejected', 'payslip_ready',
    'candidate_stage_changed', 'interview_scheduled', 'offer_created', 'candidate_hired',
    'onboarding_task_assigned', 'onboarding_completed',
    'offboarding_initiated', 'offboarding_approved', 'offboarding_completed',
    'asset_assigned', 'asset_return_requested',
    'performance_review_assigned', 'performance_review_completed',
    'task_assigned', 'task_overdue', 'document_verified',
    'announcement_published', 'approval_requested', 'approval_decided',
    'system'
  ));

-- =============================================================================
-- SECTION 2: Employee Onboarding Module
-- =============================================================================

-- 2.1 Reusable Onboarding Checklist Templates
CREATE TABLE IF NOT EXISTS public.onboarding_checklist_templates (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name            TEXT          NOT NULL,
  description     TEXT,
  is_default      BOOLEAN       NOT NULL DEFAULT false,
  items           JSONB         NOT NULL DEFAULT '[]'::jsonb,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.onboarding_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_templates_org ON public.onboarding_checklist_templates (organization_id);

CREATE OR REPLACE TRIGGER trg_onboarding_templates_set_updated_at
  BEFORE UPDATE ON public.onboarding_checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.2 Onboarding Cases (Unique per employee)
CREATE TABLE IF NOT EXISTS public.onboarding_cases (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  employee_id           UUID          NOT NULL REFERENCES public.employees (id) ON DELETE RESTRICT,
  candidate_id          UUID          REFERENCES public.candidates (id) ON DELETE SET NULL,
  joining_date          DATE          NOT NULL,
  department_id         UUID          REFERENCES public.departments (id) ON DELETE SET NULL,
  designation_id        UUID          REFERENCES public.designations (id) ON DELETE SET NULL,
  branch_id             UUID          REFERENCES public.branches (id) ON DELETE SET NULL,
  reporting_manager_id  UUID          REFERENCES public.employees (id) ON DELETE SET NULL,
  status                TEXT          NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending', 'in_progress', 'awaiting_review', 'completed', 'cancelled')),
  notes                 TEXT,
  created_by            UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  completed_at          TIMESTAMPTZ,
  completed_by          UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  cancelled_at          TIMESTAMPTZ,
  cancelled_by          UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  cancellation_reason   TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_onboarding_cases_emp UNIQUE (organization_id, employee_id)
);

ALTER TABLE public.onboarding_cases ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_cases_org  ON public.onboarding_cases (organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_emp  ON public.onboarding_cases (employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_stat ON public.onboarding_cases (status);

CREATE OR REPLACE TRIGGER trg_onboarding_cases_set_updated_at
  BEFORE UPDATE ON public.onboarding_cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2.3 Onboarding Checklist Tasks
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  case_id         UUID          NOT NULL REFERENCES public.onboarding_cases (id) ON DELETE CASCADE,
  title           TEXT          NOT NULL,
  description     TEXT,
  category        TEXT          NOT NULL DEFAULT 'general'
                                CHECK (category IN ('general', 'documentation', 'it_setup', 'training', 'hr', 'manager')),
  assigned_role   TEXT          NOT NULL DEFAULT 'hr'
                                CHECK (assigned_role IN ('hr', 'it', 'manager', 'employee')),
  assigned_to     UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  due_date        DATE,
  is_required     BOOLEAN       NOT NULL DEFAULT true,
  status          TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at    TIMESTAMPTZ,
  completed_by    UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_case ON public.onboarding_tasks (case_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_org  ON public.onboarding_tasks (organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_stat ON public.onboarding_tasks (status);

CREATE OR REPLACE TRIGGER trg_onboarding_tasks_set_updated_at
  BEFORE UPDATE ON public.onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 3: Employee Offboarding Module
-- =============================================================================

-- 3.1 Offboarding Cases
CREATE TABLE IF NOT EXISTS public.offboarding_cases (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  employee_id           UUID          NOT NULL REFERENCES public.employees (id) ON DELETE RESTRICT,
  initiated_by          UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  exit_type             TEXT          NOT NULL DEFAULT 'resignation'
                                      CHECK (exit_type IN ('resignation', 'termination', 'contract_end', 'retirement')),
  reason                TEXT          NOT NULL,
  last_working_date     DATE          NOT NULL,
  notice_period_days    INTEGER       NOT NULL DEFAULT 30,
  status                TEXT          NOT NULL DEFAULT 'requested'
                                      CHECK (status IN ('requested', 'under_review', 'approved', 'in_progress', 'clearance_pending', 'completed', 'rejected', 'cancelled')),
  manager_approved      BOOLEAN,
  manager_approved_by   UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  manager_approved_at   TIMESTAMPTZ,
  hr_approved           BOOLEAN,
  hr_approved_by        UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  hr_approved_at        TIMESTAMPTZ,
  exit_interview_notes  TEXT,
  account_deactivated   BOOLEAN       NOT NULL DEFAULT false,
  deactivated_at        TIMESTAMPTZ,
  rejection_reason      TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_offboarding_cases_emp UNIQUE (organization_id, employee_id)
);

ALTER TABLE public.offboarding_cases ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_offboarding_cases_org ON public.offboarding_cases (organization_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_cases_emp ON public.offboarding_cases (employee_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_cases_stat ON public.offboarding_cases (status);

CREATE OR REPLACE TRIGGER trg_offboarding_cases_set_updated_at
  BEFORE UPDATE ON public.offboarding_cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.2 Offboarding Clearance Checklist Items
CREATE TABLE IF NOT EXISTS public.offboarding_clearance_items (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  case_id         UUID          NOT NULL REFERENCES public.offboarding_cases (id) ON DELETE CASCADE,
  department_type TEXT          NOT NULL CHECK (department_type IN ('it', 'finance', 'hr', 'department', 'admin')),
  item_name       TEXT          NOT NULL,
  status          TEXT          NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'cleared', 'flagged')),
  cleared_by      UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  cleared_at      TIMESTAMPTZ,
  comments        TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.offboarding_clearance_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_offboarding_items_case ON public.offboarding_clearance_items (case_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_items_org  ON public.offboarding_clearance_items (organization_id);

CREATE OR REPLACE TRIGGER trg_offboarding_items_set_updated_at
  BEFORE UPDATE ON public.offboarding_clearance_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 4: Performance Management Module
-- =============================================================================

-- 4.1 Performance Cycles
CREATE TABLE IF NOT EXISTS public.performance_cycles (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  title           TEXT          NOT NULL,
  start_date      DATE          NOT NULL,
  end_date        DATE          NOT NULL,
  status          TEXT          NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'active', 'in_review', 'completed', 'closed')),
  description     TEXT,
  created_by      UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.performance_cycles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_perf_cycles_org ON public.performance_cycles (organization_id);

CREATE OR REPLACE TRIGGER trg_perf_cycles_set_updated_at
  BEFORE UPDATE ON public.performance_cycles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4.2 Performance Goals & Measurable Objectives
CREATE TABLE IF NOT EXISTS public.performance_goals (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  cycle_id         UUID          NOT NULL REFERENCES public.performance_cycles (id) ON DELETE CASCADE,
  employee_id      UUID          NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  title            TEXT          NOT NULL,
  description      TEXT,
  weight           NUMERIC(5,2)  NOT NULL DEFAULT 20.00 CHECK (weight >= 0 AND weight <= 100),
  target_date      DATE,
  progress_percent INTEGER       NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  status           TEXT          NOT NULL DEFAULT 'in_progress'
                                 CHECK (status IN ('not_started', 'in_progress', 'achieved', 'partially_achieved', 'missed')),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.performance_goals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_perf_goals_emp ON public.performance_goals (employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_goals_cyc ON public.performance_goals (cycle_id);

CREATE OR REPLACE TRIGGER trg_perf_goals_set_updated_at
  BEFORE UPDATE ON public.performance_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4.3 Performance Reviews & Appraisals
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  cycle_id               UUID          NOT NULL REFERENCES public.performance_cycles (id) ON DELETE CASCADE,
  employee_id            UUID          NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  reviewer_employee_id   UUID          REFERENCES public.employees (id) ON DELETE SET NULL,
  status                 TEXT          NOT NULL DEFAULT 'draft'
                                       CHECK (status IN ('draft', 'self_assessment', 'manager_review', 'awaiting_acknowledgement', 'completed')),
  self_rating            NUMERIC(3,2)  CHECK (self_rating IS NULL OR (self_rating >= 1.0 AND self_rating <= 5.0)),
  self_feedback          TEXT,
  self_submitted_at      TIMESTAMPTZ,
  manager_rating         NUMERIC(3,2)  CHECK (manager_rating IS NULL OR (manager_rating >= 1.0 AND manager_rating <= 5.0)),
  manager_feedback       TEXT,
  competencies_score     NUMERIC(3,2)  CHECK (competencies_score IS NULL OR (competencies_score >= 1.0 AND competencies_score <= 5.0)),
  manager_submitted_at   TIMESTAMPTZ,
  employee_acknowledged  BOOLEAN       NOT NULL DEFAULT false,
  employee_acknowledged_at TIMESTAMPTZ,
  employee_comments      TEXT,
  is_locked              BOOLEAN       NOT NULL DEFAULT false,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_perf_reviews_cyc_emp UNIQUE (cycle_id, employee_id)
);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_perf_reviews_emp ON public.performance_reviews (employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_reviews_rev ON public.performance_reviews (reviewer_employee_id);

CREATE OR REPLACE TRIGGER trg_perf_reviews_set_updated_at
  BEFORE UPDATE ON public.performance_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 5: Employee Tasks Module
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.employee_tasks (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  title                TEXT          NOT NULL,
  description          TEXT,
  creator_id           UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  assignee_id          UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  related_employee_id  UUID          REFERENCES public.employees (id) ON DELETE SET NULL,
  workflow_type        TEXT          NOT NULL DEFAULT 'general'
                                     CHECK (workflow_type IN ('general', 'onboarding', 'offboarding', 'it', 'hr', 'compliance')),
  priority             TEXT          NOT NULL DEFAULT 'medium'
                                     CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status               TEXT          NOT NULL DEFAULT 'open'
                                     CHECK (status IN ('open', 'in_progress', 'blocked', 'completed', 'cancelled')),
  start_date           DATE,
  due_date             DATE,
  completed_at         TIMESTAMPTZ,
  completion_evidence  TEXT,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.employee_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tasks_org      ON public.employee_tasks (organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.employee_tasks (assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_creator  ON public.employee_tasks (creator_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stat     ON public.employee_tasks (status);

CREATE OR REPLACE TRIGGER trg_tasks_set_updated_at
  BEFORE UPDATE ON public.employee_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5.2 Task Activity Log
CREATE TABLE IF NOT EXISTS public.task_activity_log (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID          NOT NULL REFERENCES public.employee_tasks (id) ON DELETE CASCADE,
  actor_id    UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  action      TEXT          NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.task_activity_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_log_task ON public.task_activity_log (task_id);

-- =============================================================================
-- SECTION 6: IT Asset Management Module
-- =============================================================================

-- 6.1 Assets Inventory
CREATE TABLE IF NOT EXISTS public.assets (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  asset_tag       TEXT          NOT NULL UNIQUE,
  serial_number   TEXT,
  name            TEXT          NOT NULL,
  category        TEXT          NOT NULL
                                CHECK (category IN ('laptop', 'desktop', 'monitor', 'mobile', 'network', 'software', 'peripherals', 'other')),
  manufacturer    TEXT,
  model           TEXT,
  purchase_date   DATE,
  warranty_expiry DATE,
  location        TEXT          NOT NULL DEFAULT 'Main Campus',
  status          TEXT          NOT NULL DEFAULT 'available'
                                CHECK (status IN ('available', 'assigned', 'under_maintenance', 'lost', 'damaged', 'retired')),
  condition       TEXT          NOT NULL DEFAULT 'good'
                                CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  specifications  JSONB         NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_assets_org  ON public.assets (organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_cat  ON public.assets (category);
CREATE INDEX IF NOT EXISTS idx_assets_stat ON public.assets (status);

CREATE OR REPLACE TRIGGER trg_assets_set_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6.2 Asset Assignments & History
CREATE TABLE IF NOT EXISTS public.asset_assignments (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  asset_id            UUID          NOT NULL REFERENCES public.assets (id) ON DELETE RESTRICT,
  employee_id         UUID          NOT NULL REFERENCES public.employees (id) ON DELETE RESTRICT,
  assigned_by         UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  assigned_date       DATE          NOT NULL,
  return_due_date     DATE,
  returned_date       DATE,
  returned_condition  TEXT,
  is_active           BOOLEAN       NOT NULL DEFAULT true,
  notes               TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_asset_assign_asset ON public.asset_assignments (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assign_emp   ON public.asset_assignments (employee_id);
CREATE INDEX IF NOT EXISTS idx_asset_assign_act   ON public.asset_assignments (is_active);

CREATE OR REPLACE TRIGGER trg_asset_assignments_set_updated_at
  BEFORE UPDATE ON public.asset_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6.3 Asset Maintenance Records
CREATE TABLE IF NOT EXISTS public.asset_maintenance (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  asset_id         UUID          NOT NULL REFERENCES public.assets (id) ON DELETE CASCADE,
  maintenance_type TEXT          NOT NULL CHECK (maintenance_type IN ('repair', 'upgrade', 'inspection', 'cleaning')),
  service_provider TEXT,
  cost             NUMERIC(10,2) DEFAULT 0.00,
  start_date       DATE          NOT NULL,
  end_date         DATE,
  status           TEXT          NOT NULL DEFAULT 'in_progress' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  notes            TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_asset_maint_asset ON public.asset_maintenance (asset_id);

CREATE OR REPLACE TRIGGER trg_asset_maintenance_set_updated_at
  BEFORE UPDATE ON public.asset_maintenance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 7: Document Management Module
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  employee_id         UUID          REFERENCES public.employees (id) ON DELETE SET NULL,
  title               TEXT          NOT NULL,
  category            TEXT          NOT NULL
                                    CHECK (category IN ('identification', 'academic', 'employment_contract', 'payroll_tax', 'certification', 'policy', 'performance', 'medical', 'other')),
  description         TEXT,
  file_path           TEXT          NOT NULL,
  file_name           TEXT          NOT NULL,
  file_size_bytes     INTEGER       NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400),
  mime_type           TEXT          NOT NULL,
  uploaded_by         UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  expiry_date         DATE,
  verification_status TEXT          NOT NULL DEFAULT 'pending'
                                    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by         UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  verified_at         TIMESTAMPTZ,
  is_confidential     BOOLEAN       NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_docs_org  ON public.documents (organization_id);
CREATE INDEX IF NOT EXISTS idx_docs_emp  ON public.documents (employee_id);
CREATE INDEX IF NOT EXISTS idx_docs_cat  ON public.documents (category);
CREATE INDEX IF NOT EXISTS idx_docs_stat ON public.documents (verification_status);

CREATE OR REPLACE TRIGGER trg_documents_set_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 8: Announcements Module
-- =============================================================================

-- 8.1 Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  title           TEXT          NOT NULL,
  body            TEXT          NOT NULL,
  author_id       UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  status          TEXT          NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'published', 'archived')),
  target_type     TEXT          NOT NULL DEFAULT 'all'
                                CHECK (target_type IN ('all', 'department', 'branch', 'role')),
  target_id       TEXT,
  priority        TEXT          NOT NULL DEFAULT 'normal'
                                CHECK (priority IN ('normal', 'high', 'urgent')),
  published_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_announcements_org ON public.announcements (organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_stat ON public.announcements (status);

CREATE OR REPLACE TRIGGER trg_announcements_set_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8.2 Announcement Read Receipts
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID          NOT NULL REFERENCES public.announcements (id) ON DELETE CASCADE,
  profile_id      UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_announcement_reads UNIQUE (announcement_id, profile_id)
);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_announcement_reads_prof ON public.announcement_reads (profile_id);

-- =============================================================================
-- SECTION 9: Shared Approvals Queue
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.shared_approvals (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  request_type          TEXT          NOT NULL
                                      CHECK (request_type IN ('onboarding_closure', 'offboarding_clearance', 'asset_assignment', 'document_verification', 'general')),
  entity_id             UUID          NOT NULL,
  requester_id          UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  assigned_role         TEXT          NOT NULL,
  assigned_approver_id  UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  status                TEXT          NOT NULL DEFAULT 'pending'
                                      CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  decision_notes        TEXT,
  decided_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shared_approvals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_approvals_org  ON public.shared_approvals (organization_id);
CREATE INDEX IF NOT EXISTS idx_approvals_stat ON public.shared_approvals (status);
CREATE INDEX IF NOT EXISTS idx_approvals_role ON public.shared_approvals (assigned_role);

CREATE OR REPLACE TRIGGER trg_shared_approvals_set_updated_at
  BEFORE UPDATE ON public.shared_approvals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 10: Authoritative PostgreSQL RPCs & Business Functions
-- =============================================================================

-- 10.1 Create Onboarding Case (prevents duplicate cases per employee)
CREATE OR REPLACE FUNCTION public.create_onboarding_case(
  p_org_id UUID,
  p_employee_id UUID,
  p_candidate_id UUID,
  p_joining_date DATE,
  p_dept_id UUID,
  p_desig_id UUID,
  p_branch_id UUID,
  p_manager_id UUID,
  p_template_id UUID,
  p_created_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_case_id UUID;
  v_tmpl RECORD;
  v_item RECORD;
  v_task_count INTEGER := 0;
BEGIN
  -- Verify employee exists and belongs to org
  IF NOT EXISTS (SELECT 1 FROM public.employees WHERE id = p_employee_id AND organization_id = p_org_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid employee specified.');
  END IF;

  -- Verify non-duplicate onboarding case
  IF EXISTS (SELECT 1 FROM public.onboarding_cases WHERE organization_id = p_org_id AND employee_id = p_employee_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'An onboarding case already exists for this employee.');
  END IF;

  INSERT INTO public.onboarding_cases (
    organization_id, employee_id, candidate_id, joining_date,
    department_id, designation_id, branch_id, reporting_manager_id,
    status, created_by, created_at, updated_at
  )
  VALUES (
    p_org_id, p_employee_id, p_candidate_id, p_joining_date,
    p_dept_id, p_desig_id, p_branch_id, p_manager_id,
    'in_progress', p_created_by, NOW(), NOW()
  )
  RETURNING id INTO v_case_id;

  -- Populate tasks from template if provided
  IF p_template_id IS NOT NULL THEN
    SELECT * INTO v_tmpl FROM public.onboarding_checklist_templates WHERE id = p_template_id AND organization_id = p_org_id;
    IF v_tmpl.id IS NOT NULL AND jsonb_array_length(v_tmpl.items) > 0 THEN
      FOR v_item IN SELECT * FROM jsonb_to_recordset(v_tmpl.items) AS x(
        title TEXT, description TEXT, category TEXT, assigned_role TEXT, is_required BOOLEAN, days_due INTEGER
      )
      LOOP
        INSERT INTO public.onboarding_tasks (
          organization_id, case_id, title, description, category, assigned_role,
          due_date, is_required, status, created_at, updated_at
        )
        VALUES (
          p_org_id, v_case_id, v_item.title, v_item.description,
          COALESCE(v_item.category, 'general'),
          COALESCE(v_item.assigned_role, 'hr'),
          p_joining_date + COALESCE(v_item.days_due, 7),
          COALESCE(v_item.is_required, true),
          'pending', NOW(), NOW()
        );
        v_task_count := v_task_count + 1;
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'case_id', v_case_id,
    'tasks_created', v_task_count
  );
END;
$$;

-- 10.2 Complete Onboarding Case (Guards: all required checklist tasks must be completed)
CREATE OR REPLACE FUNCTION public.complete_onboarding_case(
  p_case_id UUID,
  p_actor_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_case RECORD;
  v_pending_req INTEGER;
BEGIN
  SELECT * INTO v_case FROM public.onboarding_cases WHERE id = p_case_id;
  IF v_case.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onboarding case not found.');
  END IF;

  IF v_case.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Onboarding case is already completed.');
  END IF;

  -- Check if any required tasks are not completed
  SELECT COUNT(*) INTO v_pending_req
  FROM public.onboarding_tasks
  WHERE case_id = p_case_id AND is_required = true AND status != 'completed';

  IF v_pending_req > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot complete onboarding: ' || v_pending_req || ' required checklist tasks remain incomplete.'
    );
  END IF;

  UPDATE public.onboarding_cases
  SET status = 'completed',
      completed_at = NOW(),
      completed_by = p_actor_id,
      notes = COALESCE(p_notes, notes),
      updated_at = NOW()
  WHERE id = p_case_id;

  RETURN jsonb_build_object('success', true, 'case_id', p_case_id);
END;
$$;

-- 10.3 Initiate Offboarding Case (Links active IT assets into clearance)
CREATE OR REPLACE FUNCTION public.initiate_offboarding_case(
  p_org_id UUID,
  p_employee_id UUID,
  p_exit_type TEXT,
  p_reason TEXT,
  p_last_working_date DATE,
  p_notice_days INTEGER,
  p_actor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_case_id UUID;
  v_asset RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.employees WHERE id = p_employee_id AND organization_id = p_org_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid employee specified.');
  END IF;

  -- Prevent duplicate open offboarding cases
  IF EXISTS (
    SELECT 1 FROM public.offboarding_cases
    WHERE organization_id = p_org_id AND employee_id = p_employee_id AND status NOT IN ('rejected', 'cancelled', 'completed')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'An active offboarding case is already in progress for this employee.');
  END IF;

  INSERT INTO public.offboarding_cases (
    organization_id, employee_id, initiated_by, exit_type, reason,
    last_working_date, notice_period_days, status, created_at, updated_at
  )
  VALUES (
    p_org_id, p_employee_id, p_actor_id, p_exit_type, p_reason,
    p_last_working_date, p_notice_days, 'requested', NOW(), NOW()
  )
  RETURNING id INTO v_case_id;

  -- Add standard departmental clearance items
  INSERT INTO public.offboarding_clearance_items (organization_id, case_id, department_type, item_name, status)
  VALUES
    (p_org_id, v_case_id, 'hr', 'Exit Interview and Documentation Review', 'pending'),
    (p_org_id, v_case_id, 'department', 'Knowledge Transfer and Project Handoff', 'pending'),
    (p_org_id, v_case_id, 'finance', 'Payroll Settlement and Travel Expense Clearance', 'pending'),
    (p_org_id, v_case_id, 'admin', 'Campus Identity Card and Physical Access Return', 'pending');

  -- Coordinate IT Asset returns: check all active asset assignments for this employee
  FOR v_asset IN
    SELECT a.id, a.asset_tag, a.name
    FROM public.asset_assignments aa
    JOIN public.assets a ON a.id = aa.asset_id
    WHERE aa.employee_id = p_employee_id AND aa.is_active = true
  LOOP
    INSERT INTO public.offboarding_clearance_items (organization_id, case_id, department_type, item_name, status, comments)
    VALUES (
      p_org_id, v_case_id, 'it',
      'Return Hardware Asset: ' || v_asset.name || ' (' || v_asset.asset_tag || ')',
      'pending',
      'Asset ID: ' || v_asset.id
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'case_id', v_case_id);
END;
$$;

-- 10.4 Process Offboarding Decision (Guards: all clearance items cleared before completion)
CREATE OR REPLACE FUNCTION public.process_offboarding_decision(
  p_case_id UUID,
  p_step TEXT,
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
  v_case RECORD;
  v_pending_items INTEGER;
BEGIN
  SELECT * INTO v_case FROM public.offboarding_cases WHERE id = p_case_id;
  IF v_case.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Offboarding case not found.');
  END IF;

  IF p_decision = 'reject' THEN
    UPDATE public.offboarding_cases
    SET status = 'rejected',
        rejection_reason = p_notes,
        updated_at = NOW()
    WHERE id = p_case_id;
    RETURN jsonb_build_object('success', true, 'status', 'rejected');

  ELSIF p_step = 'manager_approval' THEN
    UPDATE public.offboarding_cases
    SET manager_approved = true,
        manager_approved_by = p_actor_id,
        manager_approved_at = NOW(),
        status = 'under_review',
        updated_at = NOW()
    WHERE id = p_case_id;
    RETURN jsonb_build_object('success', true, 'status', 'under_review');

  ELSIF p_step = 'hr_approval' THEN
    UPDATE public.offboarding_cases
    SET hr_approved = true,
        hr_approved_by = p_actor_id,
        hr_approved_at = NOW(),
        status = 'in_progress',
        updated_at = NOW()
    WHERE id = p_case_id;
    RETURN jsonb_build_object('success', true, 'status', 'in_progress');

  ELSIF p_step = 'complete_exit' THEN
    -- Check clearance items
    SELECT COUNT(*) INTO v_pending_items
    FROM public.offboarding_clearance_items
    WHERE case_id = p_case_id AND status != 'cleared';

    IF v_pending_items > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Cannot complete offboarding: ' || v_pending_items || ' departmental clearance items are still pending.'
      );
    END IF;

    -- Complete exit and safely deactivate employee record
    UPDATE public.offboarding_cases
    SET status = 'completed',
        account_deactivated = true,
        deactivated_at = NOW(),
        updated_at = NOW()
    WHERE id = p_case_id;

    -- Update employee employment_status
    UPDATE public.employees
    SET employment_status = CASE WHEN v_case.exit_type = 'termination' THEN 'terminated' ELSE 'resigned' END,
        is_active = false,
        date_of_resignation = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = v_case.employee_id;

    RETURN jsonb_build_object('success', true, 'status', 'completed');
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Invalid decision step.');
END;
$$;

-- 10.5 Assign IT Asset (Enforces available status and 1 active assignment per asset)
CREATE OR REPLACE FUNCTION public.assign_asset(
  p_org_id UUID,
  p_asset_id UUID,
  p_employee_id UUID,
  p_assigned_by UUID,
  p_assigned_date DATE,
  p_return_due_date DATE,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_asset RECORD;
  v_assign_id UUID;
BEGIN
  SELECT * INTO v_asset FROM public.assets WHERE id = p_asset_id AND organization_id = p_org_id;
  IF v_asset.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Asset not found.');
  END IF;

  IF v_asset.status = 'retired' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Retired assets cannot be assigned.');
  END IF;

  IF v_asset.status = 'under_maintenance' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assets under maintenance cannot be assigned.');
  END IF;

  IF v_asset.status = 'assigned' OR EXISTS (
    SELECT 1 FROM public.asset_assignments WHERE asset_id = p_asset_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Asset is currently assigned. Return existing assignment first.');
  END IF;

  INSERT INTO public.asset_assignments (
    organization_id, asset_id, employee_id, assigned_by,
    assigned_date, return_due_date, is_active, notes, created_at, updated_at
  )
  VALUES (
    p_org_id, p_asset_id, p_employee_id, p_assigned_by,
    p_assigned_date, p_return_due_date, true, p_notes, NOW(), NOW()
  )
  RETURNING id INTO v_assign_id;

  UPDATE public.assets
  SET status = 'assigned', updated_at = NOW()
  WHERE id = p_asset_id;

  RETURN jsonb_build_object('success', true, 'assignment_id', v_assign_id);
END;
$$;

-- 10.6 Return IT Asset (Marks assignment inactive, updates asset status)
CREATE OR REPLACE FUNCTION public.return_asset(
  p_assignment_id UUID,
  p_returned_condition TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_assign RECORD;
BEGIN
  SELECT * INTO v_assign FROM public.asset_assignments WHERE id = p_assignment_id;
  IF v_assign.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assignment record not found.');
  END IF;

  IF v_assign.is_active = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Assignment is already marked as returned.');
  END IF;

  UPDATE public.asset_assignments
  SET is_active = false,
      returned_date = CURRENT_DATE,
      returned_condition = p_returned_condition,
      notes = COALESCE(p_notes, notes),
      updated_at = NOW()
  WHERE id = p_assignment_id;

  UPDATE public.assets
  SET status = CASE WHEN p_returned_condition = 'poor' THEN 'damaged' ELSE 'available' END,
      condition = COALESCE(p_returned_condition, condition),
      updated_at = NOW()
  WHERE id = v_assign.asset_id;

  RETURN jsonb_build_object('success', true, 'assignment_id', p_assignment_id);
END;
$$;

-- 10.7 Submit Performance Review Stage
CREATE OR REPLACE FUNCTION public.submit_performance_review(
  p_review_id UUID,
  p_stage TEXT,
  p_actor_id UUID,
  p_rating NUMERIC(3,2),
  p_feedback TEXT,
  p_competencies NUMERIC(3,2) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_review RECORD;
BEGIN
  SELECT * INTO v_review FROM public.performance_reviews WHERE id = p_review_id;
  IF v_review.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Performance review record not found.');
  END IF;

  IF v_review.is_locked = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'Performance review is finalized and locked.');
  END IF;

  IF p_rating < 1.0 OR p_rating > 5.0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rating must be between 1.0 and 5.0.');
  END IF;

  IF p_stage = 'self' THEN
    UPDATE public.performance_reviews
    SET self_rating = p_rating,
        self_feedback = p_feedback,
        self_submitted_at = NOW(),
        status = 'manager_review',
        updated_at = NOW()
    WHERE id = p_review_id;
    RETURN jsonb_build_object('success', true, 'status', 'manager_review');

  ELSIF p_stage = 'manager' THEN
    UPDATE public.performance_reviews
    SET manager_rating = p_rating,
        manager_feedback = p_feedback,
        competencies_score = p_competencies,
        manager_submitted_at = NOW(),
        status = 'awaiting_acknowledgement',
        updated_at = NOW()
    WHERE id = p_review_id;
    RETURN jsonb_build_object('success', true, 'status', 'awaiting_acknowledgement');

  ELSIF p_stage = 'acknowledge' THEN
    UPDATE public.performance_reviews
    SET employee_acknowledged = true,
        employee_acknowledged_at = NOW(),
        employee_comments = p_feedback,
        status = 'completed',
        is_locked = true,
        updated_at = NOW()
    WHERE id = p_review_id;
    RETURN jsonb_build_object('success', true, 'status', 'completed');
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Invalid review submission stage.');
END;
$$;

-- =============================================================================
-- SECTION 11: Multi-Level RLS Policies
-- =============================================================================

-- Onboarding Templates & Cases
CREATE POLICY "onboarding_templates_org_member" ON public.onboarding_checklist_templates
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "onboarding_templates_hr" ON public.onboarding_checklist_templates
  FOR ALL USING (public.is_org_member(organization_id) AND public.has_permission('employee.write'));

CREATE POLICY "onboarding_cases_org_member" ON public.onboarding_cases
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "onboarding_cases_hr" ON public.onboarding_cases
  FOR ALL USING (public.is_org_member(organization_id) AND public.has_permission('employee.write'));

CREATE POLICY "onboarding_tasks_org_member" ON public.onboarding_tasks
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "onboarding_tasks_update" ON public.onboarding_tasks
  FOR UPDATE USING (public.is_org_member(organization_id));

-- Offboarding Cases & Items
CREATE POLICY "offboarding_cases_select" ON public.offboarding_cases
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "offboarding_cases_hr" ON public.offboarding_cases
  FOR ALL USING (public.is_org_member(organization_id) AND public.has_permission('employee.write'));

CREATE POLICY "offboarding_items_select" ON public.offboarding_clearance_items
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "offboarding_items_update" ON public.offboarding_clearance_items
  FOR UPDATE USING (public.is_org_member(organization_id));

-- Performance
CREATE POLICY "perf_cycles_select" ON public.performance_cycles
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "perf_cycles_hr" ON public.performance_cycles
  FOR ALL USING (public.is_org_member(organization_id) AND public.has_permission('employee.write'));

CREATE POLICY "perf_goals_select" ON public.performance_goals
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "perf_goals_modify" ON public.performance_goals
  FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "perf_reviews_select" ON public.performance_reviews
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "perf_reviews_modify" ON public.performance_reviews
  FOR ALL USING (public.is_org_member(organization_id));

-- Tasks
CREATE POLICY "tasks_select" ON public.employee_tasks
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "tasks_modify" ON public.employee_tasks
  FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY "task_log_select" ON public.task_activity_log
  FOR SELECT USING (true);

CREATE POLICY "task_log_insert" ON public.task_activity_log
  FOR INSERT WITH CHECK (true);

-- IT Assets
CREATE POLICY "assets_select" ON public.assets
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "assets_manage" ON public.assets
  FOR ALL USING (public.is_org_member(organization_id) AND public.has_permission('asset.manage'));

CREATE POLICY "asset_assignments_select" ON public.asset_assignments
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "asset_assignments_manage" ON public.asset_assignments
  FOR ALL USING (public.is_org_member(organization_id) AND public.has_permission('asset.manage'));

CREATE POLICY "asset_maintenance_select" ON public.asset_maintenance
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "asset_maintenance_manage" ON public.asset_maintenance
  FOR ALL USING (public.is_org_member(organization_id) AND public.has_permission('asset.manage'));

-- Documents
CREATE POLICY "docs_select" ON public.documents
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "docs_manage" ON public.documents
  FOR ALL USING (public.is_org_member(organization_id) AND public.has_permission('document.write'));

-- Announcements
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "announcements_manage" ON public.announcements
  FOR ALL USING (public.is_org_member(organization_id) AND public.has_permission('organization.write'));

CREATE POLICY "announcement_reads_select" ON public.announcement_reads
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "announcement_reads_insert" ON public.announcement_reads
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Shared Approvals
CREATE POLICY "shared_approvals_select" ON public.shared_approvals
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "shared_approvals_modify" ON public.shared_approvals
  FOR ALL USING (public.is_org_member(organization_id));
