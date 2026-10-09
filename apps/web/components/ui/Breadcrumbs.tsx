import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import React from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`breadcrumbs ${className}`}>
      <Link
        href="/portal"
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: "var(--text-muted)",
        }}
        title="Portal Home"
      >
        <Home size={14} />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1 || item.isCurrent;

        return (
          <React.Fragment key={index}>
            <ChevronRight size={12} className="breadcrumb-separator" />
            {isLast || !item.href ? (
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--text-main)",
                }}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                style={{
                  color: "var(--text-muted)",
                }}
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
