/**
 * Utility functions for currency conversion and formatting
 */

/**
 * Converts a cost string to INR format
 * Handles various input formats: $100, 100 USD, ₹5000, 5000, etc.
 */
export function convertToINR(costString: string): string {
  if (!costString) return '₹0';
  
  // Extract numeric value
  const numericValue = parseFloat(costString.replace(/[^0-9.]/g, ''));
  if (isNaN(numericValue) || numericValue === 0) return '₹0';
  
  // Detect currency from the string
  const upperCost = costString.toUpperCase();
  let convertedValue = numericValue;
  
  // If already in INR, return as is
  if (upperCost.includes('₹') || upperCost.includes('INR') || upperCost.includes('RS') || upperCost.includes('RUPEES')) {
    return formatINR(numericValue);
  }
  
  // Convert from other currencies to INR (approximate rates)
  // These are approximate rates - for production, use real-time exchange rates
  const exchangeRates: { [key: string]: number } = {
    'USD': 83,      // 1 USD = 83 INR (approximate)
    '$': 83,
    'EUR': 90,      // 1 EUR = 90 INR (approximate)
    '€': 90,
    'GBP': 105,     // 1 GBP = 105 INR (approximate)
    '£': 105,
    'JPY': 0.56,    // 1 JPY = 0.56 INR (approximate)
    '¥': 0.56,
    'AUD': 55,      // 1 AUD = 55 INR (approximate)
    'CAD': 61,      // 1 CAD = 61 INR (approximate)
    'SGD': 62,      // 1 SGD = 62 INR (approximate)
    'CHF': 93,      // 1 CHF = 93 INR (approximate)
    'CNY': 11.5,    // 1 CNY = 11.5 INR (approximate)
    'MXN': 4.8,     // 1 MXN = 4.8 INR (approximate)
    'BRL': 16.5,    // 1 BRL = 16.5 INR (approximate)
  };
  
  // Find matching currency
  for (const [currency, rate] of Object.entries(exchangeRates)) {
    if (upperCost.includes(currency)) {
      convertedValue = numericValue * rate;
      break;
    }
  }
  
  // If no currency detected, assume it's already in INR
  return formatINR(convertedValue);
}

/**
 * Formats a number as INR currency
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { 
    maximumFractionDigits: 0,
    minimumFractionDigits: 0 
  })}`;
}

/**
 * Formats a cost string to INR, preserving the original if conversion fails
 */
export function formatCostToINR(costString: string | undefined | null): string {
  if (!costString) return '₹0';
  return convertToINR(costString);
}

