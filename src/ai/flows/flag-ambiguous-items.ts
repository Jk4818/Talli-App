'use server';

/**
 * @fileOverview This file defines a Genkit flow to flag potentially ambiguous items extracted from receipts for manual review.
 *
 * - flagAmbiguousItems - A flow that takes a list of items and flags those that seem unusual or incorrect.
 * - FlagAmbiguousItemsInput - The input type for the flagAmbiguousItems function.
 * - FlagAmbiguousItemsOutput - The return type for the flagAmbiguousItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { assertAuth, type AuthUser } from '../auth';

const ItemSchema = z.object({
  name: z.string().describe('The name of the item.'),
  cost: z.number().describe('The cost of the item.'),
});

const FlaggedItemSchema = z.object({
  name: z.string().describe('The name of the item.'),
  cost: z.number().describe('The cost of the item.'),
  isAmbiguous: z
    .boolean()
    .describe('Whether the item is potentially ambiguous or incorrect.'),
});

const FlagAmbiguousItemsInputSchema = z.object({
    items: z.array(ItemSchema).describe("The list of items to analyze."),
    user: z.object({
        email: z.string().nullable(),
        email_verified: z.boolean(),
    }).nullable(),
});
export type FlagAmbiguousItemsInput = z.infer<typeof FlagAmbiguousItemsInputSchema>;

const FlagAmbiguousItemsOutputSchema = z.array(FlaggedItemSchema);
export type FlagAmbiguousItemsOutput = z.infer<typeof FlagAmbiguousItemsOutputSchema>;


export async function flagAmbiguousItems(input: FlagAmbiguousItemsInput): Promise<FlagAmbiguousItemsOutput> {
  return flagAmbiguousItemsFlow(input);
}

const flaggingPrompt = ai.definePrompt({
  name: 'flagAmbiguousItemsPrompt',
  input: {schema: FlagAmbiguousItemsInputSchema},
  output: {schema: FlagAmbiguousItemsOutputSchema},
  prompt: `You are an AI assistant specializing in reviewing lists of items extracted from receipts.

  Your task is to analyze each item and determine if it is potentially ambiguous or incorrect based on its name and cost.
  An item is considered ambiguous if its name is unusual or if its cost seems disproportionately high or low compared to similar items.

  For each item in the list, set the isAmbiguous field to true if you suspect it is incorrect or unusual; otherwise, set it to false.

  Input:
  {{#each items}}
  - Name: {{this.name}}, Cost: {{this.cost}}
  {{/each}}`,
});

const flagAmbiguousItemsFlow = ai.defineFlow(
  {
    name: 'flagAmbiguousItemsFlow',
    inputSchema: FlagAmbiguousItemsInputSchema,
    outputSchema: FlagAmbiguousItemsOutputSchema,
  },
  async (input) => {
    assertAuth(input.user);
    // This flow is backed by an LLM prompt to perform the analysis.
    const { output } = await flaggingPrompt(input);
    return output!;
  }
);
