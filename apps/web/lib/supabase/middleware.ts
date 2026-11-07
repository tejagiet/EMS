import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware stub for Vite SPA.
 */
export async function updateSession(_request: NextRequest) {
  return new NextResponse();
}
