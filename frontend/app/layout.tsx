import type { Metadata } from 'next';

import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Assighno',
    template: '%s | Assighno',
  },
  description: 'Assighno turns Telegram assignment drop-offs into a clear dashboard workflow.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
