'use server';

/**
 * @fileOverview This file defines a Genkit tool to flag potentially ambiguous items extracted from receipts for manual review.
 *
 * - flagAmbiguousItemsTool - A tool that takes a list of items and flags those that seem unusual or incorrect.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { assertAuth } from '../auth';

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

const FlagAmbiguousItemsInputSchema = z.array(ItemSchema);

const FlagAmbiguousItemsOutputSchema = z.array(FlaggedItemSchema);


const flaggingPrompt = ai.definePrompt({
  name: 'flagAmbiguousItemsPrompt',
  input: {schema: FlagAmbiguousItemsInputSchema},
  output: {schema: FlagAmbiguousItemsOutputSchema},
  prompt: `You are an AI assistant specializing in reviewing lists of items extracted from receipts.

  Your task is to analyze each item and determine if it is potentially ambiguous or incorrect based on its name and cost.
  An item is considered ambiguous if its name is unusual or if its cost seems disproportionately high or low compared to similar items.

  For each item in the list, set the isAmbiguous field to true if you suspect it is incorrect or unusual; otherwise, set it to false.

  Input:
  {{#each this}}
  - Name: {{this.name}}, Cost: {{this.cost}}
  {{/each}}`,
});

export const flagAmbiguousItemsTool = ai.defineTool(
  {
    name: 'flagAmbiguousItems',
    description: 'Analyzes a list of receipt items and returns the same list with an "isAmbiguous" flag set for each. This should be used to flag items for manual review.',
    inputSchema: FlagAmbiguousItemsInputSchema,
    outputSchema: FlagAmbiguousItemsOutputSchema,
  },
  async (items, context) => {
    assertAuth(context.auth);
    // This tool is backed by an LLM prompt to perform the analysis.
    const { output } = await flaggingPrompt(items);
    return output!;
  }
);
