import React from 'react';
import { TranslationJob } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CrossIcon } from './icons/CrossIcon';
import { PauseIcon } from './icons/PauseIcon';
import { PendingIcon } from './icons/PendingIcon';

type AppStatus = 'idle' | 'running' | 'paused';

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

const ProgressDisplay: React.FC<{ jobs: TranslationJob[], appStatus: AppStatus }> = ({ jobs, appStatus }) => {
  if (jobs.length === 0) return null;

  const firstJobWithTotal = jobs.find(j => j.totalCount !== undefined);
  const totalSubtitlesPerJob = firstJobWithTotal?.totalCount || 0;
  
  const totalSubtitlesAllJobs = totalSubtitlesPerJob * jobs.length;
  const totalTranslatedSubtitles = jobs.reduce((sum, job) => sum + (job.translatedCount || 0), 0);
  
  const percentage = totalSubtitlesAllJobs > 0 
    ? Math.round((totalTranslatedSubtitles / totalSubtitlesAllJobs) * 100) 
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-semibold text-gray-400">Overall Progress</h3>
        <span className="text-sm font-medium text-gray-300" aria-live="polite">{percentage}% Complete</span>
      </div>
      {/* Fix: Changed aria-valuemin and aria-valuemax to be numbers instead of strings to match TypeScript types. */}
      <div className="w-full bg-gray-700 rounded-full h-2.5" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="w-full max-h-48 p-3 bg-gray-900 border border-gray-700 rounded-lg overflow-y-auto">
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li key={job.language} className="text-gray-300 text-sm flex items-center gap-3 p-1" title={job.error}>
              <StatusIcon jobStatus={job.status} appStatus={appStatus} />
              <span className="flex-1 truncate">{job.language}</span>
              {(job.status === 'translating' || job.status === 'completed') && job.translatedCount !== undefined && job.totalCount !== undefined && (
                <span className="text-xs text-gray-400 font-mono whitespace-nowrap tabular-nums">
                  ({job.translatedCount}/{job.totalCount})
                </span>
              )}
              {job.status === 'failed' && <span className="text-red-400 text-xs truncate">- Failed</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProgressDisplay;