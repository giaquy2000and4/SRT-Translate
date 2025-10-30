export interface SrtEntry {
  index: number;
  timestamp: string;
  text: string;
}

export interface TranslatedSrt {
  language: string;
  content: string;
  fileName: string;
}

export interface TranslationJob {
  language: string;
  status: 'pending' | 'translating' | 'completed' | 'failed';
  content?: string;
  fileName?: string;
  error?: string;
  translatedCount?: number;
  totalCount?: number;
}