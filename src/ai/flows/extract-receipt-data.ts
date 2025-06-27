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
import { assertAuth, type AuthUser } from '@/ai/auth';

const ExtractReceiptDataInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  user: z.object({
    email: z.string().nullable(),
    email_verified: z.boolean(),
  }).nullable(),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

const ItemSchema = z.object({
  name: z.string().describe('The name of the item.'),
  cost: z.number().describe('The cost of the item.'),
  confidence: z.number().min(0).max(100).optional().describe('A percentage confidence score (0-100) on the accuracy of this item extraction.'),
});

const DiscountSchema = z.object({
  name: z.string().describe('The name of the discount.'),
  amount: z.number().describe('The amount of the discount.'),
  confidence: z.number().min(0).max(100).optional().describe('A percentage confidence score (0-100) on the accuracy of this discount extraction.'),
});

const ServiceChargeSchema = z.object({
  description: z.string().describe('The description of the service charge.'),
  amount: z.number().describe('The amount of the service charge.'),
  confidence: z.number().min(0).max(100).optional().describe('A percentage confidence score (0-100) on the accuracy of this service charge extraction.'),
});


const ExtractReceiptDataOutputSchema = z.object({
  items: z.array(ItemSchema).describe('The list of items extracted from the receipt.'),
  discounts: z.array(DiscountSchema).describe('The list of discounts extracted from the receipt.'),
  serviceCharges: z.array(ServiceChargeSchema).describe('The list of service charges extracted from the receipt.'),
  currency: z.string().describe('The currency of the receipt.'),
  overallConfidence: z.number().min(0).max(100).optional().describe('An overall confidence score (0-100) for the entire receipt extraction, considering image quality and text legibility.'),
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
2.  A list of all discounts applied, including the discount name and the amount.
3.  A list of all service charges or tips, including a description and the amount.
4.  The currency of the receipt (e.g., USD, GBP, EUR).
5.  For each item, discount, and service charge, provide a confidence score from 0 to 100 on how certain you are about the accuracy of the extracted text and numbers. A low score indicates blurry text, unusual formatting, or ambiguity.
6.  Provide an overall confidence score for the entire receipt, taking into account the image quality, clarity, and how easy it was to read.

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
  async (input) => {
    assertAuth(input.user);
    const {output} = await extractReceiptDataPrompt(input);
    return output!;
  }
);
