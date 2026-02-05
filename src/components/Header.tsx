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
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 h-16 flex-shrink-0">
      <div className="h-full px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">{t('nav.title')}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 rounded-md p-1.5 border border-slate-700">
            <Globe size={16} className="text-slate-400 ml-1" />
            <select
              value={locale}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-transparent text-slate-200 text-sm rounded px-1 py-0.5 border-0 focus:outline-none focus:ring-0 cursor-pointer hover:text-white"
            >
              <option value="en" className="bg-slate-800">English</option>
              <option value="zh" className="bg-slate-800">中文</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
