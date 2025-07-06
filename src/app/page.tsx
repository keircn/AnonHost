import { Metadata } from 'next';
import { HomePageClient } from '@/components/pages/HomePageClient';

export const metadata: Metadata = {
  title: 'Home | AnonHost',
  description: 'Fast, easy image hosting without the hassle.',
};

export default function HomePage() {
  return <HomePageClient />;
}
