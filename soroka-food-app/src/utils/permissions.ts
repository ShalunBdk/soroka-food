import type { UserRole } from '../types';

// Role hierarchy levels
const ROLE_LEVELS: Record<UserRole, number> = {
  SUPER_ADMIN: 3,
  ADMIN: 2,
  MODERATOR: 1
};

/**
 * Check if current user can toggle status of target user
 * Rules:
 * - Cannot toggle own status
 * - SUPER_ADMIN can toggle anyone except themselves
 * - ADMIN can only toggle MODERATOR
 * - MODERATOR cannot toggle anyone
 */
export function canToggleUserStatus(
  currentUserId: number,
  currentUserRole: UserRole,
  targetUserId: number,
  targetUserRole: UserRole
): boolean {
  // Cannot toggle own status
  if (currentUserId === targetUserId) {
    return false;
  }

  // SUPER_ADMIN can toggle anyone except themselves
  if (currentUserRole === 'SUPER_ADMIN') {
    return true;
  }

  // ADMIN can only toggle MODERATOR
  if (currentUserRole === 'ADMIN') {
    return targetUserRole === 'MODERATOR';
  }

  // MODERATOR cannot toggle anyone
  return false;
}

/**
 * Check if current user can delete target user
 * Same rules as toggle status
 */
export function canDeleteUser(
  currentUserId: number,
  currentUserRole: UserRole,
  targetUserId: number,
  targetUserRole: UserRole
): boolean {
  return canToggleUserStatus(currentUserId, currentUserRole, targetUserId, targetUserRole);
}

/**
 * Check if current user can edit target user
 * Rules:
 * - Cannot edit users with higher role
 * - Can edit users with equal or lower role
 */
export function canEditUser(
  currentUserRole: UserRole,
  targetUserRole: UserRole
): boolean {
  return ROLE_LEVELS[currentUserRole] >= ROLE_LEVELS[targetUserRole];
}
