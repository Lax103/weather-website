export const ALLOWED_COUNTRY_CODES = new Set(['US', 'CA', 'MX']);

export function isAllowedCountry(code?: string) {
  if (!code) return false;
  return ALLOWED_COUNTRY_CODES.has(code.toUpperCase());
}
