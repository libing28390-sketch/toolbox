import type { Metadata } from 'next';
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
// import Script from 'next/script'; // 验证阶段建议暂时移除这个组件，改用原生标签
import '../globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'ToolBox - Developer Tools',
  description: 'A comprehensive collection of developer tools for coding, data conversion, and more.',
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        {/* 🔥 Google AdSense 验证代码 
           直接使用原生 script 标签放在 head 中，避免 Next.js 的 hydration 延迟 
        */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6075673407634107"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}