/**
 * Represents the essential user details needed for authorization checks.
 */
export interface AuthUser {
  email: string | null;
  email_verified: boolean;
}

/**
 * Asserts that the user is authenticated and has a verified email.
 * This should be used as a guard at the beginning of sensitive AI flows
 * to ensure only valid, logged-in users can proceed.
 *
 * @param user The user object to check.
 * @throws An error if the user is not authenticated or their email is not verified.
 */
export function assertAuth(user: AuthUser | null) {
  if (!user) {
    throw new Error('Authentication is required to perform this action.');
  }

  if (!user.email || !user.email_verified) {
    throw new Error('A verified email is required for authentication.');
  }
}
