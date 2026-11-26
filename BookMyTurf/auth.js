// Client for the self-hosted BookMyTurf backend (PocketBase on free-server-2).
import { useEffect, useState } from "react";
import PocketBase, { AsyncAuthStore } from "pocketbase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://bookmyturf.130-210-85-149.sslip.io"; // override for a local backend
export const COLLECTION = "users";
const KEY = "bmt_auth";

export const pb = new PocketBase(API_URL, new AsyncAuthStore({
  save: (s) => AsyncStorage.setItem(KEY, s),
  clear: () => AsyncStorage.removeItem(KEY),
}));
pb.autoCancellation(false); // screens fire parallel requests; don't cancel each other

// Human-readable message from any PocketBase/network error.
export function errorText(e) {
  if (!e) return "Something went wrong.";
  if (e.status === 0) return "Can't reach the server. Check your internet connection.";
  const fields = Object.entries(e.response?.data || {}).map(([k, v]) => `${k}: ${v.message}`);
  return [e.response?.message || e.message, ...fields].filter(Boolean).join("\n");
}

// Restore the saved session once, then confirm it with the server (refreshes the token).
const ready = (async () => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const { token, record } = JSON.parse(raw);
      pb.authStore.save(token, record);
    }
    if (pb.authStore.isValid) {
      await pb.collection(COLLECTION).authRefresh().catch((e) => {
        if (e.status === 401 || e.status === 403 || e.status === 404) pb.authStore.clear(); // keep session when merely offline
      });
    } else if (pb.authStore.token) {
      pb.authStore.clear();
    }
  } catch {
    pb.authStore.clear();
  }
})();

const current = () => (pb.authStore.isValid ? pb.authStore.record : null);

// { ready, user } - re-renders on login, logout and profile updates.
export function useAuth() {
  const [state, setState] = useState({ ready: false, user: null });
  useEffect(() => {
    let live = true;
    ready.then(() => live && setState({ ready: true, user: current() }));
    const off = pb.authStore.onChange(() => live && setState((s) => ({ ...s, user: current() })));
    return () => { live = false; off(); };
  }, []);
  return state;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function check(email, password) {
  if (!EMAIL_RE.test(email.trim())) throw new Error("Enter a valid email address.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
}

export const auth = {
  get currentUser() { return current(); },
  async signIn(email, password) {
    if (!email.trim() || !password) throw new Error("Enter your email and password.");
    try {
      return (await pb.collection(COLLECTION).authWithPassword(email.trim().toLowerCase(), password)).record;
    } catch (e) {
      throw new Error(e.status === 400 ? "Wrong email or password." : errorText(e));
    }
  },
  async register(email, password, extra = {}) {
    check(email, password);
    const em = email.trim().toLowerCase();
    try {
      await pb.collection(COLLECTION).create({ ...extra, email: em, password, passwordConfirm: password });
    } catch (e) {
      if (e.response?.data?.email) throw new Error("That email is already registered (or invalid).");
      throw new Error(errorText(e));
    }
    return auth.signIn(em, password);
  },
  // Saves profile fields of the signed-in account and refreshes the cached record.
  async updateProfile(fields) {
    const rec = await pb.collection(COLLECTION).update(current().id, fields);
    pb.authStore.save(pb.authStore.token, rec);
    return rec;
  },
  signOut: async () => pb.authStore.clear(),
};

export const fileUrl = (record, name, thumb) =>
  record && name ? pb.files.getURL(record, name, thumb ? { thumb } : undefined) : null;

// Custom endpoints (backend/pb_hooks/main.pb.js).
export const api = {
  days: (turf) => pb.send("/api/bmt/days", { query: { turf } }),
  availability: (pitch, date) => pb.send("/api/bmt/availability", { query: { pitch, date } }),
};

// "2026-11-26" -> "Thu, 26 Nov"
export function prettyDate(ymd) {
  const d = new Date(ymd + "T00:00:00Z");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

// Bookable turfs ("pitches") inside a venue, oldest first.
export const venuePitches = async (venueId) =>
  (await pb.collection("pitches").getFullList({ filter: pb.filter("venue = {:v}", { v: venueId }), sort: "created" }))
    .filter((p) => p.price > 0 && p.sports?.length);
