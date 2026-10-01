/**
 * Formats a numeric value into Sri Lankan Rupees (LKR).
 * Example: 48500 -> "LKR 48,500"
 */
export const formatLKR = (amount) => {
  const numericAmount = Number(amount) || 0;
  return `LKR ${numericAmount.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
};
