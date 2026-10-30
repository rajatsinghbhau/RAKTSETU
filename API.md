# 🔌 RAKTSETU API & Backend Services Reference

The frontend interacts with the PostgreSQL backend through the service layer located at `src/services/realBackend.ts`, built on `@supabase/supabase-js`.

---

## 1. Authentication Services

### `signUp(email, password, fullName, role, phone, organizationId)`
Registers a real user in Supabase GoTrue Auth, creates their `profiles` row, and if role is `DONOR`, creates a corresponding `donor_profiles` row with cooling period tracking.

### `signIn(email, password)`
Authenticates session and resolves the user's role and organization membership.

### `signOut()`
Terminates local session and revokes tokens.

### `getCurrentUserSession()`
Returns current `auth.users` session accompanied by verified profile and organization metadata.

---

## 2. Emergency Request Services

### `createEmergencyRequest(requestData)`
Creates a real blood request in `blood_requests`.
- Enforces duplicate detection (same patient + blood group within 2 hours).
- Automatically triggers compatible donor matching.
- Creates audit log entry.

### `getActiveRequests()`
Fetches active emergency requests sorted by urgency (`CRITICAL` > `HIGH` > `STANDARD`) and deadline.

### `getRequestById(id)`
Fetches single request along with allocated blood units and linked donor journeys.

---

## 3. Donor Coordination Services

### `matchAndAlertDonors(requestId, bloodGroup, city)`
Finds registered donors in `donor_profiles` matching ABO/Rh compatibility criteria whose cooling period has elapsed, and creates `donor_journeys` rows with status `ALERTED`.

### `recordDonorResponse(journeyId, accepted, reason)`
Records donor response (`RESPONDED_YES` or `RESPONDED_NO`).
> **Important**: This operation does **NOT** increment secured units.

### `generateWhatsAppAlertUrl(params)`
Generates an encoded WhatsApp deep-link (`https://wa.me/<phone>?text=...`) containing:
- Patient emergency details (anonymized/MRN)
- Blood group & component needed
- Outstanding units deficit
- Hospital destination and Google Maps link
- Realtime response token link
Enables instant one-click dispatch from hospital coordinators to matched donors without external SMS gateways.

### `updateDonorJourneyStage(journeyId, stage, notes)`
Advances a donor through clinical checkpoints:
- Stage 4: `TRAVELING`
- Stage 5: `AT_CENTRE`
- Stage 6: `SCREENING` $\to$ `ELIGIBLE` / `DEFERRED` $\to$ `DONATED`

---

## 4. Cold-Chain Blood Unit Inventory Services

### `addBloodUnit(unitData)`
Registers a tested blood unit into cold storage with unique barcode, blood group, component type, and expiration date.

### `getBloodInventory(bloodCentreId, bloodGroup)`
Retrieves available, reserved, and allocated units.

### `allocateBloodUnit(unitId, requestId, userId)`
Invokes stored procedure `allocate_blood_unit_atomic` to obtain an exclusive row-level lock and allocate the unit to the request.

---

## 5. Fulfilment Services

### `confirmFulfilment(requestId, unitId, donorId, verifiedBy, method, notes)`
Invokes stored procedure `confirm_fulfilment_atomic` to:
- Authenticate clinical signoff
- Atomically increment `secured_units`
- Recalculate `outstanding_units` via trigger
- Issue immutable fulfilment record in `fulfilment_records`
- Write audit log entry in `audit_logs`

---

## 6. Realtime Subscriptions

### `subscribeToRealtimeChanges(onPayload)`
Subscribes to Supabase Realtime WebSocket events across tables:
- `blood_requests`
- `donor_journeys`
- `blood_units`
- `fulfilment_records`
- `audit_logs`

Enables live instant dashboard updates across all connected browser clients without manual refresh.
