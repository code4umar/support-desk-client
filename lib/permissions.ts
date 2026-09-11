import type { Role } from '@/types';

export const permissions = {
  canAssign: (role: Role) => role === 'agent' || role === 'admin',
  canChangeStatus: (role: Role) => role === 'agent' || role === 'admin',
  canManageTags: (role: Role) => role === 'agent' || role === 'admin',
  canWriteInternalComment: (role: Role) => role === 'agent' || role === 'admin',
  canCreateTag: (role: Role) => role === 'admin',
  canDeleteTicket: (role: Role) => role === 'admin',
};