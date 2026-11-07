import {
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

export class RedirectError extends Error {
  public url: string;
  constructor(url: string) {
    super(`REDIRECT:${url}`);
    this.name = "RedirectError";
    this.url = url;
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * Next.js navigation redirect equivalent for Vite React SPA.
 * Throws a RedirectError which is caught by AsyncPage wrappers,
 * or immediately navigates if called in event handlers.
 */
export function redirect(url: string): never {
  if (typeof window !== "undefined") {
    // If during an active client action / event
    try {
      window.history.pushState(null, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch {
      window.location.href = url;
    }
  }
  throw new RedirectError(url);
}

export function notFound(): never {
  throw new NotFoundError();
}

/**
 * Emulates Next.js 15 useRouter() using React Router v6/v7 hooks.
 */
export function useRouter() {
  const navigate = useNavigate();

  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {
      window.dispatchEvent(new CustomEvent("ems:refresh"));
    },
    prefetch: (_href: string) => {},
  };
}

/**
 * Emulates Next.js usePathname() using React Router useLocation().
 */
export function usePathname(): string {
  const location = useLocation();
  return location.pathname;
}

/**
 * Emulates Next.js useSearchParams() returning a standard URLSearchParams object.
 */
export function useSearchParams(): URLSearchParams {
  const [searchParams] = useRouterSearchParams();
  return searchParams;
}

/**
 * Emulates Next.js useParams().
 */
export function useParams<T extends Record<string, string | string[]> = Record<string, string>>(): T {
  return useRouterParams() as unknown as T;
}

export function useSelectedLayoutSegment(): string | null {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? null;
}

export function useSelectedLayoutSegments(): string[] {
  const pathname = usePathname();
  return pathname.split("/").filter(Boolean);
}
