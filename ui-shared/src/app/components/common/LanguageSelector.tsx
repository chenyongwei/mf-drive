import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
];

const LanguageSelector: React.FC = () => {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleLanguageChange = (code: string) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-slate-100 
                   transition-colors text-sm text-slate-600"
                title={t('common.settings')}
            >
                <span className="text-base">{currentLanguage.flag}</span>
                <span className="hidden sm:inline">{currentLanguage.name}</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-xl border 
                        border-slate-200 py-1 min-w-[140px] z-50">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 
                         hover:bg-slate-50 transition-colors ${i18n.language === lang.code
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-700'
                                }`}
                        >
                            <span className="text-base">{lang.flag}</span>
                            <span>{lang.name}</span>
                            {i18n.language === lang.code && (
                                <svg className="w-4 h-4 ml-auto text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
