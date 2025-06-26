'use server';

/**
 * @fileOverview A Genkit flow to check if a user is eligible to sign up based on an allowlist.
 *
 * - checkSignupEligibility - Checks if an email is in the allowlist.
 * - CheckSignupEligibilityInput - The input type for the checkSignupEligibility function.
 * - CheckSignupEligibilityOutput - The return type for the checkSignupEligibility function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CheckSignupEligibilityInputSchema = z.object({
  email: z.string().email().describe('The email address to check.'),
});
export type CheckSignupEligibilityInput = z.infer<typeof CheckSignupEligibilityInputSchema>;

const CheckSignupEligibilityOutputSchema = z.object({
  isEligible: z.boolean().describe('Whether the email is on the allowlist.'),
});
export type CheckSignupEligibilityOutput = z.infer<typeof CheckSignupEligibilityOutputSchema>;


export async function checkSignupEligibility(input: CheckSignupEligibilityInput): Promise<CheckSignupEligibilityOutput> {
  return checkSignupEligibilityFlow(input);
}


const checkSignupEligibilityFlow = ai.defineFlow(
  {
    name: 'checkSignupEligibilityFlow',
    inputSchema: CheckSignupEligibilityInputSchema,
    outputSchema: CheckSignupEligibilityOutputSchema,
  },
  async ({ email }) => {
    const allowlist = process.env.EMAIL_ALLOWLIST || '';
    const allowedEmails = allowlist.toLowerCase().split(',').map(e => e.trim());
    const isEligible = allowedEmails.includes(email.toLowerCase());

    return { isEligible };
  }
);
