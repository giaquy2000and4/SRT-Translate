import { GoogleGenAI } from '@google/genai';
import { SrtEntry } from '../types';

const BATCH_SEPARATOR = '|||---|||';
const CHUNK_SIZE = 50; // Process 50 subtitles per API call for optimal performance and reliability

/**
 * Translates a single chunk of SRT entries.
 * @param ai The GoogleGenAI instance.
 * @param entries The array of SrtEntry to translate.
 * @param targetLanguage The language to translate to.
 * @returns A promise that resolves to an array of translated text strings.
 */
const translateChunk = async (
  ai: GoogleGenAI,
  entries: SrtEntry[],
  targetLanguage: string
): Promise<string[]> => {
  if (entries.length === 0) {
    return [];
  }

  const textToTranslate = entries.map(entry => entry.text).join(BATCH_SEPARATOR);

  const prompt = `You are an expert subtitle translator.
Your task is to translate the following text blocks into ${targetLanguage}.
The text blocks are separated by a special delimiter: "${BATCH_SEPARATOR}".
You MUST preserve this delimiter in your translated output.
Do not add any introductory phrases, explanations, or any text other than the translated blocks and their delimiters.
The number of translated blocks separated by the delimiter must be exactly the same as the number of original blocks.
Keep the original line breaks within each text block.

Here are the text blocks to translate:
---
${textToTranslate}
---
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const translatedText = response.text;
    const translatedBlocks = translatedText.split(BATCH_SEPARATOR).map(block => block.trim());

    if (translatedBlocks.length !== entries.length) {
      console.warn(`Mismatch in translated blocks. Expected ${entries.length}, got ${translatedBlocks.length}.`);
      throw new Error(`Translation output was malformed. The AI did not return the correct number of subtitle blocks. Expected ${entries.length}, but received ${translatedBlocks.length}.`);
    }

    return translatedBlocks;
  } catch (error) {
    console.error('Error during Gemini API call for a chunk:', error);
    throw new Error('Failed to get a valid response from the AI model for a subtitle chunk.');
  }
};

/**
 * Translates the content of an SRT file by splitting it into chunks and processing them in parallel.
 * @param ai The GoogleGenAI instance.
 * @param entries The array of all SrtEntry objects from the file.
 * @param targetLanguage The language to translate to.
 * @param onProgress A callback function to report progress.
 * @returns A promise that resolves to an array of all translated text strings.
 */
export const translateSrtContent = async (
  ai: GoogleGenAI,
  entries: SrtEntry[],
  targetLanguage: string,
  onProgress: (chunkSize: number) => void
): Promise<string[]> => {
  // Create chunks of subtitles to be processed in parallel.
  const chunks: SrtEntry[][] = [];
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    chunks.push(entries.slice(i, i + CHUNK_SIZE));
  }

  try {
    // Fire off all translation requests concurrently and report progress as each one finishes.
    const translationPromises = chunks.map(chunk =>
      translateChunk(ai, chunk, targetLanguage).then(translatedChunk => {
        onProgress(chunk.length);
        return translatedChunk;
      })
    );
    const translatedChunks = await Promise.all(translationPromises);

    // Flatten the array of arrays into a single array of translated strings.
    return translatedChunks.flat();
  } catch (error) {
    console.error('Error during batched Gemini API calls:', error);
    // Propagate a more specific error if it's a known malformed response issue.
    if (error instanceof Error && error.message.includes('malformed')) {
        throw error;
    }
    throw new Error('Failed to get a valid response from the AI model during batch processing.');
  }
};