'use server';
/**
 * @fileOverview A flow to check if a user's email is on the signup allowlist.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckSignupEligibilityInputSchema = z.object({
  email: z.string().email(),
});
export type CheckSignupEligibilityInput = z.infer<typeof CheckSignupEligibilityInputSchema>;


const CheckSignupEligibilityOutputSchema = z.object({
  isEligible: z.boolean(),
});
export type CheckSignupEligibilityOutput = z.infer<typeof CheckSignupEligibilityOutputSchema>;

function isEmailOnAllowlist(email: string | null): boolean {
  if (!email) {
    return false;
  }
  // Read the allowlist from environment variables.
  const allowlistString = process.env.SIGNUP_ALLOWLIST || '';
  const allowlist = allowlistString.split(',').map(e => e.trim().toLowerCase());

  // If the allowlist is empty, deny all signups for security.
  if (allowlist.length === 0 || (allowlist.length === 1 && allowlist[0] === '')) {
    console.warn("SIGNUP_ALLOWLIST is not configured. All signups are disabled.");
    return false;
  }
  
  return allowlist.includes(email.toLowerCase());
}

export async function checkSignupEligibility(input: CheckSignupEligibilityInput): Promise<CheckSignupEligibilityOutput> {
  return checkSignupEligibilityFlow(input);
}

const checkSignupEligibilityFlow = ai.defineFlow(
  {
    name: 'checkSignupEligibilityFlow',
    inputSchema: CheckSignupEligibilityInputSchema,
    outputSchema: CheckSignupEligibilityOutputSchema,
  },
  async (input) => {
    const isEligible = isEmailOnAllowlist(input.email);
    return { isEligible };
  }
);
