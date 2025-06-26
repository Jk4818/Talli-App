import { config } from 'dotenv';
config();

import '@/ai/flows/flag-ambiguous-items.ts';
import '@/ai/flows/extract-receipt-data.ts';