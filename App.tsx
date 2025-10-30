import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

import { SrtEntry, TranslatedSrt, TranslationJob } from './types';
import { translateSrtContent } from './services/geminiService';
import { parseSrt, stringifySrt } from './services/srtParser';

import FileUpload from './components/FileUpload';
import LanguageSelector from './components/LanguageSelector';
import ResultDisplay from './components/ResultDisplay';
import ProgressDisplay from './components/ProgressDisplay';
import { TranslateIcon } from './components/icons/TranslateIcon';
import { PauseIcon } from './components/icons/PauseIcon';
import { ResumeIcon } from './components/icons/ResumeIcon';
import { CancelIcon } from './components/icons/CancelIcon';
import { InfoIcon } from './components/icons/InfoIcon';
import { LANGUAGE_CODE_MAP } from './constants';

type Status = 'idle' | 'running' | 'paused';

const App: React.FC = () => {
  const [originalSrtContent, setOriginalSrtContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState<number>(50);
  const [translationJobs, setTranslationJobs] = useState<TranslationJob[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  
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
    setTranslationJobs([]);
    setError('');
    setProgressMessage('');
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
    setProgressMessage('');
    setStartTime(Date.now());
    const jobs: TranslationJob[] = targetLanguages.map(lang => ({
      language: lang,
      status: 'pending',
    }));
    setTranslationJobs(jobs);
    setStatus('running');
  }, [originalSrtContent, targetLanguages, ai]);

  const handlePause = () => {
    setStatus('paused');
  };

  const handleResume = () => {
    setStatus('running');
  };

  const handleCancel = () => {
    setStatus('idle');
    setProgressMessage('');
    setError('');
    setTranslationJobs([]);
    setStartTime(null);
  };

  useEffect(() => {
    if (status !== 'running') {
      return;
    }

    const isJobRunning = translationJobs.some(job => job.status === 'translating');
    if (isJobRunning) {
      return; // Wait for the current job to finish
    }

    const nextJobIndex = translationJobs.findIndex(job => job.status === 'pending');

    if (nextJobIndex === -1) {
      // All jobs are done
      if (translationJobs.length > 0) {
        setStatus('idle');
        setStartTime(null);
        const completedCount = translationJobs.filter(job => job.status === 'completed').length;
        setProgressMessage(`Finished! Translated ${completedCount}/${translationJobs.length} file(s).`);
        const failedJobs = translationJobs.filter(job => job.status === 'failed');
        if (failedJobs.length > 0) {
          setError(`Some translations failed. See details in the progress list.`);
        }
      }
      return;
    }

    const processItem = async () => {
      if (!ai) return;

      const parsedSrt = parseSrt(originalSrtContent);
      const totalCount = parsedSrt.length;
      
      setTranslationJobs(prevJobs => prevJobs.map((job, index) => 
        index === nextJobIndex ? { ...job, status: 'translating', translatedCount: 0, totalCount } : job
      ));

      const lang = translationJobs[nextJobIndex].language;
      
      const handleProgress = (chunkSize: number) => {
        setTranslationJobs(prevJobs => prevJobs.map((job, index) => {
            if (index !== nextJobIndex) return job;
            const newCount = (job.translatedCount || 0) + chunkSize;
            const finalCount = Math.min(newCount, job.totalCount || totalCount);
            return { ...job, translatedCount: finalCount };
        }));
      };

      try {
        if (totalCount === 0) {
          throw new Error("The uploaded file does not seem to be a valid SRT file or is empty.");
        }
        
        const translatedTextArray = await translateSrtContent(ai, parsedSrt, lang, batchSize, handleProgress);
        
        const translatedEntries: SrtEntry[] = parsedSrt.map((entry, index) => ({
          ...entry,
          text: translatedTextArray[index] || entry.text,
        }));
        
        const content = stringifySrt(translatedEntries);
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        
        const langCode = LANGUAGE_CODE_MAP[lang] || lang.substring(0, 2).toLowerCase();
        const newFileName = `${nameWithoutExt}.${langCode}.srt`;
        
        setTranslationJobs(prevJobs => prevJobs.map((job, index) =>
            index === nextJobIndex ? { ...job, status: 'completed', content, fileName: newFileName, translatedCount: totalCount } : job
        ));

      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setTranslationJobs(prevJobs => prevJobs.map((job, index) =>
            index === nextJobIndex ? { ...job, status: 'failed', error: message } : job
        ));
      }
    };
    
    processItem();

  }, [status, translationJobs, originalSrtContent, fileName, ai, batchSize]);

  const translatedFiles = useMemo(() => 
    translationJobs
      .filter((job): job is Required<TranslationJob> => job.status === 'completed')
      .map(job => ({ language: job.language, content: job.content, fileName: job.fileName })),
    [translationJobs]
  );

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
              <div>
                <div className="relative group flex items-center gap-1.5 cursor-pointer">
                  <label htmlFor="batch-size" className="block text-sm font-medium text-gray-400">
                    Batch Size
                  </label>
                  <InfoIcon />
                  <div className="absolute left-0 bottom-full mb-2 w-64 hidden group-hover:block bg-gray-900 text-gray-300 text-xs rounded-lg p-3 shadow-lg border border-gray-600 z-10">
                    <p className="font-bold mb-1">How Batch Size Affects Translation:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><span className="font-semibold">Speed:</span> Larger batches can be faster as they reduce the number of API calls.</li>
                      <li><span className="font-semibold">Reliability:</span> Smaller batches are more reliable. If one API call fails, only a small chunk is affected.</li>
                    </ul>
                    <p className="mt-2">Recommended range is <span className="font-mono bg-gray-700/50 px-1 py-0.5 rounded">25-100</span>. Default is 50.</p>
                  </div>
                </div>
                <input
                  type="number"
                  id="batch-size"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  min="1"
                  max="200"
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-lg shadow-sm py-2 px-3 text-gray-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  aria-describedby="batch-size-helper"
                />
                <p id="batch-size-helper" className="mt-1 text-xs text-gray-500">
                  Subtitles per API request. Hover over the icon for details.
                </p>
              </div>
               <div className="min-h-[5rem] flex flex-col justify-center">
                {status === 'idle' && (
                  <>
                    <button
                      onClick={handleStart}
                      disabled={!originalSrtContent || targetLanguages.length === 0}
                      className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform hover:scale-105 disabled:scale-100"
                    >
                      <TranslateIcon />
                      Translate
                    </button>
                    {progressMessage && <p className="text-center text-sm text-gray-400 mt-2">{progressMessage}</p>}
                  </>
                )}
                {(status === 'running' || status === 'paused') && (
                  <div className="space-y-3">
                     <ProgressDisplay jobs={translationJobs} appStatus={status} startTime={startTime} />
                    <div className="flex justify-center gap-4 pt-2">
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
            translatedFiles={translatedFiles} 
            originalFileName={fileName}
          />
        </main>
      </div>
    </div>
  );
};

export default App;