import { cookies } from "next/headers";

const adminPassword = process.env.ADMIN_PASSWORD;
const adminSecret = process.env.ADMIN_AUTH_SECRET;

export const adminCookieName = "admin_auth";

const hashToHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const createAdminToken = async (password: string) => {
  if (!adminSecret) {
    throw new Error("Missing ADMIN_AUTH_SECRET");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}:${adminSecret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return hashToHex(digest);
};

export const verifyAdminToken = async (token?: string | null) => {
  if (!adminPassword || !adminSecret || !token) {
    return false;
  }
  const expected = await createAdminToken(adminPassword);
  return token === expected;
};

export const setAdminCookie = async (token: string) => {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
};

export const clearAdminCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};
