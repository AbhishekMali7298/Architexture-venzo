import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Venzowood | Texture Editor',
  description: 'Create seamless tileable textures and material layouts for Venzowood.',
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
