import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Architextura',
  description: 'Create seamless architectural textures with PBR maps.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }} suppressHydrationWarning>
      <body style={{ height: '100%', overflow: 'hidden' }} suppressHydrationWarning>{children}</body>
    </html>
  );
}
