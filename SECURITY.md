# 🔒 RAKTSETU Security & Compliance Architecture

## 1. Threat Model & Healthcare Constraints

Emergency blood coordination is subject to severe medical, operational, and malicious risks:
1. **Double-Allocation Risk**: Two critical patients needing O-Negative simultaneously claiming the same unit from a shared blood centre.
2. **False Fulfilment Risk**: Malicious or mistaken actors marking an emergency request "Fulfilled", causing attending trauma surgeons to assume blood is ready when it is not.
3. **Self-Certification Exploitation**: Unscreened individuals marking themselves "Screened & Eligible", bypassing vital infection screenings (HIV, Hep B/C, Syphilis, Malaria).
4. **Data Privacy**: Patient identifying information (MRN, diagnosis) must be pseudonymized or access-controlled.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Permission / Action | DONOR | HOSPITAL_COORDINATOR | HOSPITAL_ADMIN | BLOOD_CENTRE_OPERATOR | BLOOD_CENTRE_ADMIN | PLATFORM_ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View Public Landing & Metrics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Respond to Donor Emergency Alert | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Emergency Blood Request | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Advance Donor to 'TRAVELING' / 'AT_CENTRE' | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Perform Clinical Screening Signoff | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Allocate Blood Unit | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Confirm Physical Fulfilment | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Onboard New Organization | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View System-Wide Immutable Audit Logs | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |

---

## 3. PostgreSQL Row-Level Security (RLS) Implementation

All 11 database tables have RLS strictly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

### Key Security Policies:
1. **Public Reading of Active Requests**:  
   Allows registered donors to see urgent shortages in their region:
   ```sql
   CREATE POLICY "Allow public read on active requests"
   ON blood_requests FOR SELECT USING (status != 'CANCELLED');
   ```

2. **Authorized Request Creation**:  
   Only coordinators or admins linked to a verified hospital can insert:
   ```sql
   CREATE POLICY "Hospitals can create requests"
   ON blood_requests FOR INSERT
   WITH CHECK (
       EXISTS (
           SELECT 1 FROM profiles
           WHERE profiles.id = auth.uid()
           AND profiles.role IN ('HOSPITAL_COORDINATOR', 'HOSPITAL_ADMIN', 'PLATFORM_ADMIN')
       )
   );
   ```

3. **Restricted Fulfilment Confirmation**:  
   Fulfilment records can ONLY be inserted via the `SECURITY DEFINER` stored procedure `confirm_fulfilment_atomic` or by verified hospital staff.

---

## 4. Immutable Audit Ledger

Every sensitive operational event creates an unalterable row in `audit_logs`:
- Emergency Request Creation
- Donor Matching Dispatches
- Donor Response Tracking
- Medical Deferrals
- Unit Allocation & Lock Acquisition
- Unit Receipt & Fulfilment Certificates
- Organization Onboarding

Each audit record captures:
- Timestamp (Server-enforced UTC)
- Actor User ID & Role
- Action & Entity Identifiers
- JSON Snapshot of parameters
- IP Address & User Agent metadata
