import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StudyHub 2.0 | CBSE Class 10 Board Prep',
  description: 'Complete hub for Class 10 CBSE exam preparation with notes, question banks, and study materials.',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
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
      </head>
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
