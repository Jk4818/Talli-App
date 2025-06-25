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
  id: z.string().describe('A temporary, unique identifier for this item within this response (e.g., "item-1", "item-2").'),
  name: z.string().describe('The name of the item.'),
  quantity: z.number().int().min(1).default(1).describe('The quantity of this item. Default to 1 if not specified.'),
  unitCost: z.number().optional().describe('The cost of a single unit of the item. If provided, the `cost` field should equal `quantity` * `unitCost`.'),
  cost: z.number().describe('The total cost for the line item (quantity * unit cost).'),
  category: z.enum(['Food', 'Drink', 'Other']).describe("The primary category of the item. Use 'Other' if unsure."),
  subCategory: z.string().optional().describe("A specific, one-or-two-word sub-category for the item (e.g., 'Pizza', 'Beer', 'Side', 'Dessert')."),
  confidence: z.number().min(0).max(100).optional().describe('A percentage confidence score (0-100) on the accuracy of this item extraction.'),
});

const DiscountSchema = z.object({
  name: z.string().describe('The name of the discount.'),
  amount: z.number().describe('The amount of the discount (as a positive number).'),
  suggestedItemId: z.string().optional().describe('If this discount is for a single item, this must be the unique ID of that item. Otherwise, leave this field empty.'),
  confidence: z.number().min(0).max(100).optional().describe('A percentage confidence score (0-100) on the accuracy of this discount extraction.'),
});

const ServiceChargeSchema = z.object({
  description: z.string().describe('The description of the service charge.'),
  amount: z.number().describe('The amount of the service charge.'),
  confidence: z.number().min(0).max(100).optional().describe('A percentage confidence score (0-100) on the accuracy of this service charge extraction.'),
});


const ExtractReceiptDataOutputSchema = z.object({
  isReceipt: z.boolean().describe('True if the image appears to be a receipt, false otherwise.'),
  rejectionReason: z.string().optional().describe('If the receipt is rejected, a brief reason why (e.g., "Image is too blurry", "Not a receipt").'),
  items: z.array(ItemSchema).describe('The list of items extracted from the receipt.'),
  discounts: z.array(DiscountSchema).describe('The list of discounts extracted from the receipt.'),
  serviceCharges: z.array(ServiceChargeSchema).describe('The list of service charges extracted from the receipt.'),
  currency: z.string().length(3).describe('The 3-letter ISO 4217 currency code of the receipt (e.g., USD, GBP, EUR).'),
  overallConfidence: z.number().min(0).max(100).optional().describe('An overall confidence score for the entire receipt extraction, considering image quality and text legibility.'),
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

Your first and most important task is to determine if the provided image is a receipt.
- If it is a receipt, set 'isReceipt' to true.
- If it is NOT a receipt (e.g., a picture of a cat, a landscape), you MUST set 'isReceipt' to false and provide 'Not a receipt' as the 'rejectionReason'. You do not need to provide any other fields.

If the image IS a receipt, your second task is to assess its quality.
- If the image is a receipt but is of very poor quality (e.g., extremely blurry, unreadable text, cut off), set a low 'overallConfidence' (below 60) and provide a concise 'rejectionReason' (e.g., "Image is too blurry").
- Otherwise, proceed with full extraction.

For a good quality receipt, extract the following information:
1.  A list of all individual items. For each item, you MUST provide:
    - a temporary unique \`id\` (e.g., "item-1").
    - its \`name\`.
    - its \`quantity\`. If not specified, default to 1.
    - its total \`cost\` for all quantities.
    - its optional \`unitCost\` if specified on the receipt.
    - its primary \`category\` ('Food', 'Drink', or 'Other').
    - a concise \`subCategory\` (e.g., "Pizza", "Beer", "Side", "Dessert", "Cocktail").
2.  A list of all discounts. For each discount, provide its \`name\` and its \`amount\` (as a positive number).
3.  **Crucially, if a discount applies to a specific item, you MUST provide the \`suggestedItemId\` field containing the temporary ID of the item it applies to. If a discount is receipt-wide (e.g., "20% off total"), leave \`suggestedItemId\` empty.**
4.  A list of all service charges or tips.
5.  The currency of the receipt as a 3-letter ISO 4217 code (e.g., USD, GBP, EUR).
6.  For each extracted element (item, discount, service charge), provide a \`confidence\` score from 0 to 100.
7.  The \`overallConfidence\` should be a holistic assessment of your confidence in the entire extraction. It should generally align with the average confidence of the individual items, but be marked down for poor image quality.

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

    let output: ExtractReceiptDataOutput | undefined | null;
    try {
      const response = await extractReceiptDataPrompt(input);
      output = response.output;
    } catch (error) {
      console.error("Error in AI service call:", error);
      // This catch block is ONLY for true service failures (e.g. network, API key issues).
      throw new Error('The AI service failed to process the request. Please try again later.');
    }
      
    console.log('Raw AI Response for receipt:', output);

    if (!output) {
      // This case handles if the AI returns an empty but valid response.
      throw new Error('The AI service returned an empty response.');
    }

    // Now, perform validation. Errors thrown from here will be propagated correctly to the client.
    if (!output.isReceipt) {
      throw new Error(output.rejectionReason || 'The uploaded image does not appear to be a receipt.');
    }
    
    // If the AI determines the image quality is too low, reject it.
    if (output.overallConfidence && output.overallConfidence < 60) {
      throw new Error(output.rejectionReason || 'The receipt image is too unclear to read accurately. Please try again with a better photo.');
    }
    
    return output;
  }
);
