// src/lib/constants.ts

export const APP_NAME = 'InternOS';
export const INACTIVITY_TIMEOUT_MINUTES = 30;

export const DEFAULT_AVATAR = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

export const ROLE_LABELS: Record<'intern' | 'mentor' | 'admin', string> = {
  intern: 'Intern',
  mentor: 'Mentor',
  admin: 'Administrator',
};
