/**
 * Owner session tokens. Works in both the Node runtime and the proxy (Web Crypto only).
 * Token = "<expiresAtMs>.<base64url HMAC-SHA256>". The HMAC key comes from SESSION_SECRET if set,
 * otherwise it is derived from COMMAND_CENTER_PASSWORD, so changing the password signs everyone out.
 */
export const SESSION_COOKIE = "__Host-bdn_cc_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

const enc = new TextEncoder();

function secretMaterial(): string | null {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit) return explicit;
  const pw = process.env.COMMAND_CENTER_PASSWORD;
  return pw ? `bdn-command-center-session-v1:${pw}` : null;
}

function b64url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(message: string): Promise<string | null> {
  const secret = secretMaterial();
  if (!secret) return null;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** Constant-time comparison for equal-length strings (length itself is not secret here: both are fixed-size digests). */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(now = Date.now()): Promise<string | null> {
  const exp = now + SESSION_MAX_AGE_SECONDS * 1000;
  const sig = await hmac(`v1.${exp}`);
  return sig ? `${exp}.${sig}` : null;
}

export async function verifySessionToken(token: string | undefined | null, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [expStr, sig, extra] = token.split(".");
  if (!expStr || !sig || extra !== undefined || !/^\d{10,16}$/.test(expStr)) return false;
  if (Number(expStr) <= now) return false;
  const expected = await hmac(`v1.${expStr}`);
  return !!expected && safeEqual(sig, expected);
}

/** Hash both sides to fixed-length digests, then compare in constant time. */
export async function passwordMatches(candidate: string): Promise<boolean> {
  const real = process.env.COMMAND_CENTER_PASSWORD;
  if (!real || !candidate) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(candidate)),
    crypto.subtle.digest("SHA-256", enc.encode(real)),
  ]);
  return safeEqual(b64url(a), b64url(b));
}

export function passwordConfigured() {
  return !!process.env.COMMAND_CENTER_PASSWORD;
}

export async function hashForLog(value: string): Promise<string> {
  const sig = await hmac(`ip.${value}`);
  return sig ?? "unconfigured";
}
