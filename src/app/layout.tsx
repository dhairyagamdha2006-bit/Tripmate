import type { Metadata } from 'next';
import { AppProviders } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tripmate',
  description: 'Plan smarter. Book with confidence.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
