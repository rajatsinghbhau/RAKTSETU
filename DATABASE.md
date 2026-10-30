# 🗄️ RAKTSETU Database Documentation

## Database Overview
- **Engine**: PostgreSQL 15+ (Hosted on Supabase)
- **Host**: `ebrjeajrkchfsifwbakg.supabase.co`
- **Schema Migration**: `supabase/migrations/001_initial_schema.sql`
- **Security**: Row-Level Security (RLS) enabled on all tables

---

## 1. Custom PostgreSQL Enum Types

| Type Name | Valid Values | Description |
|---|---|---|
| `blood_group_enum` | `'A+'`, `'A-'`, `'B+'`, `'B-'`, `'AB+'`, `'AB-'`, `'O+'`, `'O-'` | Standard ABO/Rh blood phenotypes |
| `component_type_enum` | `'WHOLE_BLOOD'`, `'PRBC'`, `'FFP'`, `'PLATELETS'`, `'CRYOPRECIPITATE'` | Blood component fractions |
| `urgency_level_enum` | `'CRITICAL'`, `'HIGH'`, `'STANDARD'` | Emergency priority weighting |
| `request_status_enum` | `'PENDING'`, `'ACTIVE'`, `'PARTIALLY_SECURED'`, `'FULFILLED'`, `'CANCELLED'`, `'EXPIRED'` | Status of the hospital blood request |
| `donor_journey_status_enum` | `'MATCHED'`, `'ALERTED'`, `'RESPONDED_YES'`, `'RESPONDED_NO'`, `'TRAVELING'`, `'AT_CENTRE'`, `'SCREENING'`, `'ELIGIBLE'`, `'DONATED'`, `'DEFERRED'`, `'CANCELLED'`, `'NO_RESPONSE'` | Donor pipeline stages |
| `unit_status_enum` | `'AVAILABLE'`, `'RESERVED'`, `'ALLOCATED'`, `'PACKED'`, `'DISPATCHED'`, `'DELIVERED'`, `'CROSSMATCHED'`, `'TRANSFUSED'`, `'EXPIRED'`, `'DISCARDED'` | Cold-chain physical unit states |
| `user_role_enum` | `'DONOR'`, `'HOSPITAL_COORDINATOR'`, `'HOSPITAL_ADMIN'`, `'BLOOD_CENTRE_OPERATOR'`, `'BLOOD_CENTRE_ADMIN'`, `'PLATFORM_ADMIN'` | RBAC system roles |

---

## 2. Relational Schema & Tables

### 2.1 `organizations`
Healthcare organizations (hospitals, licensed blood centres, regulatory bodies).
- `id` (UUID, PK)
- `name` (TEXT)
- `type` (`HOSPITAL` | `BLOOD_CENTRE` | `NGO` | `GOVERNMENT`)
- `license_number` (TEXT, UNIQUE)
- `address`, `city`, `state`, `postal_code`, `lat`, `lng`, `contact_phone`, `contact_email`
- `verified` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2.2 `profiles`
User profiles linked directly to Supabase Auth (`auth.users.id`).
- `id` (UUID, PK, FK $\to$ `auth.users.id`)
- `full_name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `role` (`user_role_enum`)
- `organization_id` (UUID, FK $\to$ `organizations.id`, NULLABLE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2.3 `donor_profiles`
Specialized donor biometric records and cooling history.
- `id` (UUID, PK)
- `user_id` (UUID, FK $\to$ `profiles.id`)
- `blood_group` (`blood_group_enum`)
- `city`, `postal_code`, `lat`, `lng`
- `last_donation_date` (DATE)
- `cooling_period_ends` (DATE)
- `is_available` (BOOLEAN)
- `verified_donor` (BOOLEAN)
- `total_donations` (INTEGER)

### 2.4 `blood_requests`
Emergency blood requirements created by authorized hospital personnel.
- `id` (UUID, PK)
- `hospital_id` (UUID, FK $\to$ `organizations.id`)
- `coordinator_id` (UUID, FK $\to$ `profiles.id`)
- `patient_identifier` (TEXT - anonymized/MRN)
- `blood_group` (`blood_group_enum`)
- `component_type` (`component_type_enum`)
- `required_units` (INTEGER)
- `secured_units` (INTEGER, DEFAULT 0)
- `outstanding_units` (INTEGER) — *Auto-calculated via trigger*
- `urgency` (`urgency_level_enum`)
- `deadline` (TIMESTAMPTZ)
- `status` (`request_status_enum`)
- `clinical_notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2.5 `donor_journeys`
Tracks mobilization attempts per donor for a specific request.
- `id` (UUID, PK)
- `request_id` (UUID, FK $\to$ `blood_requests.id`)
- `donor_id` (UUID, FK $\to$ `donor_profiles.id`)
- `status` (`donor_journey_status_enum`)
- `current_stage` (INTEGER, 1 to 6)
- `notes` (TEXT)
- `responded_at`, `arrived_at`, `screened_at`, `completed_at` (TIMESTAMPTZ)

### 2.6 `blood_units`
Cold-chain inventory tracked by unique barcode or ISBT-128 identifier.
- `id` (UUID, PK)
- `blood_centre_id` (UUID, FK $\to$ `organizations.id`)
- `unit_number` (TEXT, UNIQUE)
- `blood_group` (`blood_group_enum`)
- `component_type` (`component_type_enum`)
- `status` (`unit_status_enum`)
- `allocated_request_id` (UUID, FK $\to$ `blood_requests.id`, NULLABLE)
- `storage_location` (TEXT)
- `collected_at`, `expiry_date` (TIMESTAMPTZ)

### 2.7 `fulfilment_records`
Clinical receipts recording physical unit verification.
- `id` (UUID, PK)
- `request_id` (UUID, FK $\to$ `blood_requests.id`)
- `unit_id` (UUID, FK $\to$ `blood_units.id`, NULLABLE)
- `donor_id` (UUID, FK $\to$ `donor_profiles.id`, NULLABLE)
- `verified_by_user_id` (UUID, FK $\to$ `profiles.id`)
- `verification_method` (`PHYSICAL_SCAN` | `STAFF_SIGNOFF` | `LAB_CROSSMATCH`)
- `fulfilled_at` (TIMESTAMPTZ)
- `notes` (TEXT)

### 2.8 `audit_logs`
Immutable audit ledger for healthcare compliance and medical-legal verification.
- `id` (UUID, PK)
- `action` (TEXT)
- `entity_type` (TEXT)
- `entity_id` (UUID)
- `actor_id` (UUID, FK $\to$ `profiles.id`, NULLABLE)
- `details` (JSONB)
- `ip_address` (TEXT)
- `timestamp` (TIMESTAMPTZ DEFAULT NOW())

---

## 3. Database Triggers

### `update_request_outstanding_and_status`
```sql
CREATE OR REPLACE FUNCTION update_request_outstanding_and_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.outstanding_units := GREATEST(NEW.required_units - NEW.secured_units, 0);
    
    IF NEW.outstanding_units = 0 THEN
        NEW.status := 'FULFILLED';
    ELSIF NEW.secured_units > 0 AND NEW.secured_units < NEW.required_units THEN
        NEW.status := 'PARTIALLY_SECURED';
    ELSIF NEW.status = 'FULFILLED' AND NEW.outstanding_units > 0 THEN
        NEW.status := 'ACTIVE';
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Stored Procedures (Atomic RPCs)

### `allocate_blood_unit_atomic`
Locks unit row with `FOR UPDATE` to guarantee serializable safety.
```sql
allocate_blood_unit_atomic(
    p_unit_id UUID,
    p_request_id UUID,
    p_user_id UUID
) RETURNS JSONB;
```

### `confirm_fulfilment_atomic`
Validates authorized medical staff role, locks request row, inserts fulfilment certificate, increments secured count, logs to audit ledger.
```sql
confirm_fulfilment_atomic(
    p_request_id UUID,
    p_unit_id UUID,
    p_donor_id UUID,
    p_verified_by UUID,
    p_verification_method TEXT,
    p_notes TEXT
) RETURNS JSONB;
```
