import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: "/dashboard/:path*",
};

function decodeBasic(encoded: string): string {
  try {
    if (typeof atob === "function") {
      return atob(encoded);
    }
  } catch {
    // fall through
  }
  return Buffer.from(encoded, "base64").toString("utf-8");
}

export function middleware(req: NextRequest) {
  const user = process.env.DASHBOARD_USER || "admin";
  const pass = process.env.DASHBOARD_PASSWORD || "changeme";

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = decodeBasic(encoded);
      const sep = decoded.indexOf(":");
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (u === user && p === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentification requise", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Dashboard"' },
  });
}
