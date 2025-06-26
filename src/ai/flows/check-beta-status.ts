'use server';
/**
 * @fileOverview A simple flow to check if the current user has beta access.
 *
 * - checkBetaStatus - A function that returns the user's beta status.
 * - CheckBetaStatusInput - The input type for the checkBetaStatus function.
 * - CheckBetaStatusOutput - The return type for the checkBetaStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { isUserOnAllowlist, type AuthUser } from '@/ai/auth';

const CheckBetaStatusInputSchema = z.object({
  user: z.object({
    email: z.string().nullable(),
    email_verified: z.boolean(),
  }).nullable(),
});
export type CheckBetaStatusInput = z.infer<typeof CheckBetaStatusInputSchema>;


const CheckBetaStatusOutputSchema = z.object({
  isBetaUser: z.boolean(),
});
export type CheckBetaStatusOutput = z.infer<typeof CheckBetaStatusOutputSchema>;

export async function checkBetaStatus(input: CheckBetaStatusInput): Promise<CheckBetaStatusOutput> {
  return checkBetaStatusFlow(input);
}

const checkBetaStatusFlow = ai.defineFlow(
  {
    name: 'checkBetaStatusFlow',
    inputSchema: CheckBetaStatusInputSchema,
    outputSchema: CheckBetaStatusOutputSchema,
  },
  async (input) => {
    const isBetaUser = isUserOnAllowlist(input.user);
    return { isBetaUser };
  }
);
