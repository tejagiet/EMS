import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { RedirectError } from "@/lib/next-compat/navigation";

interface AsyncPageProps {
  loader: () => Promise<{ default: any }>;
}

export function AsyncPage({ loader }: AsyncPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeParams = useParams();

  const [Component, setComponent] = useState<any>(null);
  const [asyncElement, setAsyncElement] = useState<React.ReactNode>(null);
  const [isAsync, setIsAsync] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedOnceRef = useRef(false);

  // Parse search params into a key-value record
  const searchObj = useMemo(() => {
    const obj: Record<string, string> = {};
    const sp = new URLSearchParams(location.search);
    sp.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }, [location.search]);

  // Construct Next.js 15 compatible page props (promises)
  const pageProps = useMemo(() => {
    return {
      params: Promise.resolve(routeParams),
      searchParams: Promise.resolve(searchObj),
    };
  }, [routeParams, searchObj]);

  useEffect(() => {
    let isMounted = true;
    let refreshDebounceTimer: any = null;

    if (!hasLoadedOnceRef.current) {
      setLoading(true);
      setError(null);
    }

    const loadAndExecute = async (isBackground = false) => {
      try {
        if (isBackground) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        const mod = await loader();
        const Comp = mod.default || mod;

        // Check if Comp is an async function
        const isAsyncFn =
          Comp &&
          (Comp.constructor?.name === "AsyncFunction" ||
            Comp[Symbol.toStringTag] === "AsyncFunction");

        if (isAsyncFn) {
          setIsAsync(true);
          const result = await Comp(pageProps);
          if (isMounted) {
            setAsyncElement(result);
            hasLoadedOnceRef.current = true;
            setLoading(false);
            setIsRefreshing(false);
          }
        } else {
          setIsAsync(false);
          if (isMounted) {
            setComponent(() => Comp);
            hasLoadedOnceRef.current = true;
            setLoading(false);
            setIsRefreshing(false);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;

        // Catch Next.js redirect calls
        if (
          err instanceof RedirectError ||
          err?.name === "RedirectError" ||
          (typeof err?.message === "string" && err.message.startsWith("REDIRECT:"))
        ) {
          const targetUrl = err.url || err.message.replace("REDIRECT:", "");
          navigate(targetUrl, { replace: true });
          return;
        }

        if (err?.name === "NotFoundError" || err?.message === "NEXT_NOT_FOUND") {
          navigate("/404", { replace: true });
          return;
        }

        console.error("[AsyncPage] Error rendering route:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    loadAndExecute(false);

    // Realtime background update listener
    const handleRealtimeRefresh = () => {
      if (!isMounted || !hasLoadedOnceRef.current) return;
      clearTimeout(refreshDebounceTimer);
      refreshDebounceTimer = setTimeout(() => {
        if (isMounted) {
          loadAndExecute(true);
        }
      }, 100);
    };

    window.addEventListener("ems:refresh", handleRealtimeRefresh);
    window.addEventListener("ems:realtime_update", handleRealtimeRefresh);

    return () => {
      isMounted = false;
      clearTimeout(refreshDebounceTimer);
      window.removeEventListener("ems:refresh", handleRealtimeRefresh);
      window.removeEventListener("ems:realtime_update", handleRealtimeRefresh);
    };
  }, [loader, pageProps, navigate, location.pathname, location.search]);

  if (loading) {
    return (
      <div
        style={{
          padding: "32px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            height: 36,
            width: "35%",
            backgroundColor: "var(--card-border, #e2e8f0)",
            borderRadius: 6,
            animation: "pulse 1.5s infinite",
          }}
        />
        <div
          style={{
            height: 18,
            width: "55%",
            backgroundColor: "var(--card-border, #e2e8f0)",
            borderRadius: 4,
            animation: "pulse 1.5s infinite",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 110,
                backgroundColor: "var(--card-border, #e2e8f0)",
                borderRadius: 8,
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: "24px auto" }}>
        <div className="alert alert-error" role="alert">
          <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}>Unable to load page</h3>
          <p style={{ margin: 0 }}>{error.message || "An unexpected error occurred."}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <>
      {isRefreshing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 99999,
            backgroundColor: "rgba(30, 58, 138, 0.2)",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              backgroundColor: "var(--primary, #1e3a8a)",
              animation: "indeterminate-bar 1.2s infinite ease-in-out",
            }}
          />
        </div>
      )}
      {isAsync ? asyncElement : Component ? <Component {...pageProps} /> : null}
    </>
  );
}
