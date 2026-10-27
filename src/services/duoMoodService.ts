export type DuoMood = 'happy' | 'worried' | 'sad' | 'panicked' | 'desperate';

export function getDuoMood(date: Date = new Date(), lastActiveDate = ''): DuoMood {
  const today = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  if (lastActiveDate === today) return 'happy';
  const hour = date.getHours();
  if (hour < 13) return 'worried';
  if (hour < 18) return 'sad';
  if (hour < 21) return 'panicked';
  return 'desperate';
}

export function applyDuoFavicon(mood: DuoMood): void {
  if (typeof document === 'undefined') return;
  const colors: Record<DuoMood, { bg: string; face: string; mouth: string }> = {
    happy: { bg: '#58cc02', face: '#a4e875', mouth: '#176b21' },
    worried: { bg: '#365d68', face: '#c4d9bd', mouth: '#29434e' },
    sad: { bg: '#365d68', face: '#b8d0bd', mouth: '#29434e' },
    panicked: { bg: '#7a454e', face: '#cbd9bd', mouth: '#4b1d2a' },
    desperate: { bg: '#5a2638', face: '#d0d8c1', mouth: '#4b1d2a' },
  };
  const c = colors[mood];
  const eyes = mood === 'happy'
    ? '<path d="M165 213q18-24 36 0M279 213q18-24 36 0" fill="none" stroke="#29434e" stroke-width="13" stroke-linecap="round"/>'
    : '<ellipse cx="190" cy="214" rx="18" ry="23" fill="#29434e"/><ellipse cx="290" cy="214" rx="18" ry="23" fill="#29434e"/>';
  const mouth = mood === 'happy'
    ? '<path d="M213 278q27 28 54 0" fill="none" stroke="' + c.mouth + '" stroke-width="12" stroke-linecap="round"/>'
    : mood === 'desperate'
      ? '<ellipse cx="240" cy="280" rx="21" ry="27" fill="' + c.mouth + '"/>'
      : '<path d="M215 285q25-22 50 0" fill="none" stroke="' + c.mouth + '" stroke-width="12" stroke-linecap="round"/>';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480"><rect width="480" height="480" rx="104" fill="' + c.bg + '"/><path d="M96 184 126 72 204 130 276 130 354 72 384 184" fill="' + c.face + '" stroke="#29434e" stroke-width="14"/><ellipse cx="240" cy="244" rx="151" ry="151" fill="' + c.face + '" stroke="#29434e" stroke-width="14"/>' + eyes + '<path d="M218 239 240 264 262 239Z" fill="#ffb020" stroke="#29434e" stroke-width="7"/>' + mouth + '</svg>';
  let link = document.querySelector<HTMLLinkElement>('link[data-js-duo-dynamic-icon]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.dataset.jsDuoDynamicIcon = 'true';
    document.head.appendChild(link);
  }
  link.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
