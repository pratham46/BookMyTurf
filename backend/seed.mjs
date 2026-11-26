// Demo data for testing: 5 turf owners (4 live venues + 1 awaiting approval; two venues have several turfs), 3 customers, bookings in every status.
// Removes the old Turf 1-5 seed. Re-running rebuilds the demo accounts from scratch (real accounts are untouched).
// PB_URL=... SU_EMAIL=... SU_PASS=... DEMO_PASS=... node seed.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(new URL("../BookMyTurf/package.json", import.meta.url));
const PocketBase = require("pocketbase/cjs");

const { PB_URL, SU_EMAIL, SU_PASS, DEMO_PASS } = process.env;
if (!PB_URL || !SU_EMAIL || !SU_PASS || !DEMO_PASS) throw new Error("set PB_URL, SU_EMAIL, SU_PASS, DEMO_PASS");

const assets = new URL("../BookMyTurf/assets/", import.meta.url);
const file = (name) => new File([readFileSync(new URL(name, assets))], name, { type: "image/png" });
const client = () => { const c = new PocketBase(PB_URL); c.autoCancellation(false); return c; };
const DOMAIN = "demo.bookmyturf.app";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); // auth endpoints are rate limited
const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const OWNERS = [
  { key: "rohan", name: "Rohan Desai", phone: "9000000101", location: "Andheri West",
    pitches: [
      { name: "Turf A (5-a-side)", price: 1200, sports: ["Football"], photos: ["turf1.png"] },
      { name: "Box Cricket", price: 1000, sports: ["Cricket"], photos: ["sample_turf.png"] }],
    turf: { name: "Green Field Arena", area: "Andheri West", phone: "9000000101",
      address: "Plot 12, Link Road, Andheri West, Mumbai 400053", mapUrl: "https://maps.google.com/?q=Andheri+West+Mumbai",
      slots: ["9:00am-11:00am", "3:00pm-5:00pm", "5:00pm-7:00pm", "7:00pm-9:00pm", "9:00pm-11:00pm"],
      openDays: ALL_DAYS, upiId: "greenfield@okaxis", cover: "turf1.png", gallery: ["sample_turf.png"], approved: true } },
  { key: "neha", name: "Neha Kulkarni", phone: "9000000102", location: "Powai",
    pitches: [{ name: "Main Turf", price: 900, sports: ["Football", "Basketball"], photos: [] }],
    turf: { name: "Kickoff Sports Hub", area: "Powai", phone: "9000000102",
      address: "Hiranandani Gardens, Powai, Mumbai 400076", mapUrl: "https://maps.google.com/?q=Powai+Mumbai",
      slots: ["12:00pm-2:00pm", "4:00pm-6:00pm", "6:00pm-8:00pm", "9:00pm-11:00pm"],
      openDays: ALL_DAYS, upiId: "kickoffhub@okhdfc", cover: "turf2.png", gallery: [], approved: true } },
  { key: "arjun", name: "Arjun Shetty", phone: "9000000103", location: "Borivali",
    pitches: [{ name: "Box 1", price: 1500, sports: ["Cricket"], photos: [] }],
    turf: { name: "Boundary Box Cricket", area: "Borivali", phone: "9000000103",
      address: "Near National Park Gate, Borivali East, Mumbai 400066", mapUrl: "https://maps.google.com/?q=Borivali+Mumbai",
      slots: ["9:00am-11:00am", "1:00pm-3:00pm", "6:00pm-8:00pm", "9:00pm-11:00pm"],
      openDays: ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], upiId: "boundarybox@okicici", cover: "turf3.png", gallery: [], approved: true } },
  { key: "fatima", name: "Fatima Sheikh", phone: "9000000104", location: "Bandra",
    pitches: [
      { name: "Court 1", price: 1800, sports: ["Football"], photos: ["turf4.png"] },
      { name: "Court 2", price: 1500, sports: ["Tennis", "Volleyball"], photos: ["turf5.png"] },
      { name: "Rooftop", price: 2000, sports: ["Football"], photos: [] }],
    turf: { name: "Urban Turf Co.", area: "Bandra West", phone: "9000000104",
      address: "Carter Road, Bandra West, Mumbai 400050", mapUrl: "https://maps.google.com/?q=Bandra+West+Mumbai",
      slots: ["7:00pm-9:00pm", "9:00pm-11:00pm", "11:00pm-1:00am"],
      openDays: ALL_DAYS, upiId: "urbanturf@oksbi", cover: "turf4.png", gallery: ["turf5.png"], approved: true } },
  // signed up but not approved yet: use it to test the dashboard's Approve button
  { key: "vikram", name: "Vikram Rao", phone: "9000000105", location: "Thane",
    pitches: [{ name: "Turf 1", price: 1000, sports: ["Football"], photos: [] }],
    turf: { name: "Night Owl Turf", area: "Thane West", phone: "9000000105",
      address: "Ghodbunder Road, Thane West 400615", mapUrl: "https://maps.google.com/?q=Thane+West",
      slots: ["7:00pm-9:00pm", "9:00pm-11:00pm", "11:00pm-1:00am"],
      openDays: ALL_DAYS, upiId: "nightowl@okaxis", cover: "turf5.png", gallery: [], approved: false } },
];
const CUSTOMERS = [
  { key: "aisha", name: "Aisha Khan", phone: "9000000201", location: "Andheri" },
  { key: "kabir", name: "Kabir Mehta", phone: "9000000202", location: "Powai" },
  { key: "priya", name: "Priya Nair", phone: "9000000203", location: "Bandra" },
];
// [customer, owner(venue), turf index in venue, dayIndex in bookable days (1 = tomorrow), slot index, sport, final status, upiRef]
const BOOKINGS = [
  ["aisha", "rohan", 0, 1, 3, "Football", "paid", "601200000001"],
  ["kabir", "rohan", 1, 1, 3, "Cricket", "pending", "601200000008"], // same slot as above, the other turf
  ["aisha", "neha", 0, 2, 2, "Basketball", "pending", "601200000002"],
  ["kabir", "rohan", 1, 1, 4, "Cricket", "pending", "601200000003"],
  ["kabir", "arjun", 0, 3, 2, "Cricket", "paid", "601200000004"],
  ["priya", "fatima", 1, 2, 0, "Tennis", "paid", "601200000005"],
  ["priya", "rohan", 0, 4, 1, "Football", "rejected", "601200000006"],
  ["aisha", "fatima", 1, 5, 1, "Volleyball", "pending", "601200000007"],
];

const su = client();
await su.collection("_superusers").authWithPassword(SU_EMAIL, SU_PASS);

// 1. remove the old Turf 1-5 seed and any previous demo run (cascade deletes their turfs/bookings)
for (const col of ["admins", "users"]) {
  const old = await su.collection(col).getFullList({ filter: `email ~ "@${DOMAIN}" || email ~ "@bookmyturf.app"`, fields: "id,email" });
  for (const r of old) {
    if (col === "admins" && r.email.endsWith("@bookmyturf.app") && !/^owner[1-5]@/.test(r.email)) continue; // only the old seed
    await su.collection(col).delete(r.id);
    console.log("removed", col, r.email);
  }
}

// 2. owners (+ their auto-created venue and "Turf 1", filled in here; approval last, once the turfs are complete)
const turfOf = {};
const pitchesOf = {};
for (const o of OWNERS) {
  const email = `${o.key}@${DOMAIN}`;
  const a = await su.collection("admins").create({ email, password: DEMO_PASS, passwordConfirm: DEMO_PASS, name: o.name, phone: o.phone, location: o.location, verified: true });
  const turf = await su.collection("turfs").getFirstListItem(`owner = "${a.id}"`);
  const first = await su.collection("pitches").getFirstListItem(`venue = "${turf.id}"`);
  const { cover, gallery, approved, ...t } = o.turf;
  await su.collection("turfs").update(turf.id, { ...t, cover: file(cover), gallery: gallery.map(file), upiQr: file("qr.png") });
  pitchesOf[o.key] = [];
  for (const [i, { photos, ...p }] of o.pitches.entries()) {
    const body = { ...p, photos: photos.map(file) };
    pitchesOf[o.key].push(i ? await su.collection("pitches").create({ ...body, venue: turf.id }) : await su.collection("pitches").update(first.id, body));
  }
  turfOf[o.key] = await su.collection("turfs").update(turf.id, { approved });
  console.log("owner", email, "->", t.name, `(${o.pitches.length} turfs)`, approved ? "live" : "awaiting approval");
}

// 3. customers
const cust = {};
for (const c of CUSTOMERS) {
  const email = `${c.key}@${DOMAIN}`;
  await su.collection("users").create({ email, password: DEMO_PASS, passwordConfirm: DEMO_PASS, name: c.name, phone: c.phone, location: c.location, verified: true });
  cust[c.key] = client();
  await sleep(3500);
  await cust[c.key].collection("users").authWithPassword(email, DEMO_PASS);
  console.log("customer", email);
}

// 4. bookings go through the real API as the customer (so every server rule applies), then the status is set
for (const [c, o, pIdx, dayIdx, slotIdx, sport, status, upiRef] of BOOKINGS) {
  const turf = turfOf[o];
  const pitch = pitchesOf[o][pIdx];
  const { days } = await cust[c].send(`/api/bmt/days?turf=${turf.id}`, {});
  const b = await cust[c].collection("bookings").create({ pitch: pitch.id, date: days[dayIdx], slot: turf.slots[slotIdx], sport, upiRef });
  if (status !== "pending") await su.collection("bookings").update(b.id, { status });
  console.log("booking", c, "@", turf.name, "/", pitch.name, days[dayIdx], turf.slots[slotIdx], status);
}
console.log("DEMO DATA READY");
