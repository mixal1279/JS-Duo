const PUSH_API_URL = 'https://js-duo-push-api.michalkowalczyk489.workers.dev';

export interface WebPushPreferences {
  enabled: boolean;
  time: string;
  tone: 'friendly' | 'coder' | 'strict';
  streak: number;
  timezone: string;
}

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getSubscription(create: boolean): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }
  if (Notification.permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (subscription || !create) return subscription;

  const response = await fetch(`${PUSH_API_URL}/vapid-public-key`);
  if (!response.ok) throw new Error(`VAPID key request failed (${response.status})`);
  const data = await response.json() as { publicKey?: string };
  if (!data.publicKey) throw new Error('Push API did not return a VAPID public key');

  subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: decodeBase64Url(data.publicKey) as BufferSource,
  });
  return subscription;
}

export async function registerWebPush(preferences?: Partial<WebPushPreferences>): Promise<boolean> {
  try {
    const subscription = await getSubscription(true);
    if (!subscription) return false;
    const response = await fetch(`${PUSH_API_URL}/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        preferences: {
          enabled: true,
          time: '18:00',
          tone: 'friendly',
          streak: 0,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          ...preferences,
        },
      }),
    });
    if (!response.ok) throw new Error(`Subscription registration failed (${response.status})`);
    return true;
  } catch (error) {
    console.warn('Remote Web Push registration failed:', error);
    return false;
  }
}

export async function syncWebPushPreferences(preferences: WebPushPreferences): Promise<boolean> {
  try {
    const subscription = await getSubscription(true);
    if (!subscription) return false;
    const response = await fetch(`${PUSH_API_URL}/preferences`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint, preferences }),
    });
    return response.ok;
  } catch (error) {
    console.warn('Remote Web Push preferences sync failed:', error);
    return false;
  }
}

export async function syncWebPushActivity(timestamp: number): Promise<void> {
  try {
    const subscription = await getSubscription(false);
    if (!subscription) return;
    await fetch(`${PUSH_API_URL}/activity`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint, lastActivityAt: timestamp }),
      keepalive: true,
    });
  } catch (error) {
    console.info('Remote Web Push activity sync skipped:', error);
  }
}

export async function unregisterWebPush(): Promise<void> {
  try {
    const subscription = await getSubscription(false);
    if (!subscription) return;
    await fetch(`${PUSH_API_URL}/unsubscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
  } catch (error) {
    console.warn('Web Push unsubscribe failed:', error);
  }
}
