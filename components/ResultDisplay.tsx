import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { TranslatedSrt } from '../types';

declare const JSZip: any;

interface ResultDisplayProps {
  translatedFiles: TranslatedSrt[];
  originalFileName: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ translatedFiles, originalFileName }) => {
  if (translatedFiles.length === 0) {
    return null;
  }

  const handleDownload = async () => {
    try {
      const zip = new JSZip();
      
      translatedFiles.forEach(file => {
        zip.file(file.fileName, file.content);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const nameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
      a.download = `${nameWithoutExt}-translations.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to create ZIP file", error);
      alert("An error occurred while creating the ZIP file.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-300">Translation Results ({translatedFiles.length} files)</h3>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/50 transform hover:scale-105"
        >
          <DownloadIcon />
          Download All (.zip)
        </button>
      </div>
      <div className="w-full max-h-64 p-3 bg-gray-900 border border-gray-700 rounded-lg overflow-y-auto">
        <ul className="space-y-2">
          {translatedFiles.map((file, index) => (
             <li key={index} className="text-gray-300 font-mono text-sm flex items-center gap-3 p-1">
               <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
               <span className="truncate">{file.fileName}</span>
             </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ResultDisplay;