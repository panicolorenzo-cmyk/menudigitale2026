import type { LanguageCode, TranslatedText } from '../types';
import { LANGUAGES } from '../types';

const TARGET_LANGS: Exclude<LanguageCode, 'it'>[] = ['en', 'fr', 'de', 'es', 'ru'];

async function translateOne(text: string, targetLang: string): Promise<string> {
  if (!text.trim()) return text;
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=it|${targetLang}`
    );
    if (!res.ok) return text;
    const data = await res.json() as { responseStatus: number; responseData: { translatedText: string } };
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return text;
  } catch {
    return text;
  }
}

export async function translateFromItalian(italianText: string): Promise<TranslatedText> {
  const base = LANGUAGES.reduce((acc, lang) => {
    acc[lang.code] = lang.code === 'it' ? italianText : italianText;
    return acc;
  }, {} as TranslatedText);

  if (!italianText.trim()) return base;

  const results = await Promise.allSettled(
    TARGET_LANGS.map(async (lang) => ({
      lang,
      text: await translateOne(italianText, lang)
    }))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      base[result.value.lang] = result.value.text || italianText;
    }
  }

  return base;
}
