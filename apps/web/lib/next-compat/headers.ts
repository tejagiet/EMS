/**
 * Next.js headers / cookies compatibility for Vite React SPA.
 * Backed by browser localStorage and document.cookie.
 */

class CookieStore {
  get(name: string) {
    if (typeof window === "undefined") return undefined;
    const localVal = localStorage.getItem(name);
    if (localVal !== null) {
      return { name, value: localVal };
    }
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    if (match && match[2]) {
      return { name, value: decodeURIComponent(match[2]) };
    }
    return undefined;
  }

  set(name: string, value: string, _options?: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    localStorage.setItem(name, value);
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  }

  delete(name: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(name);
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  getAll() {
    if (typeof window === "undefined") return [];
    const entries: { name: string; value: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        entries.push({ name: key, value: localStorage.getItem(key) ?? "" });
      }
    }
    return entries;
  }
}

const cookieStoreInstance = new CookieStore();

export async function cookies() {
  return cookieStoreInstance;
}

export async function headers() {
  return new Headers();
}
