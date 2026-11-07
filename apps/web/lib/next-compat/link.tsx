import React from "react";
import { Link as RouterLink } from "react-router-dom";

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string | { pathname?: string; query?: Record<string, string | number | boolean> };
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
  children?: React.ReactNode;
}

/**
 * Next.js Link compatibility component mapped to React Router's Link.
 */
export default function Link({
  href,
  replace,
  scroll: _scroll,
  prefetch: _prefetch,
  passHref: _passHref,
  legacyBehavior: _legacyBehavior,
  children,
  ...rest
}: LinkProps) {
  let to = "/";
  if (typeof href === "string") {
    to = href;
  } else if (href && typeof href === "object") {
    const pathname = href.pathname ?? "/";
    if (href.query) {
      const searchParams = new URLSearchParams();
      Object.entries(href.query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          searchParams.set(k, String(v));
        }
      });
      const qs = searchParams.toString();
      to = qs ? `${pathname}?${qs}` : pathname;
    } else {
      to = pathname;
    }
  }

  const linkProps: Record<string, any> = { ...rest, to };
  if (replace !== undefined) {
    linkProps.replace = replace;
  }

  return (
    <RouterLink {...(linkProps as any)}>
      {children}
    </RouterLink>
  );
}
