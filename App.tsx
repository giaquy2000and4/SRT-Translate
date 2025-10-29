import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

import { SrtEntry, TranslatedSrt } from './types';
import { translateSrtContent } from './services/geminiService';
import { parseSrt, stringifySrt } from './services/srtParser';

import FileUpload from './components/FileUpload';
import LanguageSelector from './components/LanguageSelector';
import ResultDisplay from './components/ResultDisplay';
import { TranslateIcon } from './components/icons/TranslateIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { PauseIcon } from './components/icons/PauseIcon';
import { ResumeIcon } from './components/icons/ResumeIcon';
import { CancelIcon } from './components/icons/CancelIcon';

type Status = 'idle' | 'running' | 'paused';

const App: React.FC = () => {
  const [originalSrtContent, setOriginalSrtContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
  const [translatedSrtFiles, setTranslatedSrtFiles] = useState<TranslatedSrt[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accumulatedErrors, setAccumulatedErrors] = useState<string[]>([]);
  
  const ai = useMemo(() => {
    if (process.env.API_KEY) {
      return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    console.error("API key not found. Please make sure it is configured in your environment variables.");
    return null;
  }, []);

  const handleFileSelect = (content: string, name: string) => {
    setOriginalSrtContent(content);
    setFileName(name);
    setTranslatedSrtFiles([]);
    setError('');
    setProgress('');
    setStatus('idle');
  };

  const handleStart = useCallback(() => {
    if (!originalSrtContent) {
      setError('Please upload an SRT file first.');
      return;
    }
    if (targetLanguages.length === 0) {
      setError('Please select at least one target language.');
      return;
    }
    if (!ai) {
      setError("API key not found. Please make sure it is configured in your environment variables.");
      return;
    }
    setError('');
    setAccumulatedErrors([]);
    setTranslatedSrtFiles([]);
    setCurrentIndex(0);
    setStatus('running');
  }, [originalSrtContent, targetLanguages, ai]);

  const handlePause = () => {
    setStatus('paused');
    setProgress(`Paused. Translated ${currentIndex}/${targetLanguages.length}.`);
  };

  const handleResume = () => {
    setStatus('running');
  };

  const handleCancel = () => {
    setStatus('idle');
    setProgress('');
    setError('');
    setTranslatedSrtFiles([]);
    setCurrentIndex(0);
    setAccumulatedErrors([]);
  };

  useEffect(() => {
    if (status !== 'running' || currentIndex >= targetLanguages.length) {
      if (status === 'running' && currentIndex >= targetLanguages.length) {
        setStatus('idle');
        setProgress(`Finished! Translated ${currentIndex} file(s).`);
        if (accumulatedErrors.length > 0) {
          setError(`Some translations failed:\n${accumulatedErrors.join('\n')}`);
        }
      }
      return;
    }

    let isComponentMounted = true;

    const processItem = async () => {
      if (!ai) return;

      const lang = targetLanguages[currentIndex];
      setProgress(`Translating to ${lang} (${currentIndex + 1}/${targetLanguages.length})...`);
      
      try {
        const parsedSrt = parseSrt(originalSrtContent);
        if (parsedSrt.length === 0) {
          throw new Error("The uploaded file does not seem to be a valid SRT file or is empty.");
        }
        
        const translatedTextArray = await translateSrtContent(ai, parsedSrt, lang);
        
        const translatedEntries: SrtEntry[] = parsedSrt.map((entry, index) => ({
          ...entry,
          text: translatedTextArray[index] || entry.text,
        }));
        
        const content = stringifySrt(translatedEntries);
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        
        let langCode = lang.substring(0, 2).toLowerCase();
          switch (lang) {
            case 'Japanese': langCode = 'ja'; break;
            case 'Spanish': langCode = 'es'; break;
            case 'Russian': langCode = 'ru'; break;
            case 'French': langCode = 'fr'; break;
            case 'German': langCode = 'de'; break;
            case 'Chinese (Simplified)': langCode = 'zh-CN'; break;
            case 'Portuguese (Brazil)': langCode = 'pt-BR'; break;
            case 'Korean': langCode = 'ko'; break;
            case 'Italian': langCode = 'it'; break;
            case 'Vietnamese': langCode = 'vi'; break;
            case 'Arabic': langCode = 'ar'; break;
            case 'Hindi': langCode = 'hi'; break;
          }

        const newFileName = `${nameWithoutExt}.${langCode}.srt`;
        
        if (isComponentMounted) {
            setTranslatedSrtFiles(prev => [...prev, { language: lang, content, fileName: newFileName }]);
        }

      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        if (isComponentMounted) {
            setAccumulatedErrors(prev => [...prev, `- ${lang}: ${message}`]);
        }
      } finally {
        if (isComponentMounted) {
            setCurrentIndex(prev => prev + 1);
        }
      }
    };
    
    processItem();

    return () => {
      isComponentMounted = false;
    }

  }, [status, currentIndex, targetLanguages, originalSrtContent, fileName, ai]);

  const isLoading = status === 'running';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            SRT Subtitle Translator
          </h1>
          <p className="text-gray-400 mt-2">Translate your subtitles to multiple languages at once</p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <FileUpload onFileSelect={handleFileSelect} fileName={fileName} />
            <div className="space-y-4">
              <LanguageSelector
                selectedLanguages={targetLanguages}
                onLanguageChange={setTargetLanguages}
              />
               <div className="h-20 flex flex-col justify-center">
                {status === 'idle' && (
                  <button
                    onClick={handleStart}
                    disabled={!originalSrtContent || targetLanguages.length === 0}
                    className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform hover:scale-105 disabled:scale-100"
                  >
                    <TranslateIcon />
                    Translate
                  </button>
                )}
                {(status === 'running' || status === 'paused') && (
                  <div className="space-y-3 text-center">
                    <p className="text-indigo-300 h-5">
                      {isLoading ? <SpinnerIcon /> : null}
                      {progress}
                    </p>
                    <div className="flex justify-center gap-4">
                      {status === 'running' && (
                        <button onClick={handlePause} className="flex items-center justify-center gap-2 w-32 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-500/50">
                          <PauseIcon /> Pause
                        </button>
                      )}
                      {status === 'paused' && (
                        <button onClick={handleResume} className="flex items-center justify-center gap-2 w-32 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/50">
                          <ResumeIcon /> Resume
                        </button>
                      )}
                      <button onClick={handleCancel} className="flex items-center justify-center gap-2 w-32 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-red-500/50">
                        <CancelIcon /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center whitespace-pre-wrap">
              {error}
            </div>
          )}

          <ResultDisplay 
            translatedFiles={translatedSrtFiles} 
            originalFileName={fileName}
          />
        </main>
      </div>
    </div>
  );
};

export default App;