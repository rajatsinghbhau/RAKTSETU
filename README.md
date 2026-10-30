# 🩸 RAKTSETU (रक्तसेतु)
### Production-Grade Emergency Blood Fulfilment & Coordination Platform
> **Core Axiom: "DON'T JUST FIND A DONOR. SECURE THE BLOOD."**  
> *Equation: $\text{Required Units} - \text{Secured Units} = \text{Outstanding Deficit}$*

---

## 🌟 Overview

**RAKTSETU** is a real-time, mission-critical healthcare application engineered to manage the high-stakes journey from an emergency blood request to verified clinical fulfilment.

Unlike generic blood donation apps that treat a donor clicking "Yes" as mission accomplished, RAKTSETU explicitly decouples **donor willingness** from **blood security**. A donor response is merely an intention; blood is only classified as **Secured** once an eligible donor completes clinical screening, phlebotomy, and testing, or when an authenticated, crossmatched unit from cold storage is officially received and verified by authorized hospital personnel.

### Live Production Backend
- **Dedicated Supabase Project**: `https://ebrjeajrkchfsifwbakg.supabase.co`
- **Realtime WebSocket Channel**: Active multi-table publication (`supabase_realtime`)
- **Row-Level Security (RLS)**: Enforced across all 11 relational tables
- **Concurrency Protections**: Atomic PostgreSQL stored procedures preventing double-allocation race conditions

---

## 🎯 The Fulfilment Equation

$$\mathbf{Required} - \mathbf{Secured} = \mathbf{Outstanding}$$

| Metric | Definition | Healthcare Reality |
|---|---|---|
| **Required** | Total clinical units demanded by the attending physician | Non-negotiable baseline |
| **Secured** | Units verified in hospital blood bank or received at bedside | The ONLY metric that saves lives |
| **Outstanding** | The active deficit ($\max(\text{Required} - \text{Secured}, 0)$) | Must reach exactly **0** for fulfilment |
| **Pledged / In-Transit** | Donors traveling, screening, or units dispatched | Informational indicators; **NEVER reduces deficit** |

---

## 🚀 Key Features

### 1. Dual Independent State Machines
1. **Donor Journey State Machine**:  
   `MATCHED` $\to$ `ALERTED` $\to$ `RESPONDED_YES` $\to$ `TRAVELING` $\to$ `AT_CENTRE` $\to$ `SCREENING` $\to$ (`ELIGIBLE` $\to$ `DONATED` / `DEFERRED`)
2. **Cold-Chain Blood Inventory State Machine**:  
   `AVAILABLE` $\to$ `RESERVED` $\to$ `ALLOCATED` $\to$ `PACKED` $\to$ `DISPATCHED` $\to$ `DELIVERED` $\to$ `CROSSMATCHED` $\to$ `TRANSFUSED`

### 2. Multi-Track Supply Mobilization
- **Track 1 (Rapid Reserves)**: Instant reserve reservation from authorized blood centres.
- **Track 2 (Targeted Directed Mobilization)**: Geo-fenced, blood-group-compatible verified donor dispatch.
- **Track 3 (Automated Escalation)**: Automated backup wave triggers if the deficit remains after countdown expiry.

### 3. Medical Integrity & Safety
- **No Self-Certification**: Donors cannot verify their own eligibility or mark donations complete. Only licensed medical staff and blood centre coordinators have administrative rights.
- **ABO/Rh Compatibility Engine**: Built-in clinical matrix for Whole Blood, PRBC, and Fresh Frozen Plasma compatibility.
- **Time-to-Secure Tracking**: Live countdown timers measuring time to clinical security rather than response speed.
- **Anti-Fatigue Cooling**: 90-day donation interval locks automatically enforced on donor profiles.

### 4. Concurrency & Concurrency Locks
- Atomic PostgreSQL transactions with `SELECT ... FOR UPDATE` row-level locks prevent two hospitals from reserving or allocating the same rare blood unit simultaneously.
- Atomic fulfillment procedures (`confirm_fulfilment_atomic`) increment secured counts, decrement outstanding deficits, and log immutable cryptographic-grade audit records.

---

## 🏗️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Vanilla High-Performance CSS (Dark Glassmorphic Clinical Palette), Lucide Icons
- **Backend**: Live Supabase PostgreSQL with Realtime WebSockets (`supabase-js`)
- **Security**: Supabase GoTrue Auth, Row-Level Security (RLS) policies, Stored Procedures (`SECURITY DEFINER`)
- **State Management**: Reactive Supabase WebSocket event streams

---

## 📂 Project Structure

```
c:\Users\rajat\OneDrive\Desktop\Hackathon\
├── src/
│   ├── components/
│   │   ├── AdminAuditorDashboard.tsx   # Supabase immutable audit logs & org management
│   │   ├── AuthModal.tsx               # Real Supabase login & registration
│   │   ├── BloodCentreDashboard.tsx    # Cold-chain blood inventory & atomic allocation
│   │   ├── DonorDashboard.tsx          # Real-time donor response & mobilization portal
│   │   ├── FulfilmentCommandCentre.tsx # Central command center & equation HUD
│   │   ├── HospitalDashboard.tsx       # Emergency request creation & donor journey tracking
│   │   ├── LandingPage.tsx             # Interactive overview & live simulation
│   │   └── Navbar.tsx                  # Global navigation, auth badge & realtime indicators
│   ├── services/
│   │   ├── realBackend.ts              # Supabase REST, RPC, and Realtime integration
│   │   ├── stateMachines.ts            # State machines & clinical ABO/Rh compatibility
│   │   └── supabaseClient.ts           # Supabase client singleton
│   ├── types/
│   │   └── index.ts                    # PostgreSQL data models & TypeScript definitions
│   ├── App.tsx                         # Root router & realtime synchronization
│   ├── index.css                       # Clinical high-contrast theme styling
│   └── main.tsx                        # Application entry point
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # Full PostgreSQL schema, triggers & stored procedures
├── ARCHITECTURE.md                     # Detailed system architecture document
├── DATABASE.md                         # Database schemas, tables, relationships & RPCs
├── SECURITY.md                         # Role-based access control (RBAC) & RLS policies
└── API.md                              # Backend service endpoints & procedure signatures
```

---

## ⚙️ Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Supabase project or account

### 2. Environment Setup
Create a `.env.local` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://ebrjeajrkchfsifwbakg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Database Migration
Run the SQL migration in `supabase/migrations/001_initial_schema.sql` via your Supabase SQL Editor.

### 4. Development Server
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build for production
npm run build
```

---

## 🛡️ License & Medical Disclaimer
RAKTSETU is engineered for healthcare coordination. All clinical decisions regarding donor qualification, phlebotomy, crossmatching, and transfusion must be made by qualified medical personnel in adherence to statutory national blood transfusion standards.
