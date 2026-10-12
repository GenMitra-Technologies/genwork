# Genmitra / InternOS Platform — Deployment & Continuous Sync Guide

This repository is connected directly to GitHub and the live Supabase cloud backend. Follow the instructions below for continuous deployment and automatic synchronization.

---

## 1. Live Backend & Supabase Configuration

- **Supabase Project URL:** `https://jgjiakofetyiimtobhey.supabase.co`
- **Dashboard:** [https://supabase.com/dashboard/project/jgjiakofetyiimtobhey](https://supabase.com/dashboard/project/jgjiakofetyiimtobhey)
- **Database Engine:** PostgreSQL 15 (AWS ap-south-1 Mumbai)
- **Connected Keys:**
  - `VITE_SUPABASE_URL`: `https://jgjiakofetyiimtobhey.supabase.co`
  - `VITE_SUPABASE_ANON_KEY`: Configured in `.env`
  - Service Role Key: Securely stored and used for automated server-side sync scripts.

### Live Seed Data & Backend Verification:
To re-seed or verify all 14 core tables (`profiles`, `internships`, `mentors`, `interns`, `tasks`, `task_assignments`, `announcements`, etc.) in the live Supabase database at any time, run:
```bash
node scripts/seedSupabaseLive.cjs
```

---

## 2. GitHub Continuous Deployment (Every Change)

- **GitHub Repository:** [https://github.com/manoharchalla-in/genwork.git](https://github.com/manoharchalla-in/genwork.git)
- **Default Branch:** `main`

### How Every Change is Deployed:
Whenever code changes, new features, or fixes are made, run:
```bash
# 1. Verify types & tests pass
npx tsc --noEmit
npm test -- --run

# 2. Stage all modifications
git add .

# 3. Commit with semantic description
git commit -m "feat/fix: describe your changes"

# 4. Push directly to remote repository
git push origin main
```

---

## 3. Recommended Automated Sync Workflow (Git Pre-Push Hook)

To guarantee that tests pass and every commit automatically pushes to GitHub without manual friction:

1. **Local Dev Server:**
   ```bash
   npm run dev
   ```
2. **Production Build:**
   ```bash
   npm run build
   ```

---

## 4. Admin Panel Telemetry & Auto-Backup Options

The platform includes two dedicated administrative management interfaces:
1. **Supabase Database (`/admin/database`):**
   - Live quota usage meter (e.g. `500 MB` free tier consumption).
   - Real-time row counts across all 14 tables.
   - S3-compliant storage bucket inspection (`avatars`, `task-deliverables`, `database-snapshots`).
2. **Auto-Backup & Export (`/admin/backup`):**
   - Configurable recurring snapshots (Hourly, Daily, Weekly).
   - Retention policy (7, 30, or 90 days).
   - One-click full database & state export to timestamped `.json` file.
