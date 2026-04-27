export const PLAN_DETAILS = {
  free: {
    name: "Community",
    badge: "Free Forever",
    priceLabel: "$0",
    intervalLabel: "/forever",
    features: [
      "Up to 100MB per file",
      "1GB total storage",
      "Image optimization & conversion",
      "Video compression",
      "URL shortening",
      "Basic API access",
      "Community support",
    ],
  },
  premium: {
    name: "Supporter",
    badge: "Premium",
    monthlyPriceLabel: "$5",
    monthlyIntervalLabel: "/month",
    yearlyPriceLabel: "$50",
    yearlyIntervalLabel: "/year",
    savingsLabel: "Save $10 yearly",
    heroSubtitle: "Faster workflows, higher limits, and direct support.",
    features: [
      "Everything in Free",
      "Up to 2GB per file",
      "Unlimited total storage",
      "Direct-to-R2 upload pipeline",
      "Custom domains",
      "Advanced file processing",
      "Premium API features",
      "Priority support",
      "Early access to new features",
    ],
  },
} as const;

export function getPremiumCheckoutUrls() {
  return {
    monthly: process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_URL || "",
    yearly: process.env.NEXT_PUBLIC_PREMIUM_YEARLY_URL || "",
  };
}
