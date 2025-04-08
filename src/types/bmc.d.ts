export interface BMCSubscription {
  subscription_id: number;
  subscription_cancelled_on: string | null;
  subscription_created_on: string;
  subscription_current_period_start: string;
  subscription_current_period_end: string;
  subscription_coffee_price: string;
  subscription_currency: string;
  subscription_is_cancelled: boolean | null;
  subscription_is_cancelled_at_period_end: boolean | null;
  payer_email: string;
  transaction_id: string;
}

export interface BMCSubscriptionsResponse {
  data: BMCSubscription[];
}

export interface BMCSingleSubscriptionResponse {
  subscription_id: number;
  subscription_cancelled_on: string | null;
  subscription_created_on: string;
  subscription_current_period_start: string;
  subscription_current_period_end: string;
  subscription_coffee_price: string;
  subscription_currency: string;
  subscription_is_cancelled: boolean | null;
  subscription_is_cancelled_at_period_end: boolean | null;
  payer_email: string;
  transaction_id: string;
}