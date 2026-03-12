import type { Metadata } from 'next';
import { Navbar } from '../components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'NestSocial',
  description: 'A social media app powered by NestJS + Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
