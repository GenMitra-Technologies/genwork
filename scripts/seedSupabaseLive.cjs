// scripts/seedSupabaseLive.cjs
const https = require('https');
const { getEnv } = require('./getEnv.cjs');

const env = getEnv();
const SUPABASE_URL = (env.VITE_SUPABASE_URL || 'https://jgjiakofetyiimtobhey.supabase.co').replace(/^https?:\/\//, '');
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required in environment variables or .env file.');
  process.exit(1);
}

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const req = https.request(
      {
        hostname: SUPABASE_URL,
        path: `/rest/v1/${path}`,
        method,
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (c) => (resData += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(resData || '[]'));
            } catch {
              resolve(resData);
            }
          } else {
            console.error(`Error on ${method} ${path} [${res.statusCode}]:`, resData);
            resolve(null);
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(dataString);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Seeding public.profiles ---');
  const profiles = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Admin',
      email: 'admin@internship.org',
      role: 'admin',
      status: 'active',
      must_change_password: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Alex Rivera',
      email: 'mentor.alex@internship.org',
      role: 'mentor',
      status: 'active',
      must_change_password: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      full_name: 'Elena Rostova',
      email: 'mentor.elena@internship.org',
      role: 'mentor',
      status: 'active',
      must_change_password: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000011',
      full_name: 'David Kim',
      email: 'intern.david@internship.org',
      role: 'intern',
      status: 'active',
      must_change_password: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      full_name: 'Priya Patel',
      email: 'intern.priya@internship.org',
      role: 'intern',
      status: 'active',
      must_change_password: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000013',
      full_name: 'Marcus Vance',
      email: 'intern.marcus@internship.org',
      role: 'intern',
      status: 'active',
      must_change_password: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000014',
      full_name: 'Chloe Bennett',
      email: 'intern.chloe@internship.org',
      role: 'intern',
      status: 'active',
      must_change_password: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000015',
      full_name: "Liam O'Connor",
      email: 'intern.liam@internship.org',
      role: 'intern',
      status: 'active',
      must_change_password: false,
    },
    {
      id: '00000000-0000-0000-0000-000000000016',
      full_name: 'Aisha Al-Mansoor',
      email: 'intern.aisha@internship.org',
      role: 'intern',
      status: 'active',
      must_change_password: false,
    },
  ];
  await request('profiles', 'POST', profiles);
  console.log('✓ Profiles seeded');

  console.log('--- 2. Seeding public.internships ---');
  const internships = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      code: 'INT-001',
      name: 'Summer 2026 Engineering Cohort',
      description: '12-week intensive software engineering internship focusing on scalable web platforms.',
      start_date: '2026-06-01',
      end_date: '2026-08-31',
      status: 'active',
      created_by: '00000000-0000-0000-0000-000000000001',
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      code: 'INT-002',
      name: 'Fall 2026 Design & Mobile Cohort',
      description: '12-week UI/UX and mobile development cohort building cross-platform applications.',
      start_date: '2026-09-01',
      end_date: '2026-11-30',
      status: 'active',
      created_by: '00000000-0000-0000-0000-000000000001',
    },
  ];
  await request('internships', 'POST', internships);
  console.log('✓ Internships seeded');

  console.log('--- 3. Seeding public.mentors ---');
  const mentors = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      profile_id: '00000000-0000-0000-0000-000000000002',
      department: 'Software Engineering',
      bio: 'Senior Staff Software Engineer specializing in distributed databases and cloud native architectures.',
      status: 'active',
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      profile_id: '00000000-0000-0000-0000-000000000003',
      department: 'Product & UI/UX',
      bio: 'Lead Product Designer and Mobile Specialist with 10+ years shaping intuitive design systems.',
      status: 'active',
    },
  ];
  await request('mentors', 'POST', mentors);
  console.log('✓ Mentors seeded');

  console.log('--- 4. Seeding public.interns ---');
  const interns = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      profile_id: '00000000-0000-0000-0000-000000000011',
      internship_id: '30000000-0000-0000-0000-000000000001',
      mentor_id: '10000000-0000-0000-0000-000000000001',
      role_title: 'Full Stack Intern',
      company_name: 'NovaTech Systems',
      start_date: '2026-06-01',
      end_date: '2026-08-31',
      status: 'active',
      current_streak: 4,
      longest_streak: 8,
      total_active_days: 14,
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      profile_id: '00000000-0000-0000-0000-000000000012',
      internship_id: '30000000-0000-0000-0000-000000000001',
      mentor_id: '10000000-0000-0000-0000-000000000001',
      role_title: 'Frontend Engineer Intern',
      company_name: 'NovaTech Systems',
      start_date: '2026-06-01',
      end_date: '2026-08-31',
      status: 'active',
      current_streak: 2,
      longest_streak: 5,
      total_active_days: 11,
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      profile_id: '00000000-0000-0000-0000-000000000013',
      internship_id: '30000000-0000-0000-0000-000000000001',
      mentor_id: '10000000-0000-0000-0000-000000000001',
      role_title: 'Backend Systems Intern',
      company_name: 'NovaTech Systems',
      start_date: '2026-06-01',
      end_date: '2026-08-31',
      status: 'active',
      current_streak: 1,
      longest_streak: 3,
      total_active_days: 7,
    },
    {
      id: '20000000-0000-0000-0000-000000000004',
      profile_id: '00000000-0000-0000-0000-000000000014',
      internship_id: '30000000-0000-0000-0000-000000000002',
      mentor_id: '10000000-0000-0000-0000-000000000002',
      role_title: 'UI/UX Design Intern',
      company_name: 'Apex Digital',
      start_date: '2026-09-01',
      end_date: '2026-11-30',
      status: 'active',
      current_streak: 5,
      longest_streak: 5,
      total_active_days: 16,
    },
  ];
  await request('interns', 'POST', interns);
  console.log('✓ Interns seeded');

  console.log('--- 5. Seeding public.tasks ---');
  const tasks = [
    {
      code: 'TSK-0001',
      title: 'Setup Local Dev Environment & Tooling',
      description: 'Configure Git, Docker, Node.js and Supabase CLI. Verify workspace setup.',
      instructions: 'Follow the onboarding doc in the repository wiki.',
      requirements: 'All local services running; test suite green.',
      expected_output: 'Terminal verification and PR link.',
      mentor_id: '10000000-0000-0000-0000-000000000001',
      priority: 'high',
      due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      require_github: true,
      require_deployment: false,
      require_drive: false,
      created_by: '00000000-0000-0000-0000-000000000002',
    },
    {
      code: 'TSK-0002',
      title: 'Design PostgreSQL Schema & Migration Files',
      description: 'Draft database schema for relational entity workflow including constraints.',
      instructions: 'Provide migrations and schema diagram in markdown.',
      requirements: 'Strict SQL scripts with zero syntax flaws.',
      expected_output: 'SQL migration scripts and ER diagram link.',
      mentor_id: '10000000-0000-0000-0000-000000000001',
      priority: 'urgent',
      due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      require_github: true,
      require_deployment: true,
      require_drive: false,
      created_by: '00000000-0000-0000-0000-000000000002',
    },
    {
      code: 'TSK-0003',
      title: 'Implement Authentication & Role-Based Routing',
      description: 'Setup Supabase Auth with custom role JWT claims and client-side protection.',
      instructions: 'Integrate login page with role tabs.',
      requirements: 'Unauthenticated or unauthorized routes must redirect.',
      expected_output: 'Deployed authentication preview URL.',
      mentor_id: '10000000-0000-0000-0000-000000000001',
      priority: 'high',
      due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
      require_github: true,
      require_deployment: true,
      require_drive: false,
      created_by: '00000000-0000-0000-0000-000000000002',
    },
    {
      code: 'TSK-0004',
      title: 'Build Task Submission & Versioning Module',
      description: 'Create submission modal with URL validation and immutable history.',
      instructions: 'Validate URL schemes on client and Postgres functions.',
      requirements: 'Strict validation on domain hosts.',
      expected_output: 'Functional submission dialog and timeline viewer.',
      mentor_id: '10000000-0000-0000-0000-000000000001',
      priority: 'medium',
      due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
      require_github: true,
      require_deployment: false,
      require_drive: true,
      created_by: '00000000-0000-0000-0000-000000000002',
    },
  ];
  const createdTasks = await request('tasks', 'POST', tasks);
  console.log('✓ Tasks seeded');

  if (Array.isArray(createdTasks) && createdTasks.length > 0) {
    console.log('--- 6. Seeding task_assignments ---');
    const assignments = [
      {
        task_id: createdTasks[0].id,
        intern_id: '20000000-0000-0000-0000-000000000001',
        status: 'approved',
        assigned_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        started_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        current_version: 1,
      },
      {
        task_id: createdTasks[1].id,
        intern_id: '20000000-0000-0000-0000-000000000001',
        status: 'approved',
        assigned_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        started_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        current_version: 2,
      },
      {
        task_id: createdTasks[2].id,
        intern_id: '20000000-0000-0000-0000-000000000001',
        status: 'waiting_for_review',
        assigned_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        current_version: 1,
      },
      {
        task_id: createdTasks[3].id,
        intern_id: '20000000-0000-0000-0000-000000000001',
        status: 'changes_requested',
        assigned_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        current_version: 1,
      },
    ];
    await request('task_assignments', 'POST', assignments);
    console.log('✓ Task Assignments seeded');
  }

  console.log('--- 7. Seeding announcements & notifications ---');
  await request('announcements', 'POST', [
    {
      title: 'Welcome to Genmitra / InternOS Workspace',
      body: 'All engineering, design, and product cohorts are live with realtime task reviews and cloud attendance tracking.',
      target_role: 'all',
      created_by: '00000000-0000-0000-0000-000000000001',
    },
  ]);
  console.log('✓ Announcements seeded');

  console.log('--- Complete Live Backend Seeding Finished Successfully! ---');
}

run().catch(console.error);
