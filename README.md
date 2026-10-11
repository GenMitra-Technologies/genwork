# Production-Ready Internship Management Platform

A robust, enterprise-grade Internship Management Platform engineered with **React 18**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL, Auth, RLS, RPCs, Storage, Realtime, Edge Functions)**.

---

## 1. System Architecture & Core Principles

1. **Postgres as the Ultimate Source of Truth**:
   - All state transitions (`pending` → `in_progress` → `submitted` → `approved`/`changes_requested`) are strictly enforced via PostgreSQL `SECURITY DEFINER` RPC functions and transition constraint triggers.
   - Direct `UPDATE` queries on `status` columns are disabled by default.
2. **Append-Only Immutability**:
   - Submissions (`task_submissions`), reviews (`reviews`), event history (`task_events`), and audit trails (`activity_logs`) are strictly append-only.
   - Database triggers prevent any `UPDATE` or `DELETE` operations on historical entities.
3. **Strict Row Level Security (RLS)**:
   - RLS is enabled on all tables with default `DENY`.
   - Helper functions (`current_user_role()`, `is_admin()`, `current_mentor_id()`, `current_intern_id()`, `mentor_owns_intern()`) enforce multi-tenant isolation.
4. **Human-Readable Identifiers**:
   - Sequential IDs (`TSK-0001`, `ASG-0001`, `INT-0001`) are automatically assigned instead of exposing raw UUIDs in the UI.
5. **Session Inactivity & Role Separation**:
   - Auto-logout idle timer triggers after 30 minutes of inactivity and redirects to `/login?reason=expired`.
   - The `/login` page enforces role tab verification (`intern`, `mentor`, `admin`) to prevent cross-portal access.

---

## 2. Seed Credentials & Test Accounts

All accounts below are registered in Supabase Auth and populated with seed data:

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Super Admin | `admin@internship.org` | `Password123!` | System administrator, full oversight, reassignment & status overrides |
| **Mentor 1** | Alex Rivera | `mentor.alex@internship.org` | `Password123!` | Software Engineering Mentor, assigns tasks & reviews submissions |
| **Mentor 2** | Elena Rostova | `mentor.elena@internship.org` | `Password123!` | Data & Cloud Mentor |
| **Intern 1** | David Kim | `intern.david@internship.org` | `Password123!` | Software Engineering Intern assigned to Alex Rivera |
| **Intern 2** | Aisha Patel | `intern.aisha@internship.org` | `Password123!` | Frontend Engineering Intern assigned to Alex Rivera |
| **Intern 3** | Carlos Mendez | `intern.carlos@internship.org` | `Password123!` | Backend Intern assigned to Elena Rostova |
| **Intern 4** | Maya Lin | `intern.maya@internship.org` | `Password123!` | Full-stack Intern assigned to Elena Rostova |

---

## 3. Database Setup & Migration

The complete PostgreSQL database schema, RLS policies, triggers, sequences, views, and storage buckets are consolidated into:

```
supabase/migrations/full_schema_migration.sql
```

### Steps to Apply Schema:
1. Open your Supabase Dashboard: **[Supabase Project Dashboard](https://supabase.com/dashboard/project/jgjiakofetyiimtobhey)**.
2. Navigate to the **SQL Editor** (`/sql/new`).
3. Paste the contents of `supabase/migrations/full_schema_migration.sql` and click **Run**.
4. To populate the demo tasks, assignments, streaks, and timeline events, run `supabase/seed.sql` in the SQL Editor.

---

## 4. Local Development

### Prerequisites:
- Node.js 18+
- npm 9+

### Commands:

```bash
# 1. Install dependencies
npm install

# 2. Run unit & validation test suite
npm test

# 3. Compile and build production bundle
npm run build

# 4. Start local development server
npm run dev
```

The application will launch on `http://localhost:5173`.

---

## 5. Project Directory Structure

```
.
├── src/
│   ├── app/
│   │   ├── router.tsx                # Data router with role-based routes
│   │   └── providers.tsx             # TanStack Query & Toast providers
│   ├── components/
│   │   ├── layout/                   # Sidebar, Topbar, MobileDrawer, AppShell
│   │   ├── shared/                   # Badges, StatCards, Timeline, ConfirmDialog
│   │   └── ui/                       # Accessible UI primitives (Button, Input, Dialog, etc.)
│   ├── features/
│   │   ├── admin/                    # Admin Dashboard, Credentials, Reassignments, Logs
│   │   ├── auth/                     # Login page with role tabs, Unauthorized & RoleGuard
│   │   ├── intern/                   # Intern Dashboard, Task detail, Submissions, Streaks
│   │   ├── mentor/                   # Mentor Dashboard, Review queue, Task creation
│   │   └── notifications/            # Realtime notifications & drawer
│   ├── hooks/                        # useAuth, useRole, useIdleTimeout, useRealtime
│   ├── lib/                          # Supabase client, Formatters, QueryClient, Validators
│   └── types/                        # Database schema types & Domain models
├── supabase/
│   ├── migrations/                   # Individual and full SQL migrations
│   ├── functions/                    # Deno Edge Functions (admin-create-user, etc.)
│   └── seed.sql                      # Complete seed dataset
└── package.json
```

---

## 6. Verification & Quality Assurance

- **Type Safety**: Full TypeScript compilation passing without errors (`tsc --noEmit`).
- **Production Build**: Built and minified with Vite (`npm run build`).
- **Validation**: 13 automated tests covering URL constraints, security sanitization, and workflow payloads passing in Vitest (`npm test`).
