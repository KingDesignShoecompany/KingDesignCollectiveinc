import '../styles/globals.css';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'KingDesign OS',
  description: 'KingDesign Collective — executive OS dashboard in Telegram',
  themeColor: '#0a0a0b',
  viewport: 'width=device-width, initial-scale=1.0, viewport-fit=coverage',
  manifest: '/tma-manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
