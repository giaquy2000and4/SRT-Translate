import React, { useMemo } from 'react';
import { TARGET_LANGUAGES } from '../constants';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguageChange: (languages: string[]) => void;
  originalLanguage?: string | null;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguages, onLanguageChange, originalLanguage, disabled = false }) => {
  
  const availableLanguages = useMemo(() => {
    if (!originalLanguage) {
      return TARGET_LANGUAGES;
    }
    return TARGET_LANGUAGES.filter(lang => lang.label.toLowerCase() !== originalLanguage.toLowerCase());
  }, [originalLanguage]);

  const handleCheckboxChange = (languageValue: string) => {
    const currentIndex = selectedLanguages.indexOf(languageValue);
    const newSelectedLanguages = [...selectedLanguages];

    if (currentIndex === -1) {
      newSelectedLanguages.push(languageValue);
    } else {
      newSelectedLanguages.splice(currentIndex, 1);
    }

    onLanguageChange(newSelectedLanguages);
  };

  const handleSelectAll = () => {
    onLanguageChange(availableLanguages.map(lang => lang.value));
  };

  const handleDeselectAll = () => {
    onLanguageChange([]);
  };

  const containerClasses = `transition-opacity duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="language" className="block text-sm font-medium text-gray-400">
          Translate to ({selectedLanguages.length} selected):
        </label>
        <div className="space-x-2">
           <button onClick={handleSelectAll} disabled={disabled} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold disabled:text-gray-500 disabled:cursor-not-allowed">Select All</button>
           <button onClick={handleDeselectAll} disabled={disabled} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold disabled:text-gray-500 disabled:cursor-not-allowed">Deselect All</button>
        </div>
      </div>
      <div className="max-h-36 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-2 space-y-1 pr-2">
        {availableLanguages.map((lang) => (
          <label key={lang.value} className={`flex items-center space-x-3 p-2 rounded-md ${disabled ? '' : 'hover:bg-gray-600/50 cursor-pointer'} transition-colors duration-200`}>
            <input
              type="checkbox"
              className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-indigo-600 focus:ring-indigo-500 focus:ring-2 disabled:opacity-50"
              checked={selectedLanguages.includes(lang.value)}
              onChange={() => handleCheckboxChange(lang.value)}
              disabled={disabled}
            />
            <span className="text-sm font-medium text-gray-300">{lang.label}</span>
          </label>
        ))}
      </div>
       {originalLanguage && originalLanguage !== 'Detecting...' && originalLanguage !== 'Unknown' && (
          <p className="mt-1.5 text-xs text-gray-500">
            Original language "{originalLanguage}" has been excluded.
          </p>
        )}
    </div>
  );
};

export default LanguageSelector;