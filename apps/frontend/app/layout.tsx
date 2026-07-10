import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '企业智能知识库系统',
  description: '企业级智能知识库与问答系统',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
