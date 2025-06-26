'use server';

/**
 * @fileOverview AI flow to extract items, costs, discounts, and service charges from uploaded receipt images.
 *
 * - extractReceiptData - A function that handles the receipt data extraction process.
 * - ExtractReceiptDataInput - The input type for the extractReceiptData function.
 * - ExtractReceiptDataOutput - The return type for the extractReceiptData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { assertAuth } from '@/ai/auth';

const ExtractReceiptDataInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

const ExtractReceiptDataOutputSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe('The name of the item.'),
      cost: z.number().describe('The cost of the item.'),
      isAmbiguous: z.boolean().describe('Whether the item is ambiguous and requires manual review.'),
    })
  ).describe('The list of items extracted from the receipt.'),
  discounts: z.array(
    z.object({
      name: z.string().describe('The name of the discount.'),
      amount: z.number().describe('The amount of the discount.'),
    })
  ).describe('The list of discounts extracted from the receipt.'),
  serviceCharges: z.array(
    z.object({
      description: z.string().describe('The description of the service charge.'),
      amount: z.number().describe('The amount of the service charge.'),
    })
  ).describe('The list of service charges extracted from the receipt.'),
  currency: z.string().describe('The currency of the receipt.'),
});
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  return extractReceiptDataFlow(input);
}

const extractReceiptDataPrompt = ai.definePrompt({
  name: 'extractReceiptDataPrompt',
  input: {schema: ExtractReceiptDataInputSchema},
  output: {schema: ExtractReceiptDataOutputSchema},
  prompt: `You are an expert AI assistant specializing in extracting structured data from receipts.

You will receive an image of a receipt. Your task is to analyze the image and extract the following information:
1.  A list of all individual items, including their name and cost.
2.  For each item, determine if it is ambiguous. An item is considered ambiguous if its name is unusual, illegible, or if its cost seems disproportionately high or low. Set the 'isAmbiguous' flag to 'true' for these items, and 'false' otherwise.
3.  A list of all discounts applied, including the discount name and the amount.
4.  A list of all service charges or tips, including a description and the amount.
5.  The currency of the receipt (e.g., USD, GBP, EUR).

Analyze the following receipt image and return the data in the specified JSON format.

Receipt Image: {{media url=receiptDataUri}}
`,
});

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async (input, auth) => {
    assertAuth(auth);
    const {output} = await extractReceiptDataPrompt(input);
    return output!;
  }
);
