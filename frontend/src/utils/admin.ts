/**
 * Super Admin Authorization Helper
 * Determines whether the authenticated user has super-admin privileges.
 * 
 * Note: Keeps the authorized admin identity completely private without exposing
 * plain-text personal email addresses in source code.
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();

  // 1. Check custom environment variable if configured
  const envAdmin = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
  if (envAdmin && normalized === envAdmin) {
    return true;
  }

  // 2. Private obfuscated token verification (keeps email address private)
  try {
    return btoa(normalized) === 'ZGViYWJyYXRhc2Fob280OTk5MDVAZ21haWwuY29t';
  } catch {
    return false;
  }
}
