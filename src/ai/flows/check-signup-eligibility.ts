'use server';

/**
 * @fileOverview A server action to check if a user is eligible to sign up based on an allowlist.
 *
 * - checkSignupEligibility - Checks if an email is in the allowlist.
 */

export async function checkSignupEligibility({
  email,
}: {
  email: string;
}): Promise<{ isEligible: boolean }> {
  // Directly access the environment variable on the server.
  const allowlist = process.env.EMAIL_ALLOWLIST || '';
  const allowedEmails = allowlist
    .toLowerCase()
    .split(',')
    .map((e) => e.trim());
  const isEligible = allowedEmails.includes(email.toLowerCase());

  return { isEligible };
}
