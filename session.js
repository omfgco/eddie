/**
 * Signed session cookie helpers.
 *
 * Uses Web Crypto (crypto.subtle), which is available in both the Edge runtime
 * used by middleware and the Node runtime used by route handlers — so the same
 * code signs and verifies on both sides.
 *
 * The cookie holds no secret: it's an expiry timestamp plus an HMAC of that
 * timestamp. Without EDDIE_SECRET you can't forge one, and it expires on its own.
 */

export const COOKIE_NAME = 'eddie_session';
export const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

/**
 * Falls back to EDDIE_PASSWORD so there's no third env var to configure.
 * Side effect worth knowing: changing the password invalidates live sessions.
 */
function getSecret() {
  return process.env.EDDIE_SECRET || process.env.EDDIE_PASSWORD || '';
}

async function hmacHex(message) {
  const secret = getSecret();
  if (!secret) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Length-independent comparison, so timing doesn't leak how much matched. */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function createSessionValue() {
  const exp = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const sig = await hmacHex(exp);
  if (!sig) return null;
  return `${exp}.${sig}`;
}

export async function verifySessionValue(value) {
  if (!value || typeof value !== 'string') return false;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return false;

  const exp = value.slice(0, dot);
  const sig = value.slice(dot + 1);

  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum <= Date.now()) return false;

  const expected = await hmacHex(exp);
  if (!expected) return false;
  return safeEqual(sig, expected);
}
