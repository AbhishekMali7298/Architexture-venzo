import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Texture | Textura',
  description: 'Create seamless tileable textures with PBR maps for architecture and design.',
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
