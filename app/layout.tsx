// projects/btc-etf-calculator/frontend/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BTC ETF Dashboard',
  description: 'Live Bitcoin ETF Holdings, Flows, and Calculator',
  icons: {
    icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', // Or a local file if downloaded
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://cryptologos.cc/logos/bitcoin-btc-logo.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
