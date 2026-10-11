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
import { ActivityLogsPage } from '../features/admin/activity-logs/ActivityLogsPage';
import { ReportsPage } from '../features/admin/reports/ReportsPage';
import { SettingsPage } from '../features/admin/settings/SettingsPage';
import { AdminAttendancePage } from '../features/admin/attendance/AdminAttendancePage';

// Shared
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { useAuth } from '../hooks/useAuth';

function RootRedirect() {
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

  return <Navigate to="/genmitraworkspace" replace />;
}

export const router = createBrowserRouter([
  // Root Redirect to appropriate role workspace or login
  {
    path: '/',
    element: <RootRedirect />,
  },
  // Primary Genmitra Workspace Login Routes
  {
    path: '/genmitraworkspace',
    element: <LoginPage />,
  },
  {
    path: '/genmitraworkspace/intern',
    element: <StandaloneLoginPage role="intern" />,
  },
  {
    path: '/genmitraworkspace/mentor',
    element: <StandaloneLoginPage role="mentor" />,
  },
  {
    path: '/genmitraworkspace/admin',
    element: <StandaloneLoginPage role="admin" />,
  },
  // Backward-compatible redirects
  {
    path: '/login',
    element: <Navigate to="/genmitraworkspace" replace />,
  },
  {
    path: '/login/intern',
    element: <Navigate to="/genmitraworkspace/intern" replace />,
  },
  {
    path: '/login/mentor',
    element: <Navigate to="/genmitraworkspace/mentor" replace />,
  },
  {
    path: '/login/admin',
    element: <Navigate to="/genmitraworkspace/admin" replace />,
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
              { path: '/mentor/assignments', element: <AssignmentsPage /> },
              { path: '/mentor/assignments/new', element: <AssignmentsPage /> },
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
              { path: '/admin/assignments', element: <AssignmentsPage /> },
              { path: '/admin/reviews', element: <ReviewsPage /> },
              { path: '/admin/notifications', element: <NotificationsPage /> },
              { path: '/admin/activity-logs', element: <ActivityLogsPage /> },
              { path: '/admin/reports', element: <ReportsPage /> },
              { path: '/admin/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/genmitraworkspace" replace />,
  },
]);
