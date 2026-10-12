export interface RunnerLog {
  type: 'log' | 'info' | 'warn' | 'error';
  text: string;
}

export interface RunnerResult {
  logs: RunnerLog[];
  durationMs: number;
  timedOut: boolean;
}

/**
 * Execute learner code in a disposable Web Worker so it cannot freeze the UI or access the DOM.
 * This is a learning sandbox, not a security boundary for hostile code or a replacement for server-side isolation.
 */
export function runJavaScriptInWorker(code: string, timeoutMs = 3000): Promise<RunnerResult> {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const workerSource = `
      const send = self.postMessage.bind(self);
      const logs = [];
      const stringify = (value) => {
        if (value instanceof Error) return value.name + ': ' + value.message;
        if (typeof value === 'string') return value;
        if (typeof value === 'undefined') return 'undefined';
        if (typeof value === 'function') return value.toString();
        try { return JSON.stringify(value, null, 2) ?? String(value); }
        catch { return String(value); }
      };
      const add = (type, args) => {
        if (logs.length >= 200) return;
        logs.push({ type, text: args.map(stringify).join(' ').slice(0, 4000) });
        send({ kind: 'log', log: logs[logs.length - 1] });
      };
      const sandboxConsole = {
        log: (...args) => add('log', args),
        info: (...args) => add('info', args),
        warn: (...args) => add('warn', args),
        error: (...args) => add('error', args),
        table: (...args) => add('log', ['[Tabela]', ...args]),
        clear: () => { logs.length = 0; send({ kind: 'clear' }); }
      };
      for (const key of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel', 'Worker', 'SharedWorker']) {
        try { Object.defineProperty(self, key, { value: undefined, configurable: false, writable: false }); } catch {}
      }
      try { Object.defineProperty(self, 'postMessage', { value: undefined, configurable: false, writable: false }); } catch {}
      (async () => {
        try {
          const execute = new Function('console', '"use strict"; return (async () => {\\n' + ${JSON.stringify(code)} + '\\n})();');
          await execute(sandboxConsole);
          await new Promise((resolve) => setTimeout(resolve, 150));
          send({ kind: 'done' });
        } catch (error) {
          add('error', [error && error.stack ? error.stack : error]);
          send({ kind: 'done' });
        }
      })();
    `;
    let worker: Worker | null = null;
    let objectUrl: string | null = null;
    let logs: RunnerLog[] = [];
    let settled = false;
    let timeout: number | undefined;
    const finish = (timedOut: boolean) => {
      if (settled) return;
      settled = true;
      if (timeout !== undefined) window.clearTimeout(timeout);
      if (worker) worker.terminate();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve({ logs, durationMs: Math.round((performance.now() - startedAt) * 100) / 100, timedOut });
    };
    try {
      objectUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
      worker = new Worker(objectUrl);
      timeout = window.setTimeout(() => {
        logs = [...logs, { type: 'error', text: 'Przekroczono limit czasu 3 s. Możliwa nieskończona pętla.' }];
        finish(true);
      }, timeoutMs);
      worker.onmessage = (event: MessageEvent) => {
        const message = event.data as { kind?: string; log?: RunnerLog };
        if (message.kind === 'log' && message.log) {
          if (logs.length < 200) logs = [...logs, message.log];
        } else if (message.kind === 'clear') {
          logs = [];
        } else if (message.kind === 'done') {
          finish(false);
        }
      };
      worker.onerror = (event) => {
        logs = [...logs, { type: 'error', text: event.message || 'Nie udało się uruchomić kodu.' }];
        finish(false);
      };
    } catch (error) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve({
        logs: [{ type: 'error', text: error instanceof Error ? error.message : 'Przeglądarka zablokowała sandbox.' }],
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        timedOut: false,
      });
    }
  });
}
