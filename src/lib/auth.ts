import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "audax_session";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to your environment (see .env.example).`);
  }
  return value;
}

/** Deterministic session token derived from the shared passcode + a secret. */
export function computeSessionToken(): string {
  const passcode = requireEnv("APP_PASSCODE");
  const secret = process.env.AUTH_SECRET ?? passcode;
  return crypto.createHmac("sha256", secret).update(passcode).digest("hex");
}

export function isCorrectPasscode(candidate: string): boolean {
  const expected = requireEnv("APP_PASSCODE");
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = computeSessionToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
