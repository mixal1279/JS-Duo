import packageJson from '../../package.json';

const REPOSITORY = 'mixal1279/JS-Duo';
const LATEST_RELEASE_URL = `https://api.github.com/repos/${REPOSITORY}/releases/latest`;
const CHECK_CACHE_KEY = 'js_duo_update_check_v1';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface AppUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  apkUrl: string | null;
  releaseNotes: string;
  publishedAt: string | null;
}

interface CachedUpdateCheck {
  checkedAt: number;
  update: AppUpdateInfo | null;
}

export const CURRENT_APP_VERSION = packageJson.version;

function normalizeVersion(version: string): number[] {
  const clean = version.trim().replace(/^v/i, '').split('-')[0];
  return clean.split('.').map((part) => {
    const value = Number.parseInt(part, 10);
    return Number.isFinite(value) ? value : 0;
  });
}

function isNewerVersion(current: string, latest: string): boolean {
  const a = normalizeVersion(current);
  const b = normalizeVersion(latest);
  const length = Math.max(a.length, b.length);

  for (let i = 0; i < length; i += 1) {
    const currentPart = a[i] ?? 0;
    const latestPart = b[i] ?? 0;
    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false;
}

function getCachedCheck(): CachedUpdateCheck | null {
  try {
    const raw = localStorage.getItem(CHECK_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedUpdateCheck;
    if (!parsed || typeof parsed.checkedAt !== 'number') return null;

    return parsed;
  } catch {
    return null;
  }
}

function saveCachedCheck(update: AppUpdateInfo | null) {
  try {
    localStorage.setItem(
      CHECK_CACHE_KEY,
      JSON.stringify({
        checkedAt: Date.now(),
        update,
      } satisfies CachedUpdateCheck)
    );
  } catch {
    // LocalStorage can be unavailable in restricted web views.
  }
}

export async function checkForUpdates(options: { force?: boolean } = {}): Promise<AppUpdateInfo | null> {
  const cached = getCachedCheck();

  if (!options.force && cached && Date.now() - cached.checkedAt < CHECK_INTERVAL_MS) {
    return cached.update;
  }

  try {
    const response = await fetch(LATEST_RELEASE_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const release = await response.json() as {
      tag_name?: string;
      html_url?: string;
      body?: string | null;
      published_at?: string | null;
      prerelease?: boolean;
      draft?: boolean;
      assets?: Array<{
        name?: string;
        browser_download_url?: string;
      }>;
    };

    if (release.draft || release.prerelease || !release.tag_name || !release.html_url) {
      saveCachedCheck(null);
      return null;
    }

    const latestVersion = release.tag_name.replace(/^v/i, '');
    const update: AppUpdateInfo = {
      currentVersion: CURRENT_APP_VERSION,
      latestVersion,
      releaseUrl: release.html_url,
      apkUrl:
        release.assets?.find(
          (asset) =>
            asset.name?.toLowerCase().endsWith('.apk') &&
            typeof asset.browser_download_url === 'string'
        )?.browser_download_url ?? null,
      releaseNotes: release.body?.trim() ?? '',
      publishedAt: release.published_at ?? null,
    };

    const result = isNewerVersion(CURRENT_APP_VERSION, latestVersion) ? update : null;
    saveCachedCheck(result);
    return result;
  } catch (error) {
    console.warn('[JS Duo] Nie udało się sprawdzić aktualizacji:', error);
    return null;
  }
}

export function clearUpdateCheckCache() {
  try {
    localStorage.removeItem(CHECK_CACHE_KEY);
  } catch {
    // Ignore storage errors.
  }
}
