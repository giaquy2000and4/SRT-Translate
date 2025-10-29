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
