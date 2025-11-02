// Permission helpers for granular access control

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

/**
 * Check if a user can manage (create/edit/delete) another user based on roles
 * SUPER_ADMIN can manage anyone
 * ADMIN can only manage MODERATOR
 * MODERATOR cannot manage anyone
 */
export const canManageUser = (
  currentUserRole: UserRole,
  targetUserRole: UserRole
): boolean => {
  if (currentUserRole === 'SUPER_ADMIN') {
    return true;
  }

  if (currentUserRole === 'ADMIN') {
    return targetUserRole === 'MODERATOR';
  }

  return false;
};

/**
 * Check if a user can create a user with a specific role
 * SUPER_ADMIN can create any role
 * ADMIN can only create MODERATOR
 * MODERATOR cannot create users
 */
export const canCreateUserWithRole = (
  currentUserRole: UserRole,
  newUserRole: UserRole
): boolean => {
  if (currentUserRole === 'SUPER_ADMIN') {
    return true;
  }

  if (currentUserRole === 'ADMIN') {
    return newUserRole === 'MODERATOR';
  }

  return false;
};

/**
 * Check if a user can access advanced settings (SMTP, security, etc.)
 * Only SUPER_ADMIN can access advanced settings
 */
export const canAccessAdvancedSettings = (userRole: UserRole): boolean => {
  return userRole === 'SUPER_ADMIN';
};

/**
 * Check if a user can access basic settings (site name, description, logo)
 * ADMIN and SUPER_ADMIN can access basic settings
 */
export const canAccessBasicSettings = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
};

/**
 * Check if a user can manage content (recipes, categories, comments, etc.)
 * All roles (MODERATOR, ADMIN, SUPER_ADMIN) can manage content
 */
export const canManageContent = (userRole: UserRole): boolean => {
  return (
    userRole === 'MODERATOR' ||
    userRole === 'ADMIN' ||
    userRole === 'SUPER_ADMIN'
  );
};

/**
 * Check if a user can manage newsletter subscribers
 * Only ADMIN and SUPER_ADMIN can manage newsletter
 */
export const canManageNewsletter = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
};

/**
 * Check if a user is trying to perform an action on themselves
 */
export const isSelf = (currentUserId: number, targetUserId: number): boolean => {
  return currentUserId === targetUserId;
};

/**
 * Validate that a user cannot elevate their own privileges
 */
export const cannotElevateOwnRole = (
  currentUserId: number,
  targetUserId: number,
  currentUserRole: UserRole,
  newRole: UserRole
): boolean => {
  if (!isSelf(currentUserId, targetUserId)) {
    return true; // Not self, allow
  }

  // Cannot upgrade your own role
  const roleHierarchy: Record<UserRole, number> = {
    MODERATOR: 1,
    ADMIN: 2,
    SUPER_ADMIN: 3,
  };

  return roleHierarchy[newRole] <= roleHierarchy[currentUserRole];
};
