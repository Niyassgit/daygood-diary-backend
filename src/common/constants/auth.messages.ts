export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',

  EMAIL_ALREADY_EXISTS: 'Email already exists',

  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',

  ACCOUNT_NOT_ACTIVE: 'Your account is not active. Please contact support.',

  INVALID_VERIFICATION_LINK: 'Invalid or expired verification link',

  USER_NOT_FOUND: 'User not found',

  INVALID_REFRESH_SESSION: 'Invalid or expired refresh session',

  INVALID_REFRESH_TOKEN: 'Invalid refresh session',

  INVALID_ACCESS_TOKEN: 'Invalid access token',

  ACCOUNT_NOT_ALLOWED: 'Your account is not active or email is not verified.',

  REGISTRATION_SUCCESS: 'Registration successful. Please verify your email.',

  LOGIN_SUCCESS: 'Login successful',

  LOGOUT_SUCCESS: 'Logged out successfully',

  EMAIL_ALREADY_VERIFIED: 'Email already verified',

  EMAIL_VERIFIED: 'Email verified successfully',

  USER_NOT_AUTHENTICATED: 'User not authenticated',

  PERMISSION_DENIED: 'You do not have permission to access this resource',

  PHONE_ALREADY_EXISTS: 'Phone number already exists',
} as const;
