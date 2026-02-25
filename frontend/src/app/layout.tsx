import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KlaimSwift Insurance System — WhatsApp-Enabled Claims Management',
  description:
    'Submit, track, and manage insurance claims via WhatsApp. AI-powered fraud detection and M-Pesa payments. Built for the Kenyan insurance market.',
  keywords: ['insurance', 'claims', 'WhatsApp', 'Kenya', 'M-Pesa', 'KlaimSwift'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
