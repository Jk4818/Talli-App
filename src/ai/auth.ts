import type { FlowAuth } from 'genkit';

const ALLOWLIST = ['work.jk4818@gmail.com'];

/**
 * Checks if the authenticated user is on the beta allowlist.
 * @param auth The authentication object from the Genkit flow.
 * @returns true if the user is on the allowlist, false otherwise.
 */
export function isUserOnAllowlist(auth: FlowAuth | null): boolean {
  if (!auth || !auth.email || !auth.email_verified) {
    return false;
  }
  return ALLOWLIST.includes(auth.email.toLowerCase());
}

/**
 * Asserts that the user is authenticated and authorized to use the application.
 * This should be used as a guard at the beginning of sensitive AI flows.
 * @param auth The authentication object from the Genkit flow.
 * @throws An error if the user is not authenticated or not on the beta allowlist.
 */
export function assertAuth(auth: FlowAuth | null) {
  if (!auth) {
    throw new Error('Authentication is required to perform this action.');
  }

  if (!auth.email || !auth.email_verified) {
    throw new Error('A verified email is required for authentication.');
  }
  
  if (!isUserOnAllowlist(auth)) {
    throw new Error('You are not authorized to use this feature during the beta period.');
  }
}
