import type { FlowAuth } from 'genkit';

/**
 * Asserts that the user is authenticated and authorized to use the application.
 * @param auth The authentication object from the Genkit flow.
 * @throws An error if the user is not authenticated or not on the beta allowlist.
 */
export function assertAuth(auth: FlowAuth | null) {
  if (!auth) {
    throw new Error('Authentication is required to perform this action.');
  }

  const allowlistEnv = process.env.BETA_USERS_ALLOWLIST || '';
  const allowlist = allowlistEnv.split(',').map(email => email.trim().toLowerCase()).filter(e => e);

  if (!auth.email || !auth.email_verified) {
    throw new Error('A verified email is required for authentication.');
  }
  
  if (allowlist.length > 0 && !allowlist.includes(auth.email.toLowerCase())) {
    throw new Error('You are not authorized to use this feature during the beta period.');
  }
}
