/**
 * Next.js cache compatibility for Vite React SPA.
 * In a client SPA, cache invalidation can emit events for active components.
 */

export function revalidatePath(path: string, _type?: "layout" | "page") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ems:refresh", { detail: { path } }));
  }
}

export function revalidateTag(tag: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ems:refresh", { detail: { tag } }));
  }
}

export function unstable_cache<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

export const cache = <T extends (...args: any[]) => any>(fn: T): T => fn;
