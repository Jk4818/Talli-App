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
      ambiguous: z.boolean().optional().describe('Whether the item is ambiguous and requires manual review.'),
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
  prompt: `You are an expert AI assistant specializing in extracting data from receipts.

You will receive an image of a receipt and must extract the following information:

*   Items: A list of items with their names and costs.
*   Discounts: A list of discounts with their names and amounts.
*   Service Charges: A list of service charges with their descriptions and amounts.
*   Currency: The currency of the receipt.

For each item, determine if the item is ambiguous and requires manual review. If so, set the ambiguous field to true.

Analyze the following receipt image and extract the data:

Receipt Image: {{media url=receiptDataUri}}

Return the data in JSON format.
`,
});

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async input => {
    const {output} = await extractReceiptDataPrompt(input);
    return output!;
  }
);
