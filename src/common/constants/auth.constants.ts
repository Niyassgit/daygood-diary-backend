export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_TYPE: 'access',
  REFRESH_TOKEN_TYPE: 'refresh',

  REFRESH_SESSION_PREFIX: 'auth:refresh:',
  EMAIL_VERIFICATION_PREFIX: 'email-verification:',

  EMAIL_VERIFICATION_TTL: 60 * 60 * 24,
  REFRESH_SESSION_TTL: 60 * 60 * 24 * 7,

  REDIS_STORE_TTL: 60 * 60 * 24,
} as const;
