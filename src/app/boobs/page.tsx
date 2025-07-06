import { Metadata } from 'next';
import { BoobsPageClient } from '@/components/pages/BoobsPageClient';

export const metadata: Metadata = {
  title: 'Boobs | AnonHost',
  description: 'boobs :3',
};

export default function BoobsPage() {
  return <BoobsPageClient />;
}
