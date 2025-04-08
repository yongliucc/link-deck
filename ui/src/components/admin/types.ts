import { z } from 'zod';

// Types imported from the API
export interface LinkGroup {
  id: number;
  name: string;
  sort_order: number;
  links: LinkType[];
}

export interface LinkType {
  id: number;
  name: string;
  url: string;
  sort_order: number;
  group_id: number;
}

export interface LinkRequest {
  name: string;
  url: string;
  sort_order: number;
  group_id: number;
}

// Zod schemas
export const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const linkGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sort_order: z.coerce.number().int().nonnegative(),
});

export const linkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  sort_order: z.coerce.number().int().nonnegative(),
});

export type PasswordFormValues = z.infer<typeof passwordSchema>;
export type LinkGroupFormValues = z.infer<typeof linkGroupSchema>;
export type LinkFormValues = z.infer<typeof linkSchema>;

export type AdminView = 'linkGroups' | 'links' | 'systemConfig'; 