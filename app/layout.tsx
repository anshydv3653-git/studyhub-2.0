import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyHub 2.0 | CBSE Class 10 Board Exam Prep',
  description: 'Complete hub for Class 10 CBSE exam preparation. Free notes, question banks, formulas, and AI study tutor.',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'StudyHub 2.0',
    description: 'Your complete hub for CBSE Class 10 Board Prep',
    url: 'https://studyhub-2-0-five.vercel.app',
    siteName: 'StudyHub 2.0',
    images: [
      {
        url: 'https://studyhub-2-0-five.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_IN',
    type: 'website',
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
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
