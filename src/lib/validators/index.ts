// src/lib/validators/index.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['intern', 'mentor', 'admin']),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const submitTaskSchema = z.object({
  github_url: z
    .string()
    .optional()
    .refine(
      (val) => !val || (val.startsWith('https://github.com/') && !val.includes('javascript:')),
      { message: 'GitHub URL must begin with https://github.com/' }
    ),
  deployment_url: z
    .string()
    .optional()
    .refine(
      (val) => !val || (val.startsWith('https://') && !val.includes('javascript:')),
      { message: 'Deployment URL must be a valid https:// URL' }
    ),
  drive_url: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        ((val.startsWith('https://drive.google.com/') || val.startsWith('https://docs.google.com/')) &&
          !val.includes('javascript:')),
      { message: 'Drive URL must start with https://drive.google.com/ or https://docs.google.com/' }
    ),
  note: z.string().max(2000, 'Note must not exceed 2000 characters').optional(),
});

export type SubmitTaskInput = z.infer<typeof submitTaskSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructions: z.string().optional(),
  requirements: z.string().optional(),
  expected_output: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().min(1, 'Due date is required'),
  require_github: z.boolean().default(false),
  require_deployment: z.boolean().default(false),
  require_drive: z.boolean().default(false),
  assign_all: z.boolean().default(false),
  intern_ids: z.array(z.string()).default([]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const reviewSubmissionSchema = z.object({
  result: z.enum(['approved', 'changes_requested']),
  feedback: z.string().min(1, 'Feedback is required'),
  required_changes: z.string().optional(),
  attachment_path: z.string().optional(),
});

export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;

export const createAssignmentSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  instructions: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().min(1, 'Due date is required'),
  assign_all: z.boolean().default(false),
  intern_ids: z.array(z.string()).default([]),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const announcementSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  body: z.string().min(5, 'Announcement body is required'),
  target_role: z.enum(['all', 'mentor', 'intern']),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const changeDeadlineSchema = z.object({
  due_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Must be a valid ISO date string',
  }),
});

export type ChangeDeadlineInput = z.infer<typeof changeDeadlineSchema>;

