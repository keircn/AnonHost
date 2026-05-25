import { Metadata } from 'next';
import { PricingPageClient } from '@/components/pages/PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing | AnonHost',
  description: "Choose the plan that's right for you.",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
