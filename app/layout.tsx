// projects/btc-etf-calculator/frontend/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BTC ETF Dashboard | Live Holdings, Flows & Calculator',
  description: 'Track real-time Bitcoin ETF holdings, daily net inflows, and prices. Use our instant calculator to convert ETF shares (IBIT, FBTC, GBTC) to Bitcoin (BTC). The most accurate data for US Spot Bitcoin ETFs.',
  keywords: [
    'Bitcoin ETF', 'BTC ETF Calculator', 'IBIT to BTC', 
    'Bitcoin ETF Holdings', 'Crypto ETF Flows', 'Spot Bitcoin ETF',
    'BlackRock Bitcoin ETF', 'Fidelity Bitcoin ETF', 'Grayscale Bitcoin Trust',
    'FBTC vs IBIT', 'How much BTC does BlackRock hold'
  ],
  icons: {
    // Standard Favicon
    icon: [
      { url: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png', type: 'image/png' },
    ],
    // Apple Touch Icon (for mobile home screen)
    apple: [
      { url: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    ],
    // Explicit shortcut fallback
    shortcut: ['https://cryptologos.cc/logos/bitcoin-btc-logo.png'],
  },
  openGraph: {
    title: 'BTC ETF Dashboard | Live Tracker',
    description: 'Real-time Bitcoin ETF Holdings, Flows & Conversion Calculator.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BTC ETF Dashboard',
    description: 'Track Bitcoin ETF flows and calculate your BTC exposure instantly.',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Force explicit favicon link as backup */}
        <link rel="icon" href="https://cryptologos.cc/logos/bitcoin-btc-logo.png" type="image/png" />
      </head>
      <body className={inter.className}>
        {children}
        <GoogleAnalytics gaId="G-MW4849FT54" />
      </body>
    </html>
  );
}
