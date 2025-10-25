// Currency conversion utility
// Exchange rates are relative to USD (1 USD = 1 USDC)

export type Currency = 'USDC' | 'EURC' | 'GBPC' | 'CHFC';

// Exchange rates relative to USD (as of 2024)
// These would typically be fetched from an API in a real application
export const EXCHANGE_RATES: Record<Currency, number> = {
  USDC: 1.0,    // 1 USDC = 1 USD
  EURC: 0.92,   // 1 EURC = 0.92 USD (approximate EUR/USD rate)
  GBPC: 0.79,   // 1 GBPC = 0.79 USD (approximate GBP/USD rate)
  CHFC: 1.10,   // 1 CHFC = 1.10 USD (approximate CHF/USD rate)
};

/**
 * Convert an amount from one currency to another
 * @param amount - The amount to convert (number or string)
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Converted amount
 */
export function convertCurrency(
  amount: number | string,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  // Ensure amount is a number
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle invalid numbers
  if (isNaN(numericAmount)) {
    console.warn('Invalid amount provided to convertCurrency:', amount);
    return 0;
  }

  if (fromCurrency === toCurrency) {
    return numericAmount;
  }

  // Convert to USD first, then to target currency
  const usdAmount = numericAmount / EXCHANGE_RATES[fromCurrency];
  const convertedAmount = usdAmount * EXCHANGE_RATES[toCurrency];
  
  return convertedAmount;
}

/**
 * Format currency amount with proper decimal places
 * @param amount - The amount to format (number or string)
 * @param currency - The currency symbol
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string, currency: Currency): string {
  // Ensure amount is a number
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle invalid numbers
  if (isNaN(numericAmount)) {
    console.warn('Invalid amount provided to formatCurrency:', amount);
    return `0.00 ${currency}`;
  }

  return `${numericAmount.toFixed(2)} ${currency}`;
}

/**
 * Convert and format currency in one step
 * @param amount - The amount to convert (number or string)
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Formatted converted currency string
 */
export function convertAndFormatCurrency(
  amount: number | string,
  fromCurrency: Currency,
  toCurrency: Currency
): string {
  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
  return formatCurrency(convertedAmount, toCurrency);
}

/**
 * Get the user's preferred currency from localStorage
 * @returns User's preferred currency or USDC as default
 */
export function getUserCurrency(): Currency {
  const savedCurrency = localStorage.getItem('userCurrency') as Currency;
  return savedCurrency && Object.keys(EXCHANGE_RATES).includes(savedCurrency) 
    ? savedCurrency 
    : 'USDC';
}

/**
 * Set the user's preferred currency in localStorage
 * @param currency - The currency to set
 */
export function setUserCurrency(currency: Currency): void {
  localStorage.setItem('userCurrency', currency);
}
