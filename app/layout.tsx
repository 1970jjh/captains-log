import type { Metadata } from 'next';
import { Space_Grotesk, Noto_Sans_KR, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const notoSansKR = Noto_Sans_KR({ subsets: ['latin'], variable: '--font-noto' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "CAPTAIN'S LOG - Leadership Simulation",
  description: '신임 팀장 리더십 시뮬레이션 | AI-Digital Gamification Training',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${spaceGrotesk.variable} ${notoSansKR.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-cl-bg text-cl-text font-[family-name:var(--font-noto)] min-h-screen selection:bg-cl-gold/30 selection:text-cl-navy">
        {children}
      </body>
    </html>
  );
}
