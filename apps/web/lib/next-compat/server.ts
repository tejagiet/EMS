/**
 * Next.js server compatibility module for Vite React.
 */

export class NextResponse {
  static redirect(url: string | URL, status: number = 307): Response {
    if (typeof window !== "undefined") {
      window.location.href = url.toString();
    }
    return new Response(null, {
      status,
      headers: { Location: url.toString() },
    });
  }

  static json(body: any, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  }
}

export type NextRequest = Request;
