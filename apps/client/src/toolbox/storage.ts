// Toolbox content lives in this browser only. Storage can be unavailable (private mode, quota): never fail on it.

export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled: the content stays in memory until the page reloads.
  }
}

/** Deletes everything the toolbox keeps in this browser. */
export function clearAll(): void {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('stoik-lite.toolbox.')) localStorage.removeItem(key);
    }
  } catch {
    // Storage disabled: there is nothing to delete.
  }
}
