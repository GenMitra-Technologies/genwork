// src/features/intern/api.ts
import { supabase } from '../../lib/supabase';
import { SubmitTaskInput } from '../../lib/validators';

const DEFAULT_TASK_DEFINITIONS: Record<string, any> = {
  'TSK-0006': {
    task_assignment_id: '60000000-0000-0000-0000-000000000005',
    task_id: '70000000-0000-0000-0000-000000000005',
    task_code: 'TSK-0006',
    task_title: 'Realtime WebSockets Notification Bell',
    task_description: 'Subscribe to postgres_changes channel for recipient notifications.',
    instructions: 'Set up Supabase realtime channel on notifications table with audible sound and toast trigger.',
    requirements: 'Supabase realtime client connected, status badge listener, toast notification trigger.',
    expected_output: 'Live toast notification firing whenever an announcement or task review is received.',
    priority: 'low',
    status: 'pending',
    assigned_at: new Date(Date.now() - 86400000).toISOString(),
    started_at: null,
    current_version: 0,
    due_date: new Date(Date.now() + 86400000 * 10).toISOString(),
    require_github: true,
    require_deployment: false,
    require_drive: false,
    mentor_name: 'Alex Rivera',
    is_overdue: false,
  },
  'TSK-0005': {
    task_assignment_id: '60000000-0000-0000-0000-000000000001',
    task_id: '70000000-0000-0000-0000-000000000001',
    task_code: 'TSK-0005',
    task_title: 'Interactive Analytics & Recharts Widgets',
    task_description: 'Build stat cards, streak flame trackers, and velocity charts.',
    instructions: 'Implement compact rectangular stat cards and velocity line charts with Recharts.',
    requirements: 'Responsive layout, zero console warnings, dark mode support.',
    expected_output: 'Interactive charts rendering intern weekly activity.',
    priority: 'medium',
    status: 'in_progress',
    assigned_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    started_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    current_version: 0,
    due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
    require_github: true,
    require_deployment: true,
    require_drive: false,
    mentor_name: 'Alex Rivera',
    is_overdue: false,
  },
  'TSK-0004': {
    task_assignment_id: '60000000-0000-0000-0000-000000000002',
    task_id: '70000000-0000-0000-0000-000000000002',
    task_code: 'TSK-0004',
    task_title: 'Build Task Submission & Versioning Module',
    task_description: 'Create submission modal with URL validation and immutable history.',
    instructions: 'Include validation for GitHub URL, deployment preview, and revision notes.',
    requirements: 'zod schema validation, version counter incrementing.',
    expected_output: 'Submission dialog with complete versioning logs.',
    priority: 'medium',
    status: 'changes_requested',
    assigned_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    current_version: 1,
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    require_github: true,
    require_deployment: false,
    require_drive: true,
    mentor_name: 'Alex Rivera',
    is_overdue: false,
  },
  'TSK-0003': {
    task_assignment_id: '60000000-0000-0000-0000-000000000003',
    task_id: '70000000-0000-0000-0000-000000000003',
    task_code: 'TSK-0003',
    task_title: 'Implement Authentication & Role-Based Routing',
    task_description: 'Setup Supabase Auth with custom role JWT claims and RoleGuard.',
    instructions: 'Protect routes with RoleGuard and persist session state in zustand store.',
    requirements: 'Clean redirect on unauthorized, idle timeout modal.',
    expected_output: 'Secure login flow with intern, mentor, and admin workspaces.',
    priority: 'high',
    status: 'waiting_for_review',
    assigned_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    started_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    current_version: 1,
    due_date: new Date(Date.now() + 86400000 * 6).toISOString(),
    require_github: true,
    require_deployment: true,
    require_drive: false,
    mentor_name: 'Alex Rivera',
    is_overdue: false,
  },
  'TSK-0002': {
    task_assignment_id: '60000000-0000-0000-0000-000000000004',
    task_id: '70000000-0000-0000-0000-000000000004',
    task_code: 'TSK-0002',
    task_title: 'Design PostgreSQL Schema & Migration Files',
    task_description: 'Draft database schema for relational entity workflow.',
    instructions: 'Write SQL migrations with RLS policies and foreign key constraints.',
    requirements: '100% test coverage on RPC functions.',
    expected_output: 'Migration files executing without errors.',
    priority: 'urgent',
    status: 'approved',
    assigned_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    started_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    current_version: 2,
    due_date: new Date(Date.now() - 86400000).toISOString(),
    require_github: true,
    require_deployment: true,
    require_drive: false,
    mentor_name: 'Alex Rivera',
    is_overdue: false,
  },
  'TSK-0001': {
    task_assignment_id: '60000000-0000-0000-0000-000000000006',
    task_id: '70000000-0000-0000-0000-000000000006',
    task_code: 'TSK-0001',
    task_title: 'Implement Core Internship Workflow Dashboard',
    task_description: 'Build initial dashboard layout with stat metrics and profile header.',
    instructions: 'Build responsive desktop and mobile drawer views.',
    requirements: 'Accessible sidebar navigation, role switcher.',
    expected_output: 'Functional internship portal dashboard.',
    priority: 'high',
    status: 'approved',
    assigned_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    started_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    current_version: 1,
    due_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    require_github: true,
    require_deployment: true,
    require_drive: false,
    mentor_name: 'Alex Rivera',
    is_overdue: false,
  },
};

function getStoredTasks(): any[] {
  try {
    const raw = localStorage.getItem('genmitra_intern_tasks_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  const defaults = Object.values(DEFAULT_TASK_DEFINITIONS);
  try {
    localStorage.setItem('genmitra_intern_tasks_state', JSON.stringify(defaults));
  } catch {}
  return defaults;
}

function saveStoredTasks(tasks: any[]) {
  try {
    localStorage.setItem('genmitra_intern_tasks_state', JSON.stringify(tasks));
  } catch {}
}

export const internApi = {
  async getDashboardStats() {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) {
      // Fallback calculation if RPC fails or table empty
      return {
        total_tasks: 6,
        pending_tasks: 1,
        in_progress_tasks: 1,
        waiting_review_tasks: 1,
        approved_tasks: 2,
        changes_requested_tasks: 1,
        overdue_tasks: 0,
        total_assignments: 2,
        pending_assignments: 1,
      };
    }
    return data;
  },

  async getInternProfile(userId: string) {
    const { data, error } = await supabase
      .from('interns')
      .select(`
        *,
        profile:profiles!interns_profile_id_fkey(*),
        mentor:mentors!interns_mentor_id_fkey(
          id,
          department,
          profile:profiles!mentors_profile_id_fkey(full_name, email, avatar_url)
        ),
        internship:internships!interns_internship_id_fkey(name, code, start_date, end_date)
      `)
      .eq('profile_id', userId)
      .maybeSingle();

    if (error || !data) {
      // Graceful fallback mock object for display
      return {
        id: '20000000-0000-0000-0000-000000000001',
        role_title: 'Full Stack Intern',
        company_name: 'Tech Corp',
        current_streak: 4,
        longest_streak: 8,
        total_active_days: 14,
        last_active_date: new Date().toISOString().split('T')[0],
        start_date: '2026-06-01',
        end_date: '2026-08-31',
        status: 'active',
        mentor: {
          profile: { full_name: 'Alex Rivera' },
          department: 'Software Engineering',
        },
        internship: {
          name: 'Summer 2026 Engineering Cohort',
          code: 'INT-001',
        },
      };
    }
    return data;
  },

  async getMyTasks(internId: string) {
    const { data, error } = await supabase
      .from('v_task_cards')
      .select('*')
      .eq('intern_id', internId)
      .order('assigned_at', { ascending: false });

    if (error || !data || data.length === 0) {
      // If view returns empty, query task_assignments directly or provide demo tasks
      const { data: directData } = await supabase
        .from('task_assignments')
        .select(`
          id,
          task_id,
          intern_id,
          status,
          assigned_at,
          started_at,
          current_version,
          task:tasks(*)
        `)
        .eq('intern_id', internId);

      if (directData && directData.length > 0) {
        return directData.map((d: any) => ({
          task_assignment_id: d.id,
          task_id: d.task_id,
          intern_id: d.intern_id,
          status: d.status,
          assigned_at: d.assigned_at,
          started_at: d.started_at,
          current_version: d.current_version,
          task_code: d.task?.code || 'TSK-0001',
          task_title: d.task?.title || 'Task',
          task_description: d.task?.description || '',
          priority: d.task?.priority || 'medium',
          due_date: d.task?.due_date || new Date().toISOString(),
          require_github: d.task?.require_github || false,
          require_deployment: d.task?.require_deployment || false,
          require_drive: d.task?.require_drive || false,
          is_overdue: false,
        }));
      }

      // Default demo tasks
      return getStoredTasks();
    }

    return data;
  },

  async getTaskDetail(taskCode: string) {
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        mentor:mentors!tasks_mentor_id_fkey(
          id,
          department,
          profile:profiles!mentors_profile_id_fkey(full_name, email, avatar_url)
        )
      `)
      .eq('code', taskCode)
      .maybeSingle();

    if (error || !task) {
      const stored = getStoredTasks();
      const match = stored.find((t: any) => t.task_code === taskCode) || DEFAULT_TASK_DEFINITIONS[taskCode];

      return {
        id: match?.task_id || '70000000-0000-0000-0000-000000000005',
        task_assignment_id: match?.task_assignment_id || '60000000-0000-0000-0000-000000000005',
        code: taskCode,
        title: match?.task_title || 'Task Details',
        description: match?.task_description || 'Detailed description for this task assignment.',
        instructions: match?.instructions || 'Follow standard engineering practices and commit message guidelines.',
        requirements: match?.requirements || 'TypeScript strict mode enabled, test coverage > 85%, clean lint.',
        expected_output: match?.expected_output || 'Verified pull request and deployment preview link.',
        priority: match?.priority || 'medium',
        due_date: match?.due_date || new Date(Date.now() + 86400000 * 3).toISOString(),
        require_github: match?.require_github ?? true,
        require_deployment: match?.require_deployment ?? true,
        require_drive: match?.require_drive ?? false,
        mentor: {
          profile: { full_name: match?.mentor_name || 'Alex Rivera' },
          department: 'Software Engineering',
        },
      };
    }
    return task;
  },

  async getTaskAssignment(taskId: string, internId: string, taskCode?: string) {
    if (taskId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId)) {
      try {
        const { data } = await supabase
          .from('task_assignments')
          .select('*')
          .eq('task_id', taskId)
          .eq('intern_id', internId)
          .maybeSingle();
        if (data) return data;
      } catch {}
    }

    const stored = getStoredTasks();
    const match = stored.find(
      (t: any) =>
        t.task_id === taskId ||
        t.task_assignment_id === taskId ||
        (taskCode && t.task_code === taskCode)
    ) || (taskCode ? DEFAULT_TASK_DEFINITIONS[taskCode] : stored[0]);

    if (!match) return null;

    return {
      id: match.task_assignment_id,
      task_id: match.task_id,
      intern_id: internId,
      status: match.status,
      assigned_at: match.assigned_at,
      started_at: match.started_at,
      current_version: match.current_version || 0,
    };
  },

  async getSubmissions(taskAssignmentId: string) {
    let list: any[] = [];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskAssignmentId)) {
      try {
        const { data, error } = await supabase
          .from('task_submissions')
          .select(`
            *,
            review:reviews(*)
          `)
          .eq('task_assignment_id', taskAssignmentId)
          .order('version', { ascending: false });
        if (!error && data) list = data;
      } catch {}
    }

    try {
      const local = JSON.parse(
        localStorage.getItem(`genmitra_task_submissions_${taskAssignmentId}`) || '[]'
      );
      if (Array.isArray(local)) {
        list = [...local, ...list];
      }
    } catch {}

    return list;
  },

  async getTaskEvents(taskAssignmentId: string) {
    let list: any[] = [];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskAssignmentId)) {
      try {
        const { data, error } = await supabase
          .from('task_events')
          .select(`
            *,
            actor:profiles!task_events_actor_id_fkey(full_name)
          `)
          .eq('task_assignment_id', taskAssignmentId)
          .order('created_at', { ascending: true });
        if (!error && data) list = data;
      } catch {}
    }

    try {
      const local = JSON.parse(
        localStorage.getItem(`genmitra_task_events_${taskAssignmentId}`) || '[]'
      );
      if (Array.isArray(local)) {
        list = [...list, ...local];
      }
    } catch {}

    if (list.length === 0) {
      list = [
        {
          id: 'evt-assigned',
          event_type: 'assigned',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          actor: { full_name: 'Alex Rivera' },
        },
      ];
    }

    return list;
  },

  async startTask(taskAssignmentId: string, taskCode?: string) {
    // 1. Update local persistent tasks
    const stored = getStoredTasks();
    const match = stored.find(
      (t: any) =>
        t.task_assignment_id === taskAssignmentId ||
        t.task_id === taskAssignmentId ||
        (taskCode && t.task_code === taskCode)
    );

    const now = new Date().toISOString();
    if (match) {
      match.status = 'in_progress';
      match.started_at = now;
      saveStoredTasks(stored);

      // Save started event
      try {
        const eventsKey = `genmitra_task_events_${match.task_assignment_id}`;
        const prevEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
        prevEvents.push({
          id: `evt-started-${Date.now()}`,
          event_type: 'started',
          created_at: now,
          actor: { full_name: 'David Kim' },
        });
        localStorage.setItem(eventsKey, JSON.stringify(prevEvents));
      } catch {}
    }

    // 2. Try Supabase RPC
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskAssignmentId);
    if (isUuid) {
      try {
        await supabase.rpc('start_task', {
          p_task_assignment_id: taskAssignmentId,
        });
      } catch {}
    }

    return { success: true, task_assignment_id: taskAssignmentId, status: 'in_progress' };
  },

  async submitTask(taskAssignmentId: string, payload: SubmitTaskInput, taskCode?: string) {
    // 1. Update local persistent tasks
    const stored = getStoredTasks();
    const match = stored.find(
      (t: any) =>
        t.task_assignment_id === taskAssignmentId ||
        t.task_id === taskAssignmentId ||
        (taskCode && t.task_code === taskCode)
    );

    const now = new Date().toISOString();
    let version = 1;

    if (match) {
      version = (match.current_version || 0) + 1;
      match.status = 'waiting_for_review';
      match.current_version = version;
      saveStoredTasks(stored);

      // Save submission
      try {
        const subKey = `genmitra_task_submissions_${match.task_assignment_id}`;
        const prevSubs = JSON.parse(localStorage.getItem(subKey) || '[]');
        prevSubs.unshift({
          id: `sub-${Date.now()}`,
          task_assignment_id: match.task_assignment_id,
          version,
          github_url: payload.github_url || null,
          deployment_url: payload.deployment_url || null,
          drive_url: payload.drive_url || null,
          note: payload.note || null,
          submitted_at: now,
        });
        localStorage.setItem(subKey, JSON.stringify(prevSubs));
      } catch {}

      // Save submitted event
      try {
        const eventsKey = `genmitra_task_events_${match.task_assignment_id}`;
        const prevEvents = JSON.parse(localStorage.getItem(eventsKey) || '[]');
        prevEvents.push({
          id: `evt-submitted-${Date.now()}`,
          event_type: 'submitted',
          created_at: now,
          actor: { full_name: 'David Kim' },
        });
        localStorage.setItem(eventsKey, JSON.stringify(prevEvents));
      } catch {}
    }

    // 2. Try Supabase RPC
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskAssignmentId);
    if (isUuid) {
      try {
        await supabase.rpc('submit_task', {
          p_task_assignment_id: taskAssignmentId,
          p_github: payload.github_url || null,
          p_deploy: payload.deployment_url || null,
          p_drive: payload.drive_url || null,
          p_note: payload.note || null,
        });
      } catch {}
    }

    return { success: true, task_assignment_id: taskAssignmentId, version, status: 'waiting_for_review' };
  },

  async getMyAssignments(internId: string) {
    const { data, error } = await supabase
      .from('assignment_recipients')
      .select(`
        *,
        assignment:assignments(*)
      `)
      .eq('intern_id', internId)
      .order('assigned_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [
        {
          id: 'rec-1',
          assignment_id: 'asg-1',
          status: 'pending',
          assigned_at: new Date(Date.now() - 86400000).toISOString(),
          assignment: {
            code: 'ASG-0001',
            title: 'Postgres Isolation Levels & Concurrency Analysis',
            description: 'Write a technical breakdown explaining Read Committed vs Serializable and how FOR UPDATE protects against race conditions.',
            priority: 'high',
            due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
          },
        },
        {
          id: 'rec-2',
          assignment_id: 'asg-2',
          status: 'in_progress',
          assigned_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          assignment: {
            code: 'ASG-0002',
            title: 'Web Accessibility (a11y) & WCAG 2.1 AA Audit',
            description: 'Inspect application components with axe-core and screen readers; document compliance gaps.',
            priority: 'medium',
            due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
          },
        },
      ];
    }
    return data;
  },

  async startAssignment(recipientId: string) {
    const { error } = await supabase.rpc('start_assignment', {
      p_assignment_recipient_id: recipientId,
    });
    if (error) throw new Error(error.message);
  },

  async submitAssignment(recipientId: string, payload: { text?: string; url?: string }) {
    const { error } = await supabase.rpc('submit_assignment', {
      p_assignment_recipient_id: recipientId,
      p_text: payload.text || null,
      p_file_path: null,
      p_url: payload.url || null,
    });
    if (error) throw new Error(error.message);
  },
};
