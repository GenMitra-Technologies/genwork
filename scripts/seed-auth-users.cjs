// scripts/seed-auth-users.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jgjiakofetyiimtobhey.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnamlha29mZXR5aWltdG9iaGV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTY4NDkzNCwiZXhwIjoyMTA3MjYwOTM0fQ.Z7ZSSoJT7t6kxtGpwXEl8ZF8ZZkMHPSa5ez-5jPyFZ8';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  { id: '00000000-0000-0000-0000-000000000001', email: 'admin@internship.org', password: 'Password123!', full_name: 'Sarah Jenkins (Admin)', role: 'admin' },
  { id: '00000000-0000-0000-0000-000000000002', email: 'mentor.alex@internship.org', password: 'Password123!', full_name: 'Alex Rivera', role: 'mentor' },
  { id: '00000000-0000-0000-0000-000000000003', email: 'mentor.elena@internship.org', password: 'Password123!', full_name: 'Elena Rostova', role: 'mentor' },
  { id: '00000000-0000-0000-0000-000000000011', email: 'intern.david@internship.org', password: 'Password123!', full_name: 'David Kim', role: 'intern' },
  { id: '00000000-0000-0000-0000-000000000012', email: 'intern.priya@internship.org', password: 'Password123!', full_name: 'Priya Patel', role: 'intern' },
  { id: '00000000-0000-0000-0000-000000000013', email: 'intern.marcus@internship.org', password: 'Password123!', full_name: 'Marcus Vance', role: 'intern' },
  { id: '00000000-0000-0000-0000-000000000014', email: 'intern.chloe@internship.org', password: 'Password123!', full_name: 'Chloe Bennett', role: 'intern' },
  { id: '00000000-0000-0000-0000-000000000015', email: 'intern.liam@internship.org', password: 'Password123!', full_name: 'Liam O\'Connor', role: 'intern' },
  { id: '00000000-0000-0000-0000-000000000016', email: 'intern.aisha@internship.org', password: 'Password123!', full_name: 'Aisha Al-Mansoor', role: 'intern' },
];

async function seedUsers() {
  console.log('Seeding demo auth users to live Supabase...');
  for (const u of DEMO_USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      id: u.id,
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`User ${u.email} already registered.`);
      } else {
        console.error(`Failed to create ${u.email}:`, error.message);
      }
    } else {
      console.log(`Created user ${u.email} (${u.role}) ID: ${data.user.id}`);
    }
  }
  console.log('Finished seeding auth users.');
}

seedUsers();
