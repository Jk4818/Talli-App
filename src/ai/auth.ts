
const ALLOWLIST = ['work.jk4818@gmail.com'];

/**
 * Represents the essential user details needed for authorization checks.
 */
export interface AuthUser {
  email: string | null;
  email_verified: boolean;
}

/**
 * Checks if the authenticated user is on the beta allowlist.
 * @param user The user object to check.
 * @returns true if the user is on the allowlist, false otherwise.
 */
export function isUserOnAllowlist(user: AuthUser | null): boolean {
  if (!user || !user.email || !user.email_verified) {
    return false;
  }
  return ALLOWLIST.includes(user.email.toLowerCase());
}

/**
 * Asserts that the user is authenticated and authorized to use the application.
 * This should be used as a guard at the beginning of sensitive AI flows.
 * @param user The user object to check.
 * @throws An error if the user is not authenticated or not on the beta allowlist.
 */
export function assertAuth(user: AuthUser | null) {
  if (!user) {
    throw new Error('Authentication is required to perform this action.');
  }

  if (!user.email || !user.email_verified) {
    throw new Error('A verified email is required for authentication.');
  }
  
  if (!isUserOnAllowlist(user)) {
    throw new Error('You are not authorized to use this feature during the beta period.');
  }
}
