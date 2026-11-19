const SUBSCRIPTION_MESSAGES = {
  SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_NOT_AVAILABLE: 'Product is not available for subscription',
  DUPLICATE_DAYS_FOUND: 'Duplicate days found in schedule',
  END_DATE_BEFORE_START_DATE: 'End date cannot be earlier than start date',
  INVALID_END_DATE: 'End date cannot be earlier than start date',
  SUBSCRIPTION_ALREADY_PAUSED: 'Subscription is already paused',
  CANNOT_PAUSE_CANCELLED_SUBSCRIPTION: 'Cannot pause a cancelled subscription',
  ONLY_ACTIVE_CAN_BE_PAUSED: 'Only active subscriptions can be paused',
  SUBSCRIPTION_ALREADY_ACTIVE: 'Subscription is already active',
  CANNOT_RESUME_CANCELLED_SUBSCRIPTION:
    'Cannot resume a cancelled subscription',
  ONLY_PAUSED_CAN_BE_RESUMED: 'Only paused subscriptions can be resumed',
  SUBSCRIPTION_ALREADY_CANCELLED: 'Subscription is already cancelled',
  CANNOT_CANCEL_SUBSCRIPTION:
    'Only active or paused subscriptions can be cancelled',
  ONLY_ACTIVE_CAN_ADD_SKIP_DATE:
    'Only active subscriptions can accept skip dates',
  INVALID_DATE_FORMAT: 'Invalid date format. Expected YYYY-MM-DD',
  CANNOT_SKIP_PAST_DATE: 'Skip date cannot be in the past',
  SKIP_DATE_BEFORE_START_DATE:
    'Skip date cannot be earlier than subscription start date',
  SKIP_DATE_AFTER_END_DATE:
    'Skip date cannot be later than subscription end date',
  DATE_NOT_IN_SCHEDULE:
    'Skip date does not correspond to a scheduled delivery day',
  DUPLICATE_SKIP_DATE: 'Skip date already exists for this subscription',
};

export default SUBSCRIPTION_MESSAGES;
