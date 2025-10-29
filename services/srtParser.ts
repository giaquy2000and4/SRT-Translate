
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
