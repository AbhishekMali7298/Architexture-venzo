import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Venzowood | Texture Editor',
  description: 'Create seamless tileable textures and material layouts for Venzowood.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }} suppressHydrationWarning>
      <body style={{ height: '100%', overflow: 'hidden' }} suppressHydrationWarning>{children}</body>
    </html>
  );
}
