// End-to-end check of the BookMyTurf API rules. Creates throwaway accounts and deletes them.
// PB_URL=... SU_EMAIL=... SU_PASS=... node test-api.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(new URL("../BookMyTurf/package.json", import.meta.url));
const PocketBase = require("pocketbase/cjs");
const { PB_URL, SU_EMAIL, SU_PASS } = process.env;

const client = () => { const c = new PocketBase(PB_URL); c.autoCancellation(false); return c; };
const su = client();
await su.collection("_superusers").authWithPassword(SU_EMAIL, SU_PASS);

const tag = Date.now();
const PASS = "TestPass12345";
const cleanup = [];
const fails = async (p, re) => {
  const err = await p.then(() => null, (e) => e);
  assert.ok(err, `expected failure matching ${re}`);
  const msg = [err.message, ...Object.values(err.response?.data || {}).map((d) => d.message)].join(" ");
  if (re) assert.match(msg, re);
};

try {
  // --- auth: customer sign-up/login, owner sign-up auto-creates hidden turf
  const cust = client();
  const cEmail = `t-cust-${tag}@test.local`;
  const c = await cust.collection("users").create({ email: cEmail, password: PASS, passwordConfirm: PASS, name: "Test Cust", phone: "9999999999" });
  cleanup.push(["users", c.id]);
  await cust.collection("users").authWithPassword(cEmail, PASS);
  await fails(client().collection("admins").authWithPassword(cEmail, PASS), /authenticate/i); // customer can't use admin app

  const own = client();
  const oEmail = `t-own-${tag}@test.local`;
  const o = await own.collection("admins").create({ email: oEmail, password: PASS, passwordConfirm: PASS, name: "Test Owner" });
  cleanup.push(["admins", o.id]);
  await own.collection("admins").authWithPassword(oEmail, PASS);
  const myTurf = await own.collection("turfs").getFirstListItem(`owner = "${o.id}"`);
  assert.equal(myTurf.approved, false);
  assert.equal((await cust.collection("turfs").getFullList({ filter: `id = "${myTurf.id}"` })).length, 0, "unapproved turf hidden from customers");

  assert.equal(myTurf.name, "Test Owner's Turf");
  const pitch = await own.collection("pitches").getFirstListItem(`venue = "${myTurf.id}"`);
  assert.equal(pitch.name, "Turf 1", "signup creates one empty turf in the venue");
  assert.equal((await cust.collection("pitches").getFullList({ filter: `venue = "${myTurf.id}"` })).length, 0, "pitches of hidden venue hidden");
  // an incomplete turf can't go live, even by the superuser
  await fails(su.collection("turfs").update(myTurf.id, { approved: true }), /missing price, slots, sports/);

  // owner edits own turf, cannot self-approve or edit someone else's
  // venue price/sports can't be set directly: they summarise the pitches
  let v = await own.collection("turfs").update(myTurf.id, { name: "Test Turf", price: 1, sports: ["Tennis"], slots: ["9:00am-11:00am", "12:00pm-2:00pm"], openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], upiId: "t@upi" });
  assert.equal(v.price, 0);
  assert.deepEqual(v.sports, []);
  await own.collection("pitches").update(pitch.id, { price: 500, sports: ["Football"] });
  const pitch2 = await own.collection("pitches").create({ venue: myTurf.id, name: "Turf 2", price: 700, sports: ["Cricket", "Football"] });
  v = await own.collection("turfs").getOne(myTurf.id);
  assert.equal(v.price, 500, "venue price = cheapest turf");
  assert.deepEqual([...v.sports].sort(), ["Cricket", "Football"]);
  await fails(own.collection("pitches").create({ venue: myTurf.id, name: "Turf 2" }), /unique|name/i);
  await fails(own.collection("pitches").update(pitch.id, { venue: "x" }));
  await fails(own.collection("turfs").update(myTurf.id, { approved: true }));
  const other = (await su.collection("turfs").getFullList({ filter: `owner != "${o.id}"` }))[0];
  if (other) {
    await fails(own.collection("turfs").update(other.id, { name: "hijack" }));
    await fails(own.collection("pitches").create({ venue: other.id, name: "hijack" }));
  }
  await fails(cust.collection("pitches").create({ venue: myTurf.id, name: "hijack" }));
  await fails(cust.collection("turfs").update(myTurf.id, { name: "hijack" }));

  // not approved -> no bookings
  const days0 = await cust.send(`/api/bmt/days?turf=${myTurf.id}`, {}).catch((e) => e);
  assert.equal(days0.status, 404, "unapproved turf invisible via API");
  await su.collection("turfs").update(myTurf.id, { approved: true });
  assert.equal((await cust.collection("pitches").getFullList({ filter: `venue = "${myTurf.id}"` })).length, 2, "customers see live venue's turfs");
  await fails(own.collection("pitches").create({ venue: myTurf.id, name: "Empty" }), /needs a price/);

  // --- availability + booking
  const { days } = await cust.send(`/api/bmt/days?turf=${myTurf.id}`, {});
  assert.ok(days.length >= 14);
  const date = days[1];

  // today's already-started slots are reported (and computed in IST)
  const ist = new Date(Date.now() + 5.5 * 3600e3);
  const nowMin = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const startMin = (s) => { const m = /^(\d{1,2}):(\d{2})(am|pm)/.exec(s); return ((+m[1] % 12) + (m[3] === "pm" ? 12 : 0)) * 60 + +m[2]; };
  const todayAv = await cust.send(`/api/bmt/availability?pitch=${pitch.id}&date=${days[0]}`, {});
  assert.deepEqual(todayAv.started, ["9:00am-11:00am", "12:00pm-2:00pm"].filter((s) => startMin(s) <= nowMin));
  assert.deepEqual((await cust.send(`/api/bmt/availability?pitch=${pitch.id}&date=${date}`, {})).started, []);
  if (todayAv.started.length)
    await fails(cust.collection("bookings").create({ pitch: pitch.id, date: days[0], slot: todayAv.started[0], sport: "Football", upiRef: "123456789012" }), /already started/);
  let av = await cust.send(`/api/bmt/availability?pitch=${pitch.id}&date=${date}`, {});
  assert.deepEqual(av.taken, []);
  assert.equal(av.open, true);

  const b = await cust.collection("bookings").create({ pitch: pitch.id, date, slot: "9:00am-11:00am", sport: "Football", upiRef: "123456789012", amount: 1, status: "paid", user: o.id });
  assert.equal(b.status, "pending", "status forced to pending");
  assert.equal(b.amount, 500, "amount from turf price");
  assert.equal(b.user, c.id, "user forced to caller");
  assert.equal(b.customerName, "Test Cust");

  assert.equal(b.turf, myTurf.id, "venue from the turf");
  av = await cust.send(`/api/bmt/availability?pitch=${pitch.id}&date=${date}`, {});
  assert.deepEqual(av.taken, ["9:00am-11:00am"]);
  // same slot on the other turf of the venue is still free and bookable, at that turf's price
  assert.deepEqual((await cust.send(`/api/bmt/availability?pitch=${pitch2.id}&date=${date}`, {})).taken, []);
  const bOther = await cust.collection("bookings").create({ pitch: pitch2.id, date, slot: "9:00am-11:00am", sport: "Cricket", upiRef: "123456789013" });
  assert.equal(bOther.amount, 700);
  await fails(cust.collection("bookings").create({ date, slot: "12:00pm-2:00pm", sport: "Football", upiRef: "123456789012", turf: myTurf.id }), /Pick which turf/);
  await fails(own.collection("pitches").delete(pitch2.id), /upcoming bookings/);
  await own.collection("bookings").update(bOther.id, { status: "rejected" });
  await own.collection("pitches").delete(pitch2.id);
  assert.equal((await own.collection("turfs").getOne(myTurf.id)).price, 500);
  await fails(own.collection("pitches").delete(pitch.id), /upcoming bookings/);

  // validation
  await fails(cust.collection("bookings").create({ pitch: pitch.id, date, slot: "9:00am-11:00am", sport: "Football", upiRef: "123456789012" }), /just booked/);
  await fails(cust.collection("bookings").create({ pitch: pitch.id, date, slot: "6:00pm-8:00pm", sport: "Football", upiRef: "123456789012" }), /isn't offered/);
  await fails(cust.collection("bookings").create({ pitch: pitch.id, date, slot: "12:00pm-2:00pm", sport: "Cricket", upiRef: "123456789012" }), /sport/);
  await fails(cust.collection("bookings").create({ pitch: pitch.id, date, slot: "12:00pm-2:00pm", sport: "Football", upiRef: "12345" }), /12 digits/);
  await fails(cust.collection("bookings").create({ pitch: pitch.id, date: "2020-01-01", slot: "12:00pm-2:00pm", sport: "Football", upiRef: "123456789012" }), /past/);
  await fails(own.collection("bookings").create({ pitch: pitch.id, date, slot: "12:00pm-2:00pm", sport: "Football", upiRef: "123456789012" }));

  // closed day
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(date + "T00:00:00Z").getUTCDay()];
  await own.collection("turfs").update(myTurf.id, { openDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].filter((d) => d !== dow) });
  await fails(cust.collection("bookings").create({ pitch: pitch.id, date, slot: "12:00pm-2:00pm", sport: "Football", upiRef: "123456789012" }), /closed/);
  assert.ok(!(await cust.send(`/api/bmt/days?turf=${myTurf.id}`, {})).days.includes(date));
  await own.collection("turfs").update(myTurf.id, { openDays: [] }); // empty = open every day

  // --- visibility: owner sees own turf's bookings; other customers don't
  assert.equal((await own.collection("bookings").getFullList()).length, 2);
  assert.equal((await cust.collection("bookings").getFullList()).length, 2);
  const cust2 = client();
  const c2Email = `t-cust2-${tag}@test.local`;
  const c2 = await cust2.collection("users").create({ email: c2Email, password: PASS, passwordConfirm: PASS });
  cleanup.push(["users", c2.id]);
  await cust2.collection("users").authWithPassword(c2Email, PASS);
  assert.equal((await cust2.collection("bookings").getFullList()).length, 0);
  await fails(cust2.collection("bookings").getOne(b.id));

  // --- owner workflow: status only
  await fails(cust.collection("bookings").update(b.id, { status: "paid" }));
  await fails(own.collection("bookings").update(b.id, { slot: "12:00pm-2:00pm" }), /status/);
  assert.equal((await own.collection("bookings").update(b.id, { status: "paid" })).status, "paid");
  await own.collection("bookings").update(b.id, { status: "rejected" });
  assert.deepEqual((await cust.send(`/api/bmt/availability?pitch=${pitch.id}&date=${date}`, {})).taken, [], "rejected frees slot");
  const b2 = await cust2.collection("bookings").create({ pitch: pitch.id, date, slot: "9:00am-11:00am", sport: "Football", upiRef: "999999999999" });
  await fails(own.collection("bookings").update(b.id, { status: "pending" }), /booked by someone else/);
  assert.equal(b2.status, "pending");

  // --- profiles
  await cust.collection("users").update(c.id, { name: "Renamed", location: "Mumbai" });
  await fails(cust2.collection("users").update(c.id, { name: "x" }));
  await own.collection("admins").update(o.id, { address: "Somewhere 1" });

  console.log("ALL API CHECKS PASSED");
} finally {
  for (const [col, id] of cleanup.reverse()) await su.collection(col).delete(id).catch(() => {});
}
