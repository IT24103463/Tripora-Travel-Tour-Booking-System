/**
 * Client-Side Payment Validation & Formatting Helpers
 * Strictly validates card details using Luhn algorithm, future expiry checks, and CVV rules.
 */

/**
 * Validates digit string using the Luhn checksum formula (MOD 10).
 * @param {string} digits - String of numeric digits without spaces or hyphens.
 * @returns {boolean} True if checksum passes.
 */
export function validateLuhn(digits) {
  if (!digits || typeof digits !== 'string' || !/^\d+$/.test(digits)) {
    return false;
  }
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/**
 * Detects payment card network based on prefix.
 * @param {string} cleanNumber - Card number digits only.
 * @returns {string} 'VISA' | 'MC' | 'AMEX' | 'DISCOVER' | 'UNKNOWN'
 */
export function getCardBrand(cleanNumber) {
  if (!cleanNumber) return 'UNKNOWN';
  if (/^4/.test(cleanNumber)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(cleanNumber)) return 'MC';
  if (/^3[47]/.test(cleanNumber)) return 'AMEX';
  if (/^(6011|65|64[4-9])/.test(cleanNumber)) return 'DISCOVER';
  return 'UNKNOWN';
}

/**
 * Formats a raw input value into spaced card number.
 * @param {string} value 
 * @returns {string}
 */
export function formatCardNumber(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 16);
  if (/^3[47]/.test(digits)) {
    // Amex: 4-6-5 format
    return digits
      .replace(/(\d{4})(\d)/, '$1 $2')
      .replace(/(\d{4}) (\d{6})(\d)/, '$1 $2 $3')
      .trim();
  }
  // Standard 4-4-4-4 format
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/**
 * Validates card number format, length (15-16), and Luhn checksum.
 * @param {string} formattedOrRawNumber 
 * @returns {{ isValid: boolean, error: string, brand: string }}
 */
export function validateCardNumber(formattedOrRawNumber) {
  const digits = String(formattedOrRawNumber || '').replace(/\D/g, '');
  const brand = getCardBrand(digits);

  if (!digits) {
    return { isValid: false, error: 'Card number is required.', brand };
  }

  if (digits.length < 15 || digits.length > 16) {
    return { isValid: false, error: 'Card number must be 15 or 16 digits.', brand };
  }

  if (!validateLuhn(digits)) {
    return { isValid: false, error: 'Invalid card number (checksum failed). Please check digits.', brand };
  }

  return { isValid: true, error: '', brand };
}

/**
 * Formats input into MM/YY format.
 * @param {string} value 
 * @returns {string}
 */
export function formatExpiryDate(value) {
  const clean = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return clean;
}

/**
 * Validates expiration date ensuring format MM/YY and future date.
 * @param {string} expiryStr 
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateExpiryDate(expiryStr) {
  if (!expiryStr) {
    return { isValid: false, error: 'Expiry date is required.' };
  }

  const match = expiryStr.trim().match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    return { isValid: false, error: 'Expiry date must be in MM/YY format.' };
  }

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Invalid expiry month (must be 01–12).' };
  }

  const now = new Date();
  const currentYear = now.getFullYear() % 100; // 2-digit year (e.g., 26)
  const currentMonth = now.getMonth() + 1; // 1-indexed (1-12)

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false, error: 'Card has expired. Please enter a future expiry date.' };
  }

  // Sanity check: Expiry beyond 25 years into future is unlikely valid
  if (year > currentYear + 25) {
    return { isValid: false, error: 'Please enter a valid expiry year.' };
  }

  return { isValid: true, error: '' };
}

/**
 * Validates CVV / CVC code (3 or 4 digits).
 * @param {string} cvvStr 
 * @param {string} cardBrand 
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateCvv(cvvStr, cardBrand = 'UNKNOWN') {
  const clean = String(cvvStr || '').replace(/\D/g, '');
  if (!clean) {
    return { isValid: false, error: 'CVV is required.' };
  }

  if (cardBrand === 'AMEX') {
    if (clean.length !== 4 && clean.length !== 3) {
      return { isValid: false, error: 'Amex CVV must be 4 digits (or 3).' };
    }
  } else {
    if (clean.length !== 3 && clean.length !== 4) {
      return { isValid: false, error: 'CVV must be 3 or 4 digits.' };
    }
  }

  return { isValid: true, error: '' };
}

/**
 * Validates Cardholder Full Name.
 * @param {string} nameStr 
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateCardholderName(nameStr) {
  const trimmed = String(nameStr || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Cardholder name is required.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Cardholder name must be at least 2 characters.' };
  }
  if (!/^[a-zA-Z\s'’.\-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Cardholder name contains invalid characters.' };
  }
  return { isValid: true, error: '' };
}

