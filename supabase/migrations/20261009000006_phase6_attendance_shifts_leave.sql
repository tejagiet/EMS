-- Migration: 20261009000006_phase6_attendance_shifts_leave
-- Description: Phase 6 Schema — Shifts, Shift Assignments, Attendance Engine,
--              Attendance Corrections, Leave Types, Leave Requests, Leave Ledger,
--              Notifications, Transactional RPCs, and Multi-Level RLS Policies.
-- Institution: GIET Polytechnic College
-- Department: Artificial Intelligence (AI) Department
-- Batch: 2024–2027
-- Project: Employee Management System (EMS)
-- Team: T-1
-- Publisher ID: GIETP-AI-IT-EMS-T1-2026
-- Phase: 6

-- =============================================================================
-- SECTION 1: Shift Definitions & Scheduling
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.shifts (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name                   TEXT          NOT NULL,
  code                   TEXT          NOT NULL,
  start_time             TIME          NOT NULL,
  end_time               TIME          NOT NULL,
  break_duration_minutes INTEGER       NOT NULL DEFAULT 60 CHECK (break_duration_minutes >= 0),
  grace_period_minutes   INTEGER       NOT NULL DEFAULT 15 CHECK (grace_period_minutes >= 0),
  applicable_days        JSONB         NOT NULL DEFAULT '[1,2,3,4,5]'::jsonb, -- 1=Mon .. 7=Sun
  is_overnight           BOOLEAN       NOT NULL DEFAULT false,
  is_active              BOOLEAN       NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_shifts_org_code UNIQUE (organization_id, code)
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_shifts_org_id     ON public.shifts (organization_id);
CREATE INDEX IF NOT EXISTS idx_shifts_code       ON public.shifts (code);
CREATE INDEX IF NOT EXISTS idx_shifts_is_active  ON public.shifts (is_active);

CREATE OR REPLACE TRIGGER trg_shifts_set_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Shift Assignments Table
CREATE TABLE IF NOT EXISTS public.shift_assignments (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  employee_id     UUID          NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  shift_id        UUID          NOT NULL REFERENCES public.shifts (id) ON DELETE RESTRICT,
  effective_from  DATE          NOT NULL,
  effective_to    DATE,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_shift_assignment_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_shift_assignments_emp   ON public.shift_assignments (employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift ON public.shift_assignments (shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_dates ON public.shift_assignments (effective_from, effective_to);

CREATE OR REPLACE TRIGGER trg_shift_assignments_set_updated_at
  BEFORE UPDATE ON public.shift_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 2: Attendance Records & Corrections Engine
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  employee_id         UUID          NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  shift_id            UUID          REFERENCES public.shifts (id) ON DELETE SET NULL,
  work_date           DATE          NOT NULL,
  clock_in            TIMESTAMPTZ,
  clock_out           TIMESTAMPTZ,
  break_minutes       INTEGER       NOT NULL DEFAULT 0 CHECK (break_minutes >= 0),
  duration_minutes    INTEGER       NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  status              TEXT          NOT NULL DEFAULT 'present'
                                    CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'weekend')),
  is_late             BOOLEAN       NOT NULL DEFAULT false,
  is_early_departure  BOOLEAN       NOT NULL DEFAULT false,
  is_corrected        BOOLEAN       NOT NULL DEFAULT false,
  correction_notes    TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attendance_org_emp_date UNIQUE (organization_id, employee_id, work_date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_attendance_records_emp_date  ON public.attendance_records (employee_id, work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_org_date  ON public.attendance_records (organization_id, work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status    ON public.attendance_records (status);

CREATE OR REPLACE TRIGGER trg_attendance_records_set_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Attendance Corrections Table
CREATE TABLE IF NOT EXISTS public.attendance_corrections (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  attendance_record_id UUID          REFERENCES public.attendance_records (id) ON DELETE SET NULL,
  employee_id          UUID          NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  requested_clock_in   TIMESTAMPTZ   NOT NULL,
  requested_clock_out  TIMESTAMPTZ   NOT NULL,
  reason               TEXT          NOT NULL,
  status               TEXT          NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by          UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at          TIMESTAMPTZ,
  rejection_reason     TEXT,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_attendance_corrections_emp    ON public.attendance_corrections (employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_status ON public.attendance_corrections (status);

CREATE OR REPLACE TRIGGER trg_attendance_corrections_set_updated_at
  BEFORE UPDATE ON public.attendance_corrections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- SECTION 3: Leave Types, Leave Requests & Authoritative Ledger
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.leave_types (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  name               TEXT          NOT NULL,
  code               TEXT          NOT NULL,
  days_per_year      NUMERIC(5,2)  NOT NULL DEFAULT 12.00 CHECK (days_per_year >= 0),
  is_paid            BOOLEAN       NOT NULL DEFAULT true,
  carry_forward_days NUMERIC(5,2)  NOT NULL DEFAULT 0.00 CHECK (carry_forward_days >= 0),
  is_active          BOOLEAN       NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_leave_types_org_code UNIQUE (organization_id, code)
);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_leave_types_org_code ON public.leave_types (organization_id, code);

CREATE OR REPLACE TRIGGER trg_leave_types_set_updated_at
  BEFORE UPDATE ON public.leave_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  employee_id      UUID          NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  leave_type_id    UUID          NOT NULL REFERENCES public.leave_types (id) ON DELETE RESTRICT,
  start_date       DATE          NOT NULL,
  end_date         DATE          NOT NULL,
  total_days       NUMERIC(5,2)  NOT NULL CHECK (total_days > 0),
  reason           TEXT          NOT NULL,
  status           TEXT          NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by      UUID          REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_leave_request_dates CHECK (end_date >= start_date)
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_leave_requests_emp_dates ON public.leave_requests (employee_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status    ON public.leave_requests (status);

CREATE OR REPLACE TRIGGER trg_leave_requests_set_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Authoritative Leave Ledger Table
CREATE TABLE IF NOT EXISTS public.leave_ledger (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE RESTRICT,
  employee_id      UUID          NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  leave_type_id    UUID          NOT NULL REFERENCES public.leave_types (id) ON DELETE RESTRICT,
  leave_request_id UUID          REFERENCES public.leave_requests (id) ON DELETE SET NULL,
  transaction_type TEXT          NOT NULL
                                 CHECK (transaction_type IN ('credit', 'debit', 'accrual', 'deduction', 'carry_forward', 'adjustment')),
  days             NUMERIC(5,2)  NOT NULL, -- Positive for accrual/credits, negative for deductions
  notes            TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leave_ledger ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_leave_ledger_emp_type ON public.leave_ledger (employee_id, leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_ledger_req      ON public.leave_ledger (leave_request_id);

-- =============================================================================
-- SECTION 4: System Notifications Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID          NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  recipient_profile_id UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title                TEXT          NOT NULL,
  message              TEXT          NOT NULL,
  type                 TEXT          NOT NULL
                                     CHECK (type IN ('leave_submitted', 'leave_approved', 'leave_rejected', 'correction_submitted', 'correction_reviewed', 'shift_assigned', 'system')),
  link                 TEXT,
  is_read              BOOLEAN       NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications (recipient_profile_id, is_read);

-- =============================================================================
-- SECTION 5: Authoritative PostgreSQL RPCs & Business Functions
-- =============================================================================

-- 5.1 Clock In Employee (Server-side NOW timestamp, open session guard)
CREATE OR REPLACE FUNCTION public.clock_in_employee(
  p_org_id UUID,
  p_employee_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_now TIMESTAMPTZ := NOW();
  v_shift RECORD;
  v_existing RECORD;
  v_is_late BOOLEAN := false;
  v_status TEXT := 'present';
  v_new_record_id UUID;
BEGIN
  -- 1. Check for open session (any uncompleted clock_out)
  SELECT id INTO v_existing
  FROM public.attendance_records
  WHERE organization_id = p_org_id
    AND employee_id = p_employee_id
    AND clock_out IS NULL
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'An open attendance session is already active. Please clock out first.'
    );
  END IF;

  -- 2. Lookup active shift assignment for today
  SELECT s.*
  INTO v_shift
  FROM public.shift_assignments sa
  JOIN public.shifts s ON s.id = sa.shift_id
  WHERE sa.organization_id = p_org_id
    AND sa.employee_id = p_employee_id
    AND sa.is_active = true
    AND sa.effective_from <= v_today
    AND (sa.effective_to IS NULL OR sa.effective_to >= v_today)
  ORDER BY sa.created_at DESC
  LIMIT 1;

  -- 3. Check for late arrival if shift exists
  IF v_shift.id IS NOT NULL THEN
    DECLARE
      v_shift_start_ts TIMESTAMPTZ;
      v_grace_limit TIMESTAMPTZ;
    BEGIN
      v_shift_start_ts := v_today + v_shift.start_time;
      v_grace_limit := v_shift_start_ts + (v_shift.grace_period_minutes || ' minutes')::interval;
      IF v_now > v_grace_limit THEN
        v_is_late := true;
        v_status := 'late';
      END IF;
    END;
  END IF;

  -- 4. Insert or update today's attendance record
  INSERT INTO public.attendance_records (
    organization_id,
    employee_id,
    shift_id,
    work_date,
    clock_in,
    clock_out,
    break_minutes,
    duration_minutes,
    status,
    is_late,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    p_org_id,
    p_employee_id,
    v_shift.id,
    v_today,
    v_now,
    NULL,
    0,
    0,
    v_status,
    v_is_late,
    p_notes,
    v_now,
    v_now
  )
  ON CONFLICT (organization_id, employee_id, work_date)
  DO UPDATE SET
    clock_in = EXCLUDED.clock_in,
    clock_out = NULL,
    status = EXCLUDED.status,
    is_late = EXCLUDED.is_late,
    shift_id = COALESCE(EXCLUDED.shift_id, public.attendance_records.shift_id),
    updated_at = v_now
  RETURNING id INTO v_new_record_id;

  RETURN jsonb_build_object(
    'success', true,
    'record_id', v_new_record_id,
    'clock_in', v_now,
    'status', v_status,
    'is_late', v_is_late
  );
END;
$$;

-- 5.2 Clock Out Employee (Duration computation minus breaks, early departure check)
CREATE OR REPLACE FUNCTION public.clock_out_employee(
  p_org_id UUID,
  p_employee_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_record RECORD;
  v_shift RECORD;
  v_duration_mins INTEGER;
  v_is_early BOOLEAN := false;
  v_final_status TEXT;
BEGIN
  -- 1. Find the active open record
  SELECT * INTO v_record
  FROM public.attendance_records
  WHERE organization_id = p_org_id
    AND employee_id = p_employee_id
    AND clock_out IS NULL
  ORDER BY clock_in DESC
  LIMIT 1;

  IF v_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active clock-in session found for this employee.'
    );
  END IF;

  -- 2. Compute worked duration in minutes
  v_duration_mins := GREATEST(0, (EXTRACT(EPOCH FROM (v_now - v_record.clock_in)) / 60)::integer - v_record.break_minutes);

  -- 3. Check shift end time for early departure
  IF v_record.shift_id IS NOT NULL THEN
    SELECT * INTO v_shift FROM public.shifts WHERE id = v_record.shift_id;
    IF v_shift.id IS NOT NULL THEN
      DECLARE
        v_shift_end_ts TIMESTAMPTZ;
      BEGIN
        IF v_shift.is_overnight THEN
          v_shift_end_ts := (v_record.work_date + INTERVAL '1 day') + v_shift.end_time;
        ELSE
          v_shift_end_ts := v_record.work_date + v_shift.end_time;
        END IF;

        IF v_now < v_shift_end_ts THEN
          v_is_early := true;
        END IF;
      END;
    END IF;
  END IF;

  -- Determine final status (half_day if duration < 4 hours, else keep existing or present)
  IF v_duration_mins < 240 THEN
    v_final_status := 'half_day';
  ELSE
    v_final_status := v_record.status;
  END IF;

  -- 4. Update the record
  UPDATE public.attendance_records
  SET clock_out = v_now,
      duration_minutes = v_duration_mins,
      status = v_final_status,
      is_early_departure = v_is_early,
      notes = COALESCE(p_notes, notes),
      updated_at = v_now
  WHERE id = v_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'record_id', v_record.id,
    'clock_out', v_now,
    'duration_minutes', v_duration_mins,
    'is_early_departure', v_is_early,
    'status', v_final_status
  );
END;
$$;

-- 5.3 Authoritative Leave Request Decision (Ledger transaction & conflict check)
CREATE OR REPLACE FUNCTION public.process_leave_request_decision(
  p_request_id UUID,
  p_decision TEXT, -- 'approved' or 'rejected'
  p_reviewer_profile_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_req RECORD;
  v_leave_type RECORD;
  v_balance NUMERIC;
  v_curr_date DATE;
  v_emp_profile_id UUID;
BEGIN
  -- 1. Fetch request with row-level lock
  SELECT lr.*, e.profile_id AS emp_profile_id
  INTO v_req
  FROM public.leave_requests lr
  JOIN public.employees e ON e.id = lr.employee_id
  WHERE lr.id = p_request_id
  FOR UPDATE;

  IF v_req.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Leave request not found.');
  END IF;

  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This request has already been processed.');
  END IF;

  SELECT * INTO v_leave_type FROM public.leave_types WHERE id = v_req.leave_type_id;

  -- 2. If Decision is APPROVED:
  IF p_decision = 'approved' THEN
    -- Verify balance if paid leave
    IF v_leave_type.is_paid THEN
      SELECT COALESCE(SUM(days), 0)
      INTO v_balance
      FROM public.leave_ledger
      WHERE organization_id = v_req.organization_id
        AND employee_id = v_req.employee_id
        AND leave_type_id = v_req.leave_type_id;

      IF v_balance < v_req.total_days THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Insufficient leave balance. Available: ' || v_balance || ', Required: ' || v_req.total_days
        );
      END IF;
    END IF;

    -- Update leave request
    UPDATE public.leave_requests
    SET status = 'approved',
        reviewed_by = p_reviewer_profile_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_req.id;

    -- Record deduction in Authoritative Leave Ledger
    INSERT INTO public.leave_ledger (
      organization_id,
      employee_id,
      leave_type_id,
      leave_request_id,
      transaction_type,
      days,
      notes,
      created_at
    )
    VALUES (
      v_req.organization_id,
      v_req.employee_id,
      v_req.leave_type_id,
      v_req.id,
      'deduction',
      -v_req.total_days,
      'Approved leave: ' || v_req.start_date || ' to ' || v_req.end_date,
      NOW()
    );

    -- Mark dates as on_leave in attendance records
    v_curr_date := v_req.start_date;
    WHILE v_curr_date <= v_req.end_date LOOP
      INSERT INTO public.attendance_records (
        organization_id,
        employee_id,
        work_date,
        status,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        v_req.organization_id,
        v_req.employee_id,
        v_curr_date,
        'on_leave',
        'Approved ' || v_leave_type.name || ' leave',
        NOW(),
        NOW()
      )
      ON CONFLICT (organization_id, employee_id, work_date)
      DO UPDATE SET
        status = 'on_leave',
        notes = 'Approved ' || v_leave_type.name || ' leave',
        updated_at = NOW();

      v_curr_date := v_curr_date + INTERVAL '1 day';
    END LOOP;

    -- Notify Employee
    IF v_req.emp_profile_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        organization_id,
        recipient_profile_id,
        title,
        message,
        type,
        link,
        created_at
      )
      VALUES (
        v_req.organization_id,
        v_req.emp_profile_id,
        'Leave Request Approved',
        'Your leave request for ' || v_req.total_days || ' day(s) from ' || v_req.start_date || ' has been approved.',
        'leave_approved',
        '/portal/employee#leave',
        NOW()
      );
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'approved');

  -- 3. If Decision is REJECTED:
  ELSIF p_decision = 'rejected' THEN
    UPDATE public.leave_requests
    SET status = 'rejected',
        reviewed_by = p_reviewer_profile_id,
        reviewed_at = NOW(),
        rejection_reason = p_rejection_reason,
        updated_at = NOW()
    WHERE id = v_req.id;

    -- Notify Employee
    IF v_req.emp_profile_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        organization_id,
        recipient_profile_id,
        title,
        message,
        type,
        link,
        created_at
      )
      VALUES (
        v_req.organization_id,
        v_req.emp_profile_id,
        'Leave Request Rejected',
        'Your leave request from ' || v_req.start_date || ' was rejected. Reason: ' || COALESCE(p_rejection_reason, 'No reason specified.'),
        'leave_rejected',
        '/portal/employee#leave',
        NOW()
      );
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid decision. Must be approved or rejected.');
  END IF;
END;
$$;

-- 5.4 Attendance Correction Decision Workflow
CREATE OR REPLACE FUNCTION public.process_attendance_correction_decision(
  p_correction_id UUID,
  p_decision TEXT, -- 'approved' or 'rejected'
  p_reviewer_profile_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cor RECORD;
  v_emp_profile_id UUID;
  v_work_date DATE;
  v_duration_mins INTEGER;
BEGIN
  SELECT ac.*, e.profile_id AS emp_profile_id
  INTO v_cor
  FROM public.attendance_corrections ac
  JOIN public.employees e ON e.id = ac.employee_id
  WHERE ac.id = p_correction_id
  FOR UPDATE;

  IF v_cor.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Correction request not found.');
  END IF;

  IF v_cor.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Correction request already processed.');
  END IF;

  IF p_decision = 'approved' THEN
    v_work_date := (v_cor.requested_clock_in AT TIME ZONE 'UTC')::DATE;
    v_duration_mins := GREATEST(0, (EXTRACT(EPOCH FROM (v_cor.requested_clock_out - v_cor.requested_clock_in)) / 60)::integer);

    -- Update or insert corrected attendance record
    IF v_cor.attendance_record_id IS NOT NULL THEN
      UPDATE public.attendance_records
      SET clock_in = v_cor.requested_clock_in,
          clock_out = v_cor.requested_clock_out,
          duration_minutes = v_duration_mins,
          status = 'present',
          is_corrected = true,
          correction_notes = 'Corrected by supervisor: ' || v_cor.reason,
          updated_at = NOW()
      WHERE id = v_cor.attendance_record_id;
    ELSE
      INSERT INTO public.attendance_records (
        organization_id,
        employee_id,
        work_date,
        clock_in,
        clock_out,
        duration_minutes,
        status,
        is_corrected,
        correction_notes,
        created_at,
        updated_at
      )
      VALUES (
        v_cor.organization_id,
        v_cor.employee_id,
        v_work_date,
        v_cor.requested_clock_in,
        v_cor.requested_clock_out,
        v_duration_mins,
        'present',
        true,
        'Corrected by supervisor: ' || v_cor.reason,
        NOW(),
        NOW()
      )
      ON CONFLICT (organization_id, employee_id, work_date)
      DO UPDATE SET
        clock_in = EXCLUDED.clock_in,
        clock_out = EXCLUDED.clock_out,
        duration_minutes = EXCLUDED.duration_minutes,
        is_corrected = true,
        correction_notes = EXCLUDED.correction_notes,
        updated_at = NOW();
    END IF;

    UPDATE public.attendance_corrections
    SET status = 'approved',
        reviewed_by = p_reviewer_profile_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_cor.id;

    -- Notify Employee
    IF v_cor.emp_profile_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        organization_id,
        recipient_profile_id,
        title,
        message,
        type,
        link,
        created_at
      )
      VALUES (
        v_cor.organization_id,
        v_cor.emp_profile_id,
        'Attendance Correction Approved',
        'Your attendance correction request has been approved and your timesheet updated.',
        'correction_reviewed',
        '/portal/employee#attendance',
        NOW()
      );
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'approved');

  ELSIF p_decision = 'rejected' THEN
    UPDATE public.attendance_corrections
    SET status = 'rejected',
        reviewed_by = p_reviewer_profile_id,
        reviewed_at = NOW(),
        rejection_reason = p_rejection_reason,
        updated_at = NOW()
    WHERE id = v_cor.id;

    -- Notify Employee
    IF v_cor.emp_profile_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        organization_id,
        recipient_profile_id,
        title,
        message,
        type,
        link,
        created_at
      )
      VALUES (
        v_cor.organization_id,
        v_cor.emp_profile_id,
        'Attendance Correction Rejected',
        'Your attendance correction request was rejected. Reason: ' || COALESCE(p_rejection_reason, 'No reason specified.'),
        'correction_reviewed',
        '/portal/employee#attendance',
        NOW()
      );
    END IF;

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid decision. Must be approved or rejected.');
  END IF;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.clock_in_employee(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clock_out_employee(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_leave_request_decision(UUID, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_attendance_correction_decision(UUID, TEXT, UUID, TEXT) TO authenticated;

-- =============================================================================
-- SECTION 6: Row Level Security Policies (Canonical RBAC)
-- =============================================================================

-- 6.1 Shifts RLS
CREATE POLICY shifts_select_member
  ON public.shifts
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY shifts_manage_admin
  ON public.shifts
  FOR ALL
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('attendance.manage') OR public.has_permission('organization.write'))
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('attendance.manage') OR public.has_permission('organization.write'))
  );

-- 6.2 Shift Assignments RLS
CREATE POLICY shift_assignments_select
  ON public.shift_assignments
  FOR SELECT
  USING (
    public.is_org_member(organization_id)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR public.is_manager_of_employee(employee_id)
      OR public.has_permission('attendance.read')
    )
  );

CREATE POLICY shift_assignments_manage
  ON public.shift_assignments
  FOR ALL
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('attendance.manage') OR public.has_permission('organization.write'))
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('attendance.manage') OR public.has_permission('organization.write'))
  );

-- 6.3 Attendance Records RLS
CREATE POLICY attendance_records_select
  ON public.attendance_records
  FOR SELECT
  USING (
    public.is_org_member(organization_id)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR public.is_manager_of_employee(employee_id)
      OR public.has_permission('attendance.read')
    )
  );

CREATE POLICY attendance_records_self_insert
  ON public.attendance_records
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR public.has_permission('attendance.manage')
    )
  );

CREATE POLICY attendance_records_manage
  ON public.attendance_records
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR public.has_permission('attendance.manage')
    )
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR public.has_permission('attendance.manage')
    )
  );

-- 6.4 Attendance Corrections RLS
CREATE POLICY attendance_corrections_select
  ON public.attendance_corrections
  FOR SELECT
  USING (
    public.is_org_member(organization_id)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR public.is_manager_of_employee(employee_id)
      OR public.has_permission('attendance.manage')
    )
  );

CREATE POLICY attendance_corrections_self_insert
  ON public.attendance_corrections
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR public.has_permission('attendance.manage')
    )
  );

CREATE POLICY attendance_corrections_review
  ON public.attendance_corrections
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND (
      public.is_manager_of_employee(employee_id)
      OR public.has_permission('attendance.manage')
    )
  );

-- 6.5 Leave Types RLS
CREATE POLICY leave_types_select_member
  ON public.leave_types
  FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY leave_types_manage
  ON public.leave_types
  FOR ALL
  USING (
    public.is_org_member(organization_id)
    AND (public.has_permission('leave.approve') OR public.has_permission('organization.write'))
  )
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('leave.approve') OR public.has_permission('organization.write'))
  );

-- 6.6 Leave Requests RLS
CREATE POLICY leave_requests_select
  ON public.leave_requests
  FOR SELECT
  USING (
    public.is_org_member(organization_id)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR public.is_manager_of_employee(employee_id)
      OR public.has_permission('leave.read')
    )
  );

CREATE POLICY leave_requests_self_insert
  ON public.leave_requests
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR public.has_permission('leave.approve')
    )
  );

CREATE POLICY leave_requests_review
  ON public.leave_requests
  FOR UPDATE
  USING (
    public.is_org_member(organization_id)
    AND (
      public.is_manager_of_employee(employee_id)
      OR public.has_permission('leave.approve')
    )
  );

-- 6.7 Leave Ledger RLS
CREATE POLICY leave_ledger_select
  ON public.leave_ledger
  FOR SELECT
  USING (
    public.is_org_member(organization_id)
    AND (
      employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
      OR public.has_permission('leave.read')
      OR public.has_permission('audit.read')
    )
  );

CREATE POLICY leave_ledger_insert
  ON public.leave_ledger
  FOR INSERT
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.has_permission('leave.approve') OR public.has_permission('organization.write'))
  );

-- 6.8 Notifications RLS
CREATE POLICY notifications_select_recipient
  ON public.notifications
  FOR SELECT
  USING (recipient_profile_id = auth.uid());

CREATE POLICY notifications_update_recipient
  ON public.notifications
  FOR UPDATE
  USING (recipient_profile_id = auth.uid())
  WITH CHECK (recipient_profile_id = auth.uid());

-- Seed standard default leave types for all existing organizations
INSERT INTO public.leave_types (id, organization_id, name, code, days_per_year, is_paid, carry_forward_days, is_active)
SELECT
  gen_random_uuid(),
  o.id,
  lt.name,
  lt.code,
  lt.days,
  lt.is_paid,
  lt.carry,
  true
FROM public.organizations o
CROSS JOIN (
  VALUES
    ('Annual Privilege Leave', 'ANNUAL', 18.00, true, 5.00),
    ('Sick & Medical Leave',   'SICK',   12.00, true, 0.00),
    ('Casual Leave',           'CASUAL', 10.00, true, 0.00),
    ('Loss of Pay Leave',      'UNPAID',  0.00, false, 0.00)
) AS lt(name, code, days, is_paid, carry)
ON CONFLICT (organization_id, code) DO NOTHING;

-- Seed standard General Day Shift for all organizations
INSERT INTO public.shifts (id, organization_id, name, code, start_time, end_time, break_duration_minutes, grace_period_minutes, applicable_days, is_overnight, is_active)
SELECT
  gen_random_uuid(),
  o.id,
  'Standard General Shift',
  'GEN-01',
  '09:00:00'::time,
  '18:00:00'::time,
  60,
  15,
  '[1,2,3,4,5]'::jsonb,
  false,
  true
FROM public.organizations o
ON CONFLICT (organization_id, code) DO NOTHING;
