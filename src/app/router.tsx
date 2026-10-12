// src/app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { StandaloneLoginPage } from '../features/auth/StandaloneLoginPage';
import { UnauthorizedPage } from '../features/auth/UnauthorizedPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { RoleGuard } from '../features/auth/RoleGuard';
import { AppShell } from '../components/layout/AppShell';

// Intern features
import { InternDashboard } from '../features/intern/dashboard/InternDashboard';
import { TasksPage } from '../features/intern/tasks/TasksPage';
import { TaskDetailPage } from '../features/intern/tasks/TaskDetailPage';
import { AssignmentsPage } from '../features/intern/assignments/AssignmentsPage';
import { InternProfilePage } from '../features/intern/profile/InternProfilePage';
import { AttendancePage } from '../features/intern/attendance/AttendancePage';

// Mentor features
import { MentorDashboard } from '../features/mentor/dashboard/MentorDashboard';
import { MyInternsPage } from '../features/mentor/interns/MyInternsPage';
import { MentorTasksPage } from '../features/mentor/tasks/MentorTasksPage';
import { MentorAssignmentsPage } from '../features/mentor/assignments/MentorAssignmentsPage';
import { ReviewsPage } from '../features/mentor/reviews/ReviewsPage';
import { MentorAttendancePage } from '../features/mentor/attendance/MentorAttendancePage';
import { MentorProfilePage } from '../features/mentor/profile/MentorProfilePage';

// Admin features
import { AdminDashboard } from '../features/admin/dashboard/AdminDashboard';
import { InternshipsPage } from '../features/admin/internships/InternshipsPage';
import { InternsAdminPage } from '../features/admin/interns/InternsAdminPage';
import { MentorsAdminPage } from '../features/admin/mentors/MentorsAdminPage';
import { CredentialsPage } from '../features/admin/credentials/CredentialsPage';
import { AdminTasksPage } from '../features/admin/tasks/AdminTasksPage';
import { AdminAssignmentsPage } from '../features/admin/assignments/AdminAssignmentsPage';
import { ActivityLogsPage } from '../features/admin/activity-logs/ActivityLogsPage';
import { ReportsPage } from '../features/admin/reports/ReportsPage';
import { SettingsPage } from '../features/admin/settings/SettingsPage';
import { AdminAttendancePage } from '../features/admin/attendance/AdminAttendancePage';
import { AdminBroadcastPage } from '../features/admin/announcements/AdminBroadcastPage';
import { MaintenanceModePage } from '../features/admin/maintenance/MaintenanceModePage';
import { AdminAuthSecurityPage } from '../features/admin/auth-security/AdminAuthSecurityPage';
import { TeamPermissionsPage } from '../features/admin/permissions/TeamPermissionsPage';
import { AdminBackupPage } from '../features/admin/backup/AdminBackupPage';
import { SupabaseDatabasePage } from '../features/admin/database/SupabaseDatabasePage';

// Shared
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { useAuth } from '../hooks/useAuth';

function RootInternLogin() {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (session && role) {
    if (role === 'intern') return <Navigate to="/intern" replace />;
    if (role === 'mentor') return <Navigate to="/mentor" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
  }

  // Root loads the Intern login directly
  return <StandaloneLoginPage role="intern" />;
}

function MentorEntry() {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Verifying mentor credentials...</p>
        </div>
      </div>
    );
  }

  // If logged in as mentor, show mentor dashboard within AppShell
  if (session && role === 'mentor') {
    return (
      <AppShell>
        <MentorDashboard />
      </AppShell>
    );
  }

  // If logged in as another role, redirect to unauthorized
  if (session && role && role !== 'mentor') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Unauthenticated: render Mentor Login directly
  return <StandaloneLoginPage role="mentor" />;
}

function AdminEntry() {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  // If logged in as admin, show admin dashboard within AppShell
  if (session && role === 'admin') {
    return (
      <AppShell>
        <AdminDashboard />
      </AppShell>
    );
  }

  // If logged in as another role, redirect to unauthorized
  if (session && role && role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Unauthenticated: render Admin Login directly
  return <StandaloneLoginPage role="admin" />;
}

export const router = createBrowserRouter([
  // Root URL: Intern Login directly (or redirect to active workspace if authenticated)
  {
    path: '/',
    element: <RootInternLogin />,
  },
  // Dedicated Mentor Route: Mentor Login if unauthenticated, or Mentor Dashboard if authenticated
  {
    path: '/mentor',
    element: <MentorEntry />,
  },
  // Dedicated Admin Route: Admin Login if unauthenticated, or Admin Dashboard if authenticated
  {
    path: '/admin',
    element: <AdminEntry />,
  },
  // Backward compatibility redirects for legacy /genmitraworkspace URLs
  {
    path: '/genmitraworkspace',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/genmitraworkspace/intern',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/genmitraworkspace/mentor',
    element: <Navigate to="/mentor" replace />,
  },
  {
    path: '/genmitraworkspace/admin',
    element: <Navigate to="/admin" replace />,
  },
  // Unified multi-role login route
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/login/intern',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/login/mentor',
    element: <Navigate to="/mentor" replace />,
  },
  {
    path: '/login/admin',
    element: <Navigate to="/admin" replace />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      // Intern portal
      {
        element: <RoleGuard allow={['intern']} />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/intern', element: <InternDashboard /> },
              { path: '/intern/tasks', element: <TasksPage /> },
              { path: '/intern/tasks/:code', element: <TaskDetailPage /> },
              { path: '/intern/assignments', element: <AssignmentsPage /> },
              { path: '/intern/assignments/:code', element: <AssignmentsPage /> },
              { path: '/intern/attendance', element: <AttendancePage /> },
              { path: '/intern/notifications', element: <NotificationsPage /> },
              { path: '/intern/profile', element: <InternProfilePage /> },
            ],
          },
        ],
      },

      // Mentor portal
      {
        element: <RoleGuard allow={['mentor']} />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/mentor', element: <MentorDashboard /> },
              { path: '/mentor/interns', element: <MyInternsPage /> },
              { path: '/mentor/interns/:internId', element: <MyInternsPage /> },
              { path: '/mentor/tasks', element: <MentorTasksPage /> },
              { path: '/mentor/tasks/new', element: <MentorTasksPage /> },
              { path: '/mentor/tasks/:code', element: <TaskDetailPage /> },
              { path: '/mentor/assignments', element: <MentorAssignmentsPage /> },
              { path: '/mentor/assignments/new', element: <MentorAssignmentsPage /> },
              { path: '/mentor/reviews', element: <ReviewsPage /> },
              { path: '/mentor/attendance', element: <MentorAttendancePage /> },
              { path: '/mentor/notifications', element: <NotificationsPage /> },
              { path: '/mentor/activity', element: <ActivityLogsPage /> },
              { path: '/mentor/profile', element: <MentorProfilePage /> },
            ],
          },
        ],
      },

      // Admin portal
      {
        element: <RoleGuard allow={['admin']} />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/admin', element: <AdminDashboard /> },
              { path: '/admin/internships', element: <InternshipsPage /> },
              { path: '/admin/interns', element: <InternsAdminPage /> },
              { path: '/admin/mentors', element: <MentorsAdminPage /> },
              { path: '/admin/attendance', element: <AdminAttendancePage /> },
              { path: '/admin/credentials', element: <CredentialsPage /> },
              { path: '/admin/tasks', element: <AdminTasksPage /> },
              { path: '/admin/assignments', element: <AdminAssignmentsPage /> },
              { path: '/admin/reviews', element: <ReviewsPage /> },
              { path: '/admin/notifications', element: <NotificationsPage /> },
              { path: '/admin/activity-logs', element: <ActivityLogsPage /> },
              { path: '/admin/reports', element: <ReportsPage /> },
              { path: '/admin/broadcast', element: <AdminBroadcastPage /> },
              { path: '/admin/maintenance', element: <MaintenanceModePage /> },
              { path: '/admin/auth-security', element: <AdminAuthSecurityPage /> },
              { path: '/admin/permissions', element: <TeamPermissionsPage /> },
              { path: '/admin/database', element: <SupabaseDatabasePage /> },
              { path: '/admin/backup', element: <AdminBackupPage /> },
              { path: '/admin/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
