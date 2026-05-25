import { Metadata } from 'next';
import { ApiDocumentationPageClient } from '@/components/pages/ApiDocumentationPageClient';

export const metadata: Metadata = {
  title: 'API Documentation | AnonHost',
  description: 'Explore our API documentation for detailed information.',
};

export default function ApiDocumentationPage() {
  return <ApiDocumentationPageClient />;
}
