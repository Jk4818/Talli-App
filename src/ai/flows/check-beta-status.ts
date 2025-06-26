'use server';
/**
 * @fileOverview A flow to check if a user is on the invite list.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { isUserOnAllowlist, type AuthUser } from '@/ai/auth';

const CheckInviteStatusInputSchema = z.object({
  user: z.object({
    email: z.string().nullable(),
    email_verified: z.boolean(),
  }).nullable(),
});
export type CheckInviteStatusInput = z.infer<typeof CheckInviteStatusInputSchema>;


const CheckInviteStatusOutputSchema = z.object({
  isInvited: z.boolean(),
});
export type CheckInviteStatusOutput = z.infer<typeof CheckInviteStatusOutputSchema>;

export async function checkInviteStatus(input: CheckInviteStatusInput): Promise<CheckInviteStatusOutput> {
  return checkInviteStatusFlow(input);
}

const checkInviteStatusFlow = ai.defineFlow(
  {
    name: 'checkInviteStatusFlow',
    inputSchema: CheckInviteStatusInputSchema,
    outputSchema: CheckInviteStatusOutputSchema,
  },
  async (input) => {
    const isInvited = isUserOnAllowlist(input.user);
    return { isInvited };
  }
);
