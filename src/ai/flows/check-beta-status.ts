'use server';
/**
 * @fileOverview A simple flow to check if the current user has beta access.
 *
 * - checkBetaStatus - A function that returns the user's beta status.
 * - CheckBetaStatusOutput - The return type for the checkBetaStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { isUserOnAllowlist } from '@/ai/auth';

const CheckBetaStatusOutputSchema = z.object({
  isBetaUser: z.boolean(),
});
export type CheckBetaStatusOutput = z.infer<typeof CheckBetaStatusOutputSchema>;

export async function checkBetaStatus(): Promise<CheckBetaStatusOutput> {
  return checkBetaStatusFlow({}); // Pass empty object instead of undefined
}

const checkBetaStatusFlow = ai.defineFlow(
  {
    name: 'checkBetaStatusFlow',
    inputSchema: z.object({}), // Use an empty object schema for no input
    outputSchema: CheckBetaStatusOutputSchema,
  },
  async (_, auth) => {
    const isBetaUser = isUserOnAllowlist(auth);
    return { isBetaUser };
  }
);
