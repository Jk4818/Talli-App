
/**
 * Represents the essential user details needed for authorization checks.
 */
export interface AuthUser {
  email: string | null;
  email_verified: boolean;
}

/**
 * Checks if the authenticated user is on the invite list defined in environment variables.
 * @param user The user object to check.
 * @returns true if the user is on the allowlist, false otherwise.
 */
export function isUserOnAllowlist(user: AuthUser | null): boolean {
  if (!user || !user.email || !user.email_verified) {
    return false;
  }

  // Read the allowlist from environment variables.
  const allowlistString = process.env.EMAIL_ALLOWLIST || '';
  const allowlist = allowlistString.split(',').map(email => email.trim().toLowerCase());

  // For security, if the allowlist is empty or not configured, deny all access.
  if (allowlist.length === 0 || (allowlist.length === 1 && allowlist[0] === '')) {
    console.warn("EMAIL_ALLOWLIST is not configured. Access is denied for all users.");
    return false;
  }
  
  return allowlist.includes(user.email.toLowerCase());
}

/**
 * Asserts that the user is authenticated and authorized to use the application.
 * This should be used as a guard at the beginning of sensitive AI flows.
 * @param user The user object to check.
 * @throws An error if the user is not authenticated or not on the allowlist.
 */
export function assertAuth(user: AuthUser | null) {
  if (!user) {
    throw new Error('Authentication is required to perform this action.');
  }

  if (!user.email || !user.email_verified) {
    throw new Error('A verified email is required for authentication.');
  }
  
  if (!isUserOnAllowlist(user)) {
    throw new Error('You are not authorized to perform this action.');
  }
}
