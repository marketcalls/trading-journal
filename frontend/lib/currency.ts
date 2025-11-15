/**
 * Format number as Indian Rupee (INR)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string with ₹ symbol
 */
export function formatINR(amount: number, decimals: number = 2): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format number in Indian numbering system (lakhs, crores)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatINRCompact(amount: number): string {
  const absAmount = Math.abs(amount);

  if (absAmount >= 10000000) {
    // Crores
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    // Lakhs
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (absAmount >= 1000) {
    // Thousands
    return `₹${(amount / 1000).toFixed(2)} K`;
  }

  return formatINR(amount);
}
