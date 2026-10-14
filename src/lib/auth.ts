function encode(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function safeEqual(a: string, b: string): boolean {
  const left = encode(a);
  const right = encode(b);
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left[i]! ^ right[i]!;
  }
  return diff === 0;
}

export function getDashboardCredentials(): { user: string; password: string } {
  return {
    user: process.env.DASHBOARD_USER || "admin",
    password: process.env.DASHBOARD_PASSWORD || "changeme",
  };
}

export function checkBasicAuth(header: string | null): boolean {
  if (!header?.startsWith("Basic ")) {
    return false;
  }

  try {
    const decoded =
      typeof atob === "function"
        ? atob(header.slice(6))
        : Buffer.from(header.slice(6), "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    if (sep < 0) {
      return false;
    }
    const user = decoded.slice(0, sep);
    const password = decoded.slice(sep + 1);
    const expected = getDashboardCredentials();
    return (
      safeEqual(user, expected.user) && safeEqual(password, expected.password)
    );
  } catch {
    return false;
  }
}

export function unauthorizedResponse(): Response {
  return new Response("Authentification requise", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Dashboard"',
      "Cache-Control": "no-store",
    },
  });
}
