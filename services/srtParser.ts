import { SrtEntry } from '../types';

export const parseSrt = (srtContent: string): SrtEntry[] => {
  const entries: SrtEntry[] = [];
  const cleanedContent = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = cleanedContent.split('\n\n');

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) {
      continue;
    }

    const index = parseInt(lines[0], 10);
    const timestamp = lines[1];
    const text = lines.slice(2).join('\n');

    if (!isNaN(index) && timestamp.includes('-->') && text) {
      entries.push({ index, timestamp, text });
    }
  }

  return entries;
};


export const stringifySrt = (entries: SrtEntry[]): string => {
  return entries
    .map(entry => `${entry.index}\n${entry.timestamp}\n${entry.text}`)
    .join('\n\n');
};

const parseSrtTimestamp = (time: string): number => {
  const parts = time.split(/[:,]/);
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const milliseconds = parseInt(parts[3], 10);
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
};

export const calculateSrtDuration = (entries: SrtEntry[]): string => {
  if (entries.length === 0) {
    return '0s';
  }
  
  const lastEntry = entries[entries.length - 1];
  const endTimeString = lastEntry.timestamp.split(' --> ')[1];
  
  if (!endTimeString) {
    return 'N/A';
  }

  const totalMilliseconds = parseSrtTimestamp(endTimeString);
  let totalSeconds = Math.floor(totalMilliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};