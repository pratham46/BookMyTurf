// Client for the self-hosted BookMyTurf backend (PocketBase on free-server-2).
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import PocketBase, { AsyncAuthStore } from "pocketbase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File as ExpoFile } from "expo-file-system";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://bookmyturf.130-210-85-149.sslip.io"; // override for a local backend
export const COLLECTION = "admins";
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

// Picked image (expo-image-picker asset) -> an upload part. Expo SDK 58 replaces fetch, and its FormData
// only takes real Blobs: a browser File on web, an expo-file-system File (a Blob backed by the file) on native.
export async function toUpload(asset) {
  if (Platform.OS === "web") {
    const blob = await (await fetch(asset.uri)).blob();
    return new globalThis.File([blob], asset.fileName || `photo-${Date.now()}.jpg`, { type: blob.type || asset.mimeType || "image/jpeg" });
  }
  return new ExpoFile(asset.uri);
}

// The signed-in owner's turf (created by the server when the owner signed up).
export const myTurf = () => pb.collection("turfs").getFirstListItem(pb.filter("owner = {:id}", { id: pb.authStore.record.id }));

// Choices offered by the backend schema (backend/pb_migrations/1700000100_schema.js).
export const SLOTS = [
  "9:00am-11:00am", "12:00pm-2:00pm", "1:00pm-3:00pm", "2:00pm-4:00pm", "3:00pm-5:00pm",
  "4:00pm-6:00pm", "5:00pm-7:00pm", "6:00pm-8:00pm", "7:00pm-9:00pm", "9:00pm-11:00pm", "11:00pm-1:00am",
];
export const SPORTS = ["Football", "Cricket", "Basketball", "Tennis", "Volleyball"];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// "YYYY-MM-DD" in India time, +/- n days.
export function todayIST(n = 0) {
  return new Date(Date.now() + 5.5 * 3600 * 1000 + n * 86400 * 1000).toISOString().slice(0, 10);
}
export function shiftDate(ymd, n) {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Turfs ("pitches") inside a venue, oldest first. A pitch is ready when it has a price and a sport.
export const myPitches = (venueId) => pb.collection("pitches").getFullList({ filter: pb.filter("venue = {:v}", { v: venueId }), sort: "created" });
export const pitchReady = (p) => p.price > 0 && p.sports?.length > 0;
