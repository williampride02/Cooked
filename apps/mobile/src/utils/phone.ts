// Phone number validation and formatting utilities

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  format: string; // e.g., "(###) ###-####" for US
  maxLength: number;
}

// Common countries with formatting rules
export const countries: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: '(###) ###-####', maxLength: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', format: '(###) ###-####', maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: '#### ######', maxLength: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', format: '#### ### ###', maxLength: 9 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: '### ########', maxLength: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '# ## ## ## ##', maxLength: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', format: '### ### ####', maxLength: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', format: '### ### ###', maxLength: 9 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', format: '## #### ####', maxLength: 10 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', format: '## #####-####', maxLength: 11 },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: '##### #####', maxLength: 10 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: '##-####-####', maxLength: 10 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', format: '##-####-####', maxLength: 10 },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', format: '### #### ####', maxLength: 11 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', format: '# ########', maxLength: 9 },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', format: '##-### ## ##', maxLength: 9 },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', format: '### ## ###', maxLength: 8 },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', format: '## ## ## ##', maxLength: 8 },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', format: '## ### ####', maxLength: 9 },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', format: '## ### ####', maxLength: 9 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', format: '## ### ####', maxLength: 9 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', format: '#### ####', maxLength: 8 },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', format: '#### ####', maxLength: 8 },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', format: '### ### ####', maxLength: 10 },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', format: '## ### ####', maxLength: 9 },
];

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

/**
 * Get default country (US)
 */
export function getDefaultCountry(): Country {
  return countries[0]; // US
}

/**
 * Strip all non-numeric characters from a string
 */
export function stripNonNumeric(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Format a phone number based on country format
 */
export function formatPhoneNumber(value: string, country: Country): string {
  const digits = stripNonNumeric(value);
  const format = country.format;

  let result = '';
  let digitIndex = 0;

  for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
    if (format[i] === '#') {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += format[i];
    }
  }

  return result;
}

/**
 * Validate phone number length and format
 */
export function validatePhoneNumber(value: string, country: Country): boolean {
  const digits = stripNonNumeric(value);
  return digits.length === country.maxLength;
}

/**
 * Convert to E.164 format (e.g., +15551234567)
 */
export function toE164(value: string, country: Country): string {
  const digits = stripNonNumeric(value);
  return `${country.dialCode}${digits}`;
}

/**
 * Get validation error message
 */
export function getPhoneValidationError(value: string, country: Country): string | null {
  const digits = stripNonNumeric(value);

  if (digits.length === 0) {
    return null; // No error for empty
  }

  if (digits.length < country.maxLength) {
    return 'Enter a valid phone number';
  }

  if (digits.length > country.maxLength) {
    return 'Phone number is too long';
  }

  return null;
}

/**
 * Search countries by name or dial code
 */
export function searchCountries(query: string): Country[] {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return countries;
  }

  return countries.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.dialCode.includes(lowerQuery) ||
      c.code.toLowerCase().includes(lowerQuery)
  );
}
