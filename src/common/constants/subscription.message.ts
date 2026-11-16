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
};

export default SUBSCRIPTION_MESSAGES;
