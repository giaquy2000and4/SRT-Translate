import React from 'react';
import { ClockIcon } from './icons/ClockIcon';
import { ListIcon } from './icons/ListIcon';
import { GlobeIcon } from './icons/GlobeIcon';

interface FileInfo {
  count: number;
  duration: string;
  language: string;
}

interface FileInfoDisplayProps {
  info: FileInfo;
  isLoading: boolean;
}

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number; isLoading?: boolean }> = ({ icon, label, value, isLoading = false }) => (
  <div className="flex items-center gap-3 text-sm">
    <div className="flex-shrink-0 text-gray-400">{icon}</div>
    <div>
      <p className="font-semibold text-gray-300">{label}</p>
      {isLoading ? (
        <div className="w-20 h-4 bg-gray-600 rounded animate-pulse mt-1"></div>
      ) : (
        <p className="text-indigo-400">{value}</p>
      )}
    </div>
  </div>
);


const FileInfoDisplay: React.FC<FileInfoDisplayProps> = ({ info, isLoading }) => {
  return (
    <div className="bg-gray-800 border border-gray-700 p-4 rounded-lg space-y-3">
      <InfoItem icon={<ListIcon />} label="Subtitles" value={info.count} />
      <InfoItem icon={<ClockIcon />} label="Total Duration" value={info.duration} />
      <InfoItem icon={<GlobeIcon />} label="Original Language" value={info.language} isLoading={isLoading} />
    </div>
  );
};

export default FileInfoDisplay;