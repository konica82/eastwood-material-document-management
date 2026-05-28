import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { PlantProvider } from '@/contexts/PlantContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'vietnamese'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hồ sơ nguyên liệu',
  description: 'Quản lý hồ sơ nguyên liệu lâm sản',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <PlantProvider>
          <ThemeProvider>
            <div
              style={{
                display: 'flex',
                height: '100vh',
                overflow: 'hidden',
                background: 'var(--color-bg-page)',
              }}
            >
              <Sidebar />
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <Header />
                <main
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--space-6)',
                  }}
                >
                  {children}
                </main>
              </div>
            </div>
          </ThemeProvider>
        </PlantProvider>
      </body>
    </html>
  );
}
