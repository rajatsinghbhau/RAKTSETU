-- ==============================================================================
-- RAKTSETU PRODUCTION SCHEMA (PostgreSQL / Supabase)
-- Philosophy: "DON'T JUST FIND A DONOR. SECURE THE BLOOD."
-- Response != Supply != Secured Blood
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM (
    'SUPER_ADMIN',
    'HOSPITAL_ADMIN',
    'HOSPITAL_COORDINATOR',
    'BLOOD_CENTRE_ADMIN',
    'BLOOD_CENTRE_OPERATOR',
    'DONOR',
    'PARTNER_ORGANIZATION',
    'AUDITOR'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE blood_group_enum AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE component_type_enum AS ENUM ('WHOLE_BLOOD', 'PRBC', 'PLATELETS', 'PLASMA', 'CRYO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE urgency_enum AS ENUM ('CRITICAL', 'URGENT', 'HIGH', 'ROUTINE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE request_status_enum AS ENUM (
    'DRAFT',
    'OPEN',
    'PARTIALLY_SECURED',
    'FULFILLED',
    'CANCELLED',
    'EXPIRED',
    'CLOSED_WITHOUT_FULFILMENT'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE donor_journey_status_enum AS ENUM (
    'ALERTED',
    'RESPONDED',
    'COORDINATING',
    'ON_THE_WAY',
    'ARRIVED',
    'SCREENING_PENDING',
    'SCREENING_CLEARED',
    'DONATION_CONFIRMED',
    'DECLINED',
    'UNRESPONSIVE',
    'CANCELLED',
    'SCREENING_FAILED',
    'DID_NOT_ARRIVE',
    'DONATION_NOT_COMPLETED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE blood_unit_status_enum AS ENUM (
    'AVAILABLE',
    'ALLOCATED',
    'DISPATCHED',
    'IN_TRANSIT',
    'RECEIVED',
    'SECURED',
    'ALLOCATION_CANCELLED',
    'DISPATCH_FAILED',
    'EXPIRED',
    'REJECTED',
    'RETURNED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('HOSPITAL', 'BLOOD_CENTRE', 'PARTNER')),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  license_number VARCHAR(100) NOT NULL UNIQUE,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (mapping to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'DONOR',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Organization Members (Multi-user RBAC within hospital / blood centre)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- 4. Donor Profiles
CREATE TABLE IF NOT EXISTS donor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  blood_group blood_group_enum NOT NULL,
  city VARCHAR(100) NOT NULL,
  approximate_area VARCHAR(150) NOT NULL,
  availability_status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (availability_status IN ('AVAILABLE', 'UNAVAILABLE', 'TEMPORARY_DEFERRAL')),
  consent_status BOOLEAN DEFAULT TRUE,
  verification_status VARCHAR(50) DEFAULT 'VERIFIED' CHECK (verification_status IN ('VERIFIED', 'PENDING', 'SUSPENDED')),
  last_donation_date DATE,
  total_donations INTEGER DEFAULT 0,
  preferred_contact VARCHAR(20) DEFAULT 'IN_APP',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Emergency Blood Requests
CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  blood_group blood_group_enum NOT NULL,
  component_type component_type_enum NOT NULL,
  required_quantity INTEGER NOT NULL CHECK (required_quantity > 0),
  secured_quantity INTEGER NOT NULL DEFAULT 0 CHECK (secured_quantity >= 0),
  outstanding_quantity INTEGER NOT NULL CHECK (outstanding_quantity >= 0),
  urgency urgency_enum NOT NULL DEFAULT 'URGENT',
  required_by TIMESTAMPTZ NOT NULL,
  destination TEXT NOT NULL,
  patient_reference VARCHAR(100),
  notes TEXT,
  status request_status_enum NOT NULL DEFAULT 'OPEN',
  active_waves_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  CONSTRAINT check_secured_lte_required CHECK (secured_quantity <= required_quantity + 2)
);

-- 6. Donor Journeys
CREATE TABLE IF NOT EXISTS donor_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES donor_profiles(id) ON DELETE RESTRICT,
  wave_number INTEGER DEFAULT 1,
  status donor_journey_status_enum NOT NULL DEFAULT 'ALERTED',
  alerted_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  screening_completed_at TIMESTAMPTZ,
  screening_result VARCHAR(20) CHECK (screening_result IN ('PASSED', 'FAILED')),
  screening_notes TEXT,
  donation_confirmed_at TIMESTAMPTZ,
  donation_units INTEGER DEFAULT 0,
  failure_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, donor_id)
);

-- 7. Blood Units (Cold-chain inventory)
CREATE TABLE IF NOT EXISTS blood_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_code VARCHAR(100) NOT NULL UNIQUE,
  blood_centre_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  blood_group blood_group_enum NOT NULL,
  component_type component_type_enum NOT NULL,
  status blood_unit_status_enum NOT NULL DEFAULT 'AVAILABLE',
  inventory_location VARCHAR(100) NOT NULL,
  collection_reference VARCHAR(100) NOT NULL,
  collection_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  allocated_request_id UUID REFERENCES blood_requests(id) ON DELETE SET NULL,
  dispatched_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  secured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Fulfilment Records (Only authorized confirmations update secured quantity)
CREATE TABLE IF NOT EXISTS fulfilment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('DONOR', 'INVENTORY', 'PARTNER')),
  source_id UUID NOT NULL,
  source_reference VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  confirmed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmation_type VARCHAR(50) NOT NULL CHECK (confirmation_type IN ('CLINICAL_VERIFIED', 'BLOOD_BANK_TRANSFER', 'EMERGENCY_OVERRIDE')),
  notes TEXT,
  audit_reference VARCHAR(100) NOT NULL UNIQUE
);

-- 9. Backup Waves
CREATE TABLE IF NOT EXISTS backup_waves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  wave_number INTEGER NOT NULL,
  wave_type VARCHAR(50) NOT NULL,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  donors_targeted_count INTEGER DEFAULT 0,
  responses_received_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  reason TEXT NOT NULL
);

-- 10. Audit Logs (Immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role_enum NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  request_id UUID REFERENCES blood_requests(id),
  details TEXT NOT NULL,
  metadata JSONB,
  ip_address VARCHAR(45)
);

-- 11. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  request_id UUID REFERENCES blood_requests(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- DATABASE STORED PROCEDURES & TRIGGERS (Authoritative & Concurrency-Safe)
-- ==============================================================================

-- Trigger to recalculate outstanding and status on request updates
CREATE OR REPLACE FUNCTION update_request_outstanding_and_status()
RETURNS TRIGGER AS $$
DECLARE
  v_req INTEGER;
  v_sec INTEGER;
  v_out INTEGER;
BEGIN
  v_req := NEW.required_quantity;
  v_sec := NEW.secured_quantity;
  v_out := GREATEST(v_req - v_sec, 0);
  NEW.outstanding_quantity := v_out;

  IF NEW.status NOT IN ('CANCELLED', 'EXPIRED', 'CLOSED_WITHOUT_FULFILMENT') THEN
    IF v_sec >= v_req THEN
      NEW.status := 'FULFILLED';
      IF NEW.closed_at IS NULL THEN
        NEW.closed_at := NOW();
      END IF;
    ELSIF v_sec > 0 THEN
      NEW.status := 'PARTIALLY_SECURED';
    ELSE
      NEW.status := 'OPEN';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_request_metrics ON blood_requests;
CREATE TRIGGER trg_calculate_request_metrics
BEFORE INSERT OR UPDATE OF required_quantity, secured_quantity, status ON blood_requests
FOR EACH ROW
EXECUTE FUNCTION update_request_outstanding_and_status();

-- Concurrency-Safe Blood Unit Allocation (Prevents Double Allocation)
CREATE OR REPLACE FUNCTION allocate_blood_unit_atomic(
  p_unit_id UUID,
  p_request_id UUID,
  p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_status blood_unit_status_enum;
  v_actor_role user_role_enum;
  v_unit_code VARCHAR;
  v_centre_id UUID;
BEGIN
  SELECT role INTO v_actor_role FROM profiles WHERE id = p_actor_id;
  IF v_actor_role NOT IN ('SUPER_ADMIN', 'BLOOD_CENTRE_ADMIN', 'BLOOD_CENTRE_OPERATOR') THEN
    RAISE EXCEPTION 'Unauthorized: User does not have blood-centre operator permissions.';
  END IF;

  -- Lock row exclusively
  SELECT status, unit_code, blood_centre_id INTO v_status, v_unit_code, v_centre_id
  FROM blood_units WHERE id = p_unit_id FOR UPDATE;

  IF v_status != 'AVAILABLE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unit ' || v_unit_code || ' is no longer AVAILABLE (current status: ' || v_status || '). Double-allocation prevented.');
  END IF;

  UPDATE blood_units
  SET status = 'ALLOCATED',
      allocated_request_id = p_request_id,
      updated_at = NOW()
  WHERE id = p_unit_id;

  INSERT INTO audit_logs (actor_id, actor_role, organization_id, action, entity_type, entity_id, request_id, details)
  VALUES (p_actor_id, v_actor_role, v_centre_id, 'INVENTORY_ALLOCATED', 'BLOOD_UNIT', p_unit_id, p_request_id, 'Unit ' || v_unit_code || ' allocated to request. Note: Allocation != Secured Blood.');

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

-- Concurrency-Safe Fulfilment Confirmation
CREATE OR REPLACE FUNCTION confirm_fulfilment_atomic(
  p_request_id UUID,
  p_source_type VARCHAR,
  p_source_id UUID,
  p_source_ref VARCHAR,
  p_quantity INTEGER,
  p_actor_id UUID,
  p_conf_type VARCHAR,
  p_notes TEXT
)
RETURNS UUID AS $$
DECLARE
  v_fulfilment_id UUID;
  v_audit_ref VARCHAR;
  v_actor_role user_role_enum;
BEGIN
  SELECT role INTO v_actor_role FROM profiles WHERE id = p_actor_id;
  IF v_actor_role NOT IN ('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'HOSPITAL_COORDINATOR', 'BLOOD_CENTRE_ADMIN') THEN
    RAISE EXCEPTION 'Unauthorized: Role % cannot confirm clinical fulfilment.', v_actor_role;
  END IF;

  PERFORM 1 FROM blood_requests WHERE id = p_request_id FOR UPDATE;

  v_audit_ref := 'CONF-' || UPPER(SUBSTRING(uuid_generate_v4()::TEXT FROM 1 FOR 8));
  INSERT INTO fulfilment_records (
    request_id, source_type, source_id, source_reference, quantity,
    confirmed_by, confirmation_type, notes, audit_reference
  ) VALUES (
    p_request_id, p_source_type, p_source_id, p_source_ref, p_quantity,
    p_actor_id, p_conf_type, p_notes, v_audit_ref
  ) RETURNING id INTO v_fulfilment_id;

  UPDATE blood_requests
  SET secured_quantity = secured_quantity + p_quantity,
      updated_at = NOW()
  WHERE id = p_request_id;

  INSERT INTO audit_logs (actor_id, actor_role, action, entity_type, entity_id, request_id, details)
  VALUES (p_actor_id, v_actor_role, 'CONFIRM_FULFILMENT', 'FULFILMENT', v_fulfilment_id, p_request_id, 'Confirmed ' || p_quantity || ' unit(s) from ' || p_source_type || ' (' || p_source_ref || '). Audit: ' || v_audit_ref);

  RETURN v_fulfilment_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Supabase Realtime for operational tables
ALTER PUBLICATION supabase_realtime ADD TABLE blood_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE donor_journeys;
ALTER PUBLICATION supabase_realtime ADD TABLE blood_units;
ALTER PUBLICATION supabase_realtime ADD TABLE fulfilment_records;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Row Level Security (RLS) Enablement
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfilment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Standard Policies
DO $$ BEGIN
  CREATE POLICY "Public read for verified organizations" ON organizations FOR SELECT USING (true);
  CREATE POLICY "Organizations insert by authenticated" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  CREATE POLICY "Users read all profiles" ON profiles FOR SELECT USING (true);
  CREATE POLICY "Users insert/update own profile" ON profiles FOR ALL USING (auth.uid() = id);
  CREATE POLICY "Donor profiles self access" ON donor_profiles FOR ALL USING (user_id = auth.uid());
  CREATE POLICY "Donor profiles visible to hospital coordinators" ON donor_profiles FOR SELECT USING (true);
  CREATE POLICY "Blood requests public read" ON blood_requests FOR SELECT USING (true);
  CREATE POLICY "Blood requests insert by hospital" ON blood_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  CREATE POLICY "Blood requests update by authorized" ON blood_requests FOR UPDATE USING (true);
  CREATE POLICY "Donor journeys visible to participant and hospital" ON donor_journeys FOR ALL USING (true);
  CREATE POLICY "Blood units visible to authenticated" ON blood_units FOR ALL USING (true);
  CREATE POLICY "Fulfilment records visible to all" ON fulfilment_records FOR SELECT USING (true);
  CREATE POLICY "Audit logs immutable read" ON audit_logs FOR SELECT USING (true);
  CREATE POLICY "Notifications access by user" ON notifications FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;
