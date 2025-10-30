import React, { useState, useEffect } from 'react';
import { TranslationJob } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CrossIcon } from './icons/CrossIcon';
import { PauseIcon } from './icons/PauseIcon';
import { PendingIcon } from './icons/PendingIcon';

type AppStatus = 'idle' | 'running' | 'paused';

interface ProgressDisplayProps {
  jobs: TranslationJob[];
  appStatus: AppStatus;
  startTime: number | null;
}

const StatusIcon: React.FC<{ jobStatus: TranslationJob['status'], appStatus: AppStatus }> = ({ jobStatus, appStatus }) => {
  switch (jobStatus) {
    case 'translating':
      return appStatus === 'running' ? <SpinnerIcon /> : <div className="w-5 h-5 flex items-center justify-center text-yellow-400"><PauseIcon /></div>;
    case 'completed':
      return <CheckIcon />;
    case 'failed':
      return <CrossIcon />;
    case 'pending':
    default:
      return <PendingIcon />;
  }
};

const formatTime = (ms: number): string => {
  if (ms <= 0) return '';
  if (ms < 1000) return '~ < 1s remaining';

  let totalSeconds = Math.round(ms / 1000);

  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0) {
    parts.push(`${seconds}s`);
  }

  if (parts.length === 0) {
    return '~ 0s remaining';
  }

  return `~ ${parts.join(' ')} remaining`;
};


const ProgressDisplay: React.FC<ProgressDisplayProps> = ({ jobs, appStatus, startTime }) => {
  const [estimatedTime, setEstimatedTime] = useState('');
  
  if (jobs.length === 0) return null;

  const firstJobWithTotal = jobs.find(j => j.totalCount !== undefined);
  const totalSubtitlesPerJob = firstJobWithTotal?.totalCount || 0;
  
  const totalSubtitlesAllJobs = totalSubtitlesPerJob * jobs.length;
  const totalTranslatedSubtitles = jobs.reduce((sum, job) => sum + (job.translatedCount || 0), 0);
  
  const percentage = totalSubtitlesAllJobs > 0 
    ? Math.round((totalTranslatedSubtitles / totalSubtitlesAllJobs) * 100) 
    : 0;
  
  useEffect(() => {
    let intervalId: number | undefined;

    if (appStatus === 'running' && startTime && totalTranslatedSubtitles > 0 && totalTranslatedSubtitles < totalSubtitlesAllJobs) {
      intervalId = window.setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const subtitlesPerMs = totalTranslatedSubtitles / elapsedTime;
        const remainingSubtitles = totalSubtitlesAllJobs - totalTranslatedSubtitles;
        
        if (subtitlesPerMs > 0) {
          const remainingTimeMs = remainingSubtitles / subtitlesPerMs;
          setEstimatedTime(formatTime(remainingTimeMs));
        }
      }, 1000);
    } else {
      setEstimatedTime('');
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobs, appStatus, startTime, totalSubtitlesAllJobs, totalTranslatedSubtitles]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-semibold text-gray-400">Overall Progress</h3>
        <span className="text-sm font-medium text-gray-300" aria-live="polite">{percentage}% Complete</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>
       {estimatedTime && (
        <p className="text-right text-xs text-gray-400 -mt-1" aria-live="polite">{estimatedTime}</p>
      )}
      <div className="w-full max-h-48 p-3 bg-gray-900 border border-gray-700 rounded-lg overflow-y-auto mt-2">
        <ul className="space-y-3">
          {jobs.map((job) => {
            const jobPercentage = (job.totalCount && job.totalCount > 0)
              ? Math.round(((job.translatedCount || 0) / job.totalCount) * 100)
              : 0;
            
            const showProgressBar = (job.status === 'translating' || job.status === 'completed' || (job.status === 'failed' && job.translatedCount !== undefined && job.translatedCount > 0));

            const getBarColor = () => {
              if (job.status === 'completed') return 'bg-green-500';
              if (job.status === 'failed') return 'bg-red-500';
              return 'bg-indigo-500';
            };

            return (
              <li key={job.language} className="text-gray-300 text-sm" title={job.error ?? undefined}>
                <div className="flex items-center gap-3">
                  <StatusIcon jobStatus={job.status} appStatus={appStatus} />
                  <span className="flex-1 truncate">{job.language}</span>
                  {(job.status === 'translating' || job.status === 'completed') && job.translatedCount !== undefined && job.totalCount !== undefined && (
                    <span className="text-xs text-gray-400 font-mono whitespace-nowrap tabular-nums">
                      ({job.translatedCount}/{job.totalCount})
                    </span>
                  )}
                  {job.status === 'failed' && <span className="text-red-400 text-xs truncate">- Failed</span>}
                </div>
                {showProgressBar && job.totalCount && job.totalCount > 0 && (
                  <div className="mt-1.5 ml-8"> {/* Aligned with text, skipping icon */}
                    <div 
                      className="w-full bg-gray-600 rounded-full h-1"
                      role="progressbar" 
                      aria-label={`Translation progress for ${job.language}`} 
                      aria-valuenow={jobPercentage} 
                      aria-valuemin={0} 
                      aria-valuemax={100}
                    >
                      <div
                        className={`${getBarColor()} h-1 rounded-full transition-all duration-300`}
                        style={{ width: `${jobPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ProgressDisplay;