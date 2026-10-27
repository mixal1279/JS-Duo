import { getLocalDateString } from './storageService';

export type PwaMood = 'happy' | 'worried' | 'sad' | 'panicked' | 'desperate';

/**
 * Selects a mood-specific manifest for browsers that react to a changed manifest link.
 * Installed PWA launcher icons are controlled by the browser/OS and may not update live.
 */
export function updatePwaManifestMood(lastActiveDate: string): PwaMood {
  const today = getLocalDateString();
  let mood: PwaMood = 'happy';
  if (lastActiveDate !== today) {
    const hour = new Date().getHours();
    mood = hour < 13 ? 'worried' : hour < 18 ? 'sad' : hour < 21 ? 'panicked' : 'desperate';
  }

  if (typeof document !== 'undefined') {
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (manifestLink) {
      const nextHref = new URL(`./manifest-${mood}.json`, document.baseURI).href;
      if (manifestLink.href !== nextHref) manifestLink.href = nextHref;
    }
  }
  return mood;
}
