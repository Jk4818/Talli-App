import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amountInCents: number, currencyCode: string) => {
  // Sanitize common symbols to ISO codes
  let sanitizedCode = currencyCode?.toUpperCase().trim() || 'USD'; // Default to USD if null/undefined
  if (sanitizedCode === '£' || sanitizedCode === 'POUND' || sanitizedCode === 'POUNDS' || sanitizedCode === 'STERLING') {
    sanitizedCode = 'GBP';
  } else if (sanitizedCode === '$' || sanitizedCode === 'DOLLAR' || sanitizedCode === 'DOLLARS') {
    sanitizedCode = 'USD';
  } else if (sanitizedCode === '€' || sanitizedCode === 'EURO' || sanitizedCode === 'EUROS') {
    sanitizedCode = 'EUR';
  }

  try {
    // Attempt to format with the sanitized code
    return (amountInCents / 100).toLocaleString(undefined, { style: 'currency', currency: sanitizedCode });
  } catch (e) {
    // If it still fails, log the error and fallback to a default currency (e.g., USD)
    console.error(`Failed to format currency with code: '${currencyCode}' (Sanitized: '${sanitizedCode}'). Falling back to USD.`, e);
    return (amountInCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }
};
