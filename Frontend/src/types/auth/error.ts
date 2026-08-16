export const INVALID_USERNAME = 'INVALID_USERNAME';
export const INVALID_PASSWORD = 'INVALID_PASSWORD';
export const INVALID_CREDENTIALS = 'INVALID_CREDENTIALS';
export type AuthErrorCodes =
  typeof INVALID_USERNAME | typeof INVALID_PASSWORD | typeof INVALID_CREDENTIALS;

// Session
export const SESSION_UNAUTHORIZED = 'SESSION_UNAUTHORIZED';
export const SESSION_REFRESH_FAILED = 'SESSION_REFRESH_FAILED';
export const SESSION_LOCK_IN_PROGRESS = 'SESSION_LOCK_IN_PROGRESS';
export const TOKEN_INVALID = 'TOKEN_INVALID';
export const TOKEN_EXPIRED = 'TOKEN_EXPIRED';
export const SESSION_FAILURE_CODES = [SESSION_UNAUTHORIZED, TOKEN_INVALID, TOKEN_EXPIRED] as const;
export type SessionFailureCode = typeof SESSION_FAILURE_CODES[number];
export const isSessionFailureCode = (code?: string): code is SessionFailureCode => {
  return !!code && (SESSION_FAILURE_CODES as readonly string[]).includes(code);
};
export type SessionErrorCodes =
  typeof SESSION_UNAUTHORIZED | typeof SESSION_REFRESH_FAILED | typeof SESSION_LOCK_IN_PROGRESS | typeof TOKEN_INVALID | typeof TOKEN_EXPIRED;