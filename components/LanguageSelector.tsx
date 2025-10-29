import React from 'react';
import { TARGET_LANGUAGES } from '../constants';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguageChange: (languages: string[]) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguages, onLanguageChange }) => {
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
    onLanguageChange(TARGET_LANGUAGES.map(lang => lang.value));
  };

  const handleDeselectAll = () => {
    onLanguageChange([]);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="language" className="block text-sm font-medium text-gray-400">
          Translate to ({selectedLanguages.length} selected):
        </label>
        <div className="space-x-2">
           <button onClick={handleSelectAll} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">Select All</button>
           <button onClick={handleDeselectAll} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">Deselect All</button>
        </div>
      </div>
      <div className="max-h-36 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-2 space-y-1 pr-2">
        {TARGET_LANGUAGES.map((lang) => (
          <label key={lang.value} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-600/50 cursor-pointer transition-colors duration-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
              checked={selectedLanguages.includes(lang.value)}
              onChange={() => handleCheckboxChange(lang.value)}
            />
            <span className="text-sm font-medium text-gray-300">{lang.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;