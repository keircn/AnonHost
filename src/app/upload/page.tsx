import { Metadata } from 'next';
import { UploadPageClient } from '@/components/pages/UploadPageClient';

export const metadata: Metadata = {
  title: 'Upload | AnonHost',
  description: 'Upload your files securely.',
};

export default function UploadPage() {
  return <UploadPageClient />;
}
