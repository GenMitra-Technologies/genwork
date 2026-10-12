// scripts/deployProductionData.cjs
const { createClient } = require('@supabase/supabase-js');
const { getEnv } = require('./getEnv.cjs');

const env = getEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://jgjiakofetyiimtobhey.supabase.co';
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required in environment variables or .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('🚀 Starting clean production data deployment on Supabase...');

  // 1. Clean out all old demo records
  console.log('🧹 Purging old demo/sample task and activity records...');
  try { await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('task_events').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('task_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('task_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('task_attachments').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('assignment_recipients').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('assignment_attachments').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('attendance_records').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('intern_daily_activity').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('mentor_assignment_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('interns').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('mentors').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}
  try { await supabase.from('internships').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch(e) {}

  // 2. Remove demo auth users
  console.log('👤 Purging old sample accounts from Auth...');
  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const demoEmails = [
    'admin@internship.org',
    'mentor.alex@internship.org',
    'mentor.elena@internship.org',
    'mentor.jordan@internship.org',
    'intern.david@internship.org',
    'intern.priya@internship.org',
    'intern.marcus@internship.org',
    'intern.chloe@internship.org',
    'intern.liam@internship.org',
    'intern.aisha@internship.org',
  ];

  if (usersData && usersData.users) {
    for (const u of usersData.users) {
      if (demoEmails.includes(u.email)) {
        console.log(`Deleting demo user: ${u.email}`);
        await supabase.auth.admin.deleteUser(u.id);
      }
    }
  }

  // Also clean demo rows from profiles
  for (const email of demoEmails) {
    await supabase.from('profiles').delete().eq('email', email);
  }

  // 3. Create or Update Production Auth Users
  console.log('✨ Creating / Verifying Production Auth Accounts...');
  const PRODUCTION_ACCOUNTS = [
    {
      email: 'sindhugangisetty910@gmail.com',
      password: 'GENMITRA@INTERN',
      full_name: 'SINDHU GANGISETTY',
      role: 'intern',
    },
    {
      email: 'manireddy@genmitra.com',
      password: 'GENMITRA@MENTOR',
      full_name: 'Kapu Mani Shankar Reddy',
      role: 'mentor',
    },
    {
      email: 'ops@genmitra.com',
      password: 'GENMITRA@ADMIN2026',
      full_name: 'GenMitra Operations',
      role: 'admin',
    },
  ];

  const authUserIds = {};

  for (const acc of PRODUCTION_ACCOUNTS) {
    // Check if user already exists
    let existingUser = null;
    const { data: list } = await supabase.auth.admin.listUsers();
    if (list && list.users) {
      existingUser = list.users.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
    }

    if (existingUser) {
      console.log(`Updating password and metadata for ${acc.email}...`);
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.full_name, role: acc.role },
      });
      authUserIds[acc.email] = existingUser.id;
    } else {
      console.log(`Creating auth user: ${acc.email}...`);
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.full_name, role: acc.role },
      });
      if (error) {
        console.error(`Error creating ${acc.email}:`, error.message);
      } else if (newUser?.user) {
        authUserIds[acc.email] = newUser.user.id;
      }
    }
  }

  const internUserId = authUserIds['sindhugangisetty910@gmail.com'];
  const mentorUserId = authUserIds['manireddy@genmitra.com'];
  const adminUserId = authUserIds['ops@genmitra.com'];

  // 4. Upsert Profiles
  console.log('📝 Creating Production Profiles...');
  await supabase.from('profiles').upsert([
    {
      id: internUserId,
      full_name: 'SINDHU GANGISETTY',
      email: 'sindhugangisetty910@gmail.com',
      role: 'intern',
      status: 'active',
      must_change_password: false,
    },
    {
      id: mentorUserId,
      full_name: 'Kapu Mani Shankar Reddy',
      email: 'manireddy@genmitra.com',
      role: 'mentor',
      status: 'active',
      must_change_password: false,
    },
    {
      id: adminUserId,
      full_name: 'GenMitra Operations',
      email: 'ops@genmitra.com',
      role: 'admin',
      status: 'active',
      must_change_password: false,
    },
  ]);

  // 5. Create Real Internship Cohort
  console.log('🏛️ Creating Engineering Cohort...');
  const cohortId = '30000000-0000-0000-0000-000000000001';
  await supabase.from('internships').upsert([
    {
      id: cohortId,
      name: 'Engineering Internship Cohort 2026',
      code: 'ENG-2026',
      description: 'Frontend Architecture & Cloud Software Engineering Fellowship',
      start_date: '2026-10-01',
      end_date: '2027-03-31',
      status: 'active',
    },
  ]);

  // 6. Create Real Mentor Record
  console.log('👨‍🏫 Creating Mentor Record (Kapu Mani Shankar Reddy - CTO)...');
  const mentorRecordId = '10000000-0000-0000-0000-000000000001';
  await supabase.from('mentors').upsert([
    {
      id: mentorRecordId,
      profile_id: mentorUserId,
      department: 'Engineering',
      bio: 'Chief Technology Officer (CTO) leading Engineering & Innovation Cell at GenMitra.',
    },
  ]);

  // 7. Create Real Intern Record (SINDHU GANGISETTY)
  console.log('👩‍💻 Creating Intern Record (SINDHU GANGISETTY - Frontend Developer)...');
  const internRecordId = '20000000-0000-0000-0000-000000000001';
  await supabase.from('interns').upsert([
    {
      id: internRecordId,
      profile_id: internUserId,
      internship_id: cohortId,
      mentor_id: mentorRecordId,
      role_title: 'FRONTEND DEVELOPER',
      company_name: 'GenMitra Technologies',
      start_date: '2026-10-01',
      end_date: null,
      status: 'active',
      current_streak: 5,
      longest_streak: 5,
      total_active_days: 12,
      last_active_date: '2026-10-12',
    },
  ]);

  // 8. Create a Production Realtime Notification welcoming the Intern
  await supabase.from('notifications').insert([
    {
      recipient_id: internUserId,
      type: 'announcement',
      title: 'Welcome to GenMitra Engineering Cohort!',
      message: 'Your onboarding evaluation is complete and sealed. You are officially active in daily operations under CTO Kapu Mani Shankar Reddy.',
      is_read: false,
    },
  ]);

  console.log('🎉 Production clean deployment completed successfully!');
}

run().catch((err) => {
  console.error('Fatal error during production deployment:', err);
  process.exit(1);
});
