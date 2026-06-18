import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  };

  const isVi = i18n.language && i18n.language.startsWith('vi');

  return (
    <div className="flex bg-gray-100 rounded-full p-1 border border-gray-200">
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
          !isVi ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange('vi')}
        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
          isVi ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        VI
      </button>
    </div>
  );
};

export default LanguageToggle;
