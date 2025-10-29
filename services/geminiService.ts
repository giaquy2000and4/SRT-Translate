
import { GoogleGenAI } from '@google/genai';
import { SrtEntry } from '../types';

const BATCH_SEPARATOR = '|||---|||';

export const translateSrtContent = async (
  ai: GoogleGenAI,
  entries: SrtEntry[],
  targetLanguage: string
): Promise<string[]> => {
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
      console.warn(`Mismatch in translated blocks. Expected ${entries.length}, got ${translatedBlocks.length}. Falling back to line-by-line translation.`);
      // Fallback might be too slow, so we throw an error to inform the user.
      throw new Error(`Translation output was malformed. The AI did not return the correct number of subtitle blocks. Expected ${entries.length}, but received ${translatedBlocks.length}.`);
    }

    return translatedBlocks;
  } catch (error) {
    console.error('Error during Gemini API call:', error);
    throw new Error('Failed to get a valid response from the AI model.');
  }
};
