'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string) => {
    const path = pathname.replace(`/${locale}`, '');
    router.push(`/${newLocale}${path}`);
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-blue-400">⚙️</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('nav.title')}</h1>
              <p className="text-sm text-slate-400">{t('nav.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-2">
              <Globe size={18} className="text-slate-400" />
              <select
                value={locale}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-slate-700 text-white text-sm rounded px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
