# GenMitra Enterprise Internship & Mentorship Workspace

A production-grade, enterprise-scale Internship and Mentorship Workspace engineered with **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL, Auth, RLS, RPCs, Storage, Realtime, Automated Backups)**.

---

## 1. System Architecture & Core Principles

1. **Postgres as the Authoritative Single Source of Truth**:
   - Relational entity transitions (`pending` → `in_progress` → `waiting_for_review` → `approved` / `changes_requested`) are strictly enforced via PostgreSQL `SECURITY DEFINER` RPC functions and transition constraint triggers.
   - Database schemas, RLS policies, indexes, and views maintain multi-tenant cohort integrity.
2. **Immutable Audit Trails & Versioned Deliverables**:
   - Submissions (`task_submissions`), reviews (`reviews`), events (`task_events`), and audit trails (`activity_logs`) are strictly append-only.
   - Each submission preserves GitHub repositories, live deployment URLs, and revision feedback history.
3. **Strict Row Level Security (RLS)**:
   - RLS is active on all tables with default `DENY`.
   - Security helper functions (`current_user_role()`, `is_admin()`, `current_mentor_id()`, `current_intern_id()`) isolate intern, mentor, and administrative data.
4. **Authoritative Offer & Operational Profile Engine**:
   - Incorporates the authoritative candidate operational profile card with sealed offer terms, verified roll identifiers, mentor assignment, and departmental governance.
5. **Session Governance & Role Guards**:
   - Client routes are strictly protected by `RoleGuard` and `ProtectedRoute`.
   - Unauthorized navigation or direct URL tampering triggers immediate redirect to `/unauthorized`.
   - Idle timeouts and token refreshes are handled transparently.

---

## 2. Production Role Architecture & Authorized Directory

All dummy, sample, and demo accounts have been permanently purged from both the Supabase database and local application state. Access is strictly partitioned across authenticated accounts:

| Role | Name | Identifier / Roll ID | Email / Username | Responsibilities & Access |
| :--- | :--- | :--- | :--- | :--- |
| **Intern** | Sindhu Gangisetty | `24ht1a4346` | `sindhugangisetty910@gmail.com` *(or `sindhu`)* | Frontend Developer, Engineering cohort tasks, deliverable submissions, daily attendance punch, operational profile card |
| **Mentor** | Kapu Mani Shankar Reddy | CTO & Engineering Lead | `manireddy@genmitra.com` *(or `manireddy`)* | CTO & Cohort Mentor, curriculum authoring, review queue evaluation, mentee progress monitoring |
| **Admin** | GenMitra Operations | Superadmin | `ops@genmitra.com` *(or `admin`)* | System administrator, workforce directory, credential management, broadcast announcements, backup & Supabase health |

> 🔒 **Security Notice:** Production credentials are authenticated securely via Supabase Auth and private administrative dispatch. Plaintext passwords are strictly never published to public repositories.

## 3. Production Security Checklist Compliance

- [x] **Zero Leaked Secrets in Version Control**: `.env` and `.env.*` are strictly excluded in `.gitignore`. Scripts use `getEnv.cjs` to dynamically read environment variables without committing tokens.
- [x] **Hardcoded Service-Role Keys Purged**: Confirmed 0 occurrences of private keys across all git-tracked files.
- [x] **Clean Production Dataset**: All demo users (`admin@internship.org`, `mentor.alex@...`, `intern.david@...`, etc.) purged from database `auth.users` and application tables.
- [x] **Robust Authentication & Password Policy**: Validated with live Supabase authentication and synchronized auth state.
- [x] **Role-Based Access Control (RBAC)**: Separated portals (`/intern`, `/mentor`, `/admin`) with route guards preventing privilege escalation.
- [x] **Strict Input Validation**: Zod schema validation applied across task submissions (validating GitHub URL and https format), task authoring, and review evaluations.
- [x] **Automated Database Backups**: Integrated Supabase backup engine with JSON/SQL table exports and storage telemetry dashboard.

---

## 4. Key Workspaces & Route Map

### 🎓 Intern Portal (`/intern`)
- `/intern`: Intern Dashboard (Metrics, Active Streak, Quick Actions)
- `/intern/tasks`: Assigned Curriculum Tasks
- `/intern/tasks/:code`: Interactive Task Detail & Deliverable Submission Modal
- `/intern/assignments`: Structured Coursework & Architectural Quizzes
- `/intern/assignments/:code`: Deep-link to specific Coursework Module
- `/intern/attendance`: Daily Punch Clock & Monthly Shift Hours
- `/intern/notifications`: Live System & Review Notifications
- `/intern/profile`: Authoritative Candidate Operational Profile Card (Offer Terms Sealed)

### 🧑‍🏫 Mentor Portal (`/mentor`)
- `/mentor`: Mentor Dashboard (Queue Velocity, Intern Ratios)
- `/mentor/interns`: Assigned Cohort Mentees Directory
- `/mentor/interns/:internId`: Mentee Profile Inspection Card
- `/mentor/tasks`: Task Assignments & Curriculum Authoring
- `/mentor/tasks/new`: Instant Task Creation Modal
- `/mentor/tasks/:code`: Curriculum Task Review & Inspection
- `/mentor/assignments`: Coursework Management
- `/mentor/assignments/new`: Instant Coursework Creator
- `/mentor/reviews`: Live Review Queue (Approve / Request Changes)
- `/mentor/attendance`: Mentee Shift Attendance Verification
- `/mentor/notifications`: Real-time Mentorship Alerts
- `/mentor/profile`: Mentor Operational Credentials

### 🛡️ Admin Control Center (`/admin`)
- `/admin`: Platform Overview & Ecosystem Analytics
- `/admin/internships`: Cohort Timelines & Scheduling
- `/admin/interns`: Workforce Directory & Mentor Reassignments
- `/admin/mentors`: Mentor Faculty Governance
- `/admin/attendance`: Cohort Compliance & Attendance Regularization
- `/admin/credentials`: User Access & Account Status Toggles
- `/admin/tasks`: Task Directory & Administrative Overrides
- `/admin/assignments`: Coursework Auditing
- `/admin/reviews`: Cross-Cohort Review Logs
- `/admin/broadcast`: System-wide Announcement Dispatcher
- `/admin/maintenance`: Emergency Maintenance Mode & Downtime Scheduler
- `/admin/database`: Live Supabase Health, Connection Metrics & Storage
- `/admin/backup`: Automated Backups & One-Click SQL/JSON Data Export
- `/admin/reports`: Dynamic CSV Analytics Exporter
- `/admin/settings`: Operational Parameters (Session Timeout, Timezones)

---

## 5. Local Setup & Verification

### Prerequisites
- Node.js 18+
- npm 9+

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript compilation verification
npx tsc --noEmit

# 3. Run full Vitest test suite (30/30 tests)
npm test -- --run

# 4. Build optimized production bundle
npm run build

# 5. Start development preview server
npm run dev
```

---

## 6. Live Database Integration

- **Supabase Host**: `https://jgjiakofetyiimtobhey.supabase.co`
- **Database Engine**: PostgreSQL 15
- **Authentication**: Supabase GoTrue Auth
- **Storage Buckets**: `resumes`, `submissions`, `attachments`
