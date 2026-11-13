export const CLIENT_STATUSES = ["prospect", "active", "paused", "ended"] as const;
export const CURRENCIES = ["USD", "AUD", "CAD", "GBP", "EUR", "NZD", "SGD", "PHP"] as const;
export const BILLING_CYCLES = ["weekly", "biweekly", "monthly"] as const;
export const CLIENT_DOC_TYPES = ["contract", "nda", "sow", "other"] as const;

export const SERVICE_SUGGESTIONS = [
  "Administrative support",
  "Email and calendar management",
  "Customer support",
  "Social media management",
  "Bookkeeping",
  "Lead generation",
  "Graphic design",
  "Data entry",
];

export const PAYMENT_SUGGESTIONS = ["Wise", "PayPal", "Bank transfer", "Payoneer", "Stripe invoice"];
