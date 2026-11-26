/// <reference path="../pb_data/types.d.ts" />

// New owner account -> their venue (hidden until approved) with one empty turf ("pitch") to fill in.
onRecordAfterCreateSuccess((e) => {
  const turf = new Record(e.app.findCollectionByNameOrId("turfs"));
  turf.set("owner", e.record.id);
  turf.set("name", e.record.get("name") ? e.record.get("name") + "'s Turf" : "My Turf");
  turf.set("phone", e.record.get("phone"));
  turf.set("approved", false);
  e.app.save(turf);
  const pitch = new Record(e.app.findCollectionByNameOrId("pitches"));
  pitch.set("venue", turf.id);
  pitch.set("name", "Turf 1");
  e.app.save(pitch);
  e.next();
}, "admins");

// Venue price/sports are a summary of its pitches (not editable directly). A venue can only be live
// (visible/bookable) once it has slots and at least one pitch with a price and sports - applies to superusers too.
onRecordUpdateRequest((e) => {
  const rules = require(`${__hooks}/rules.js`);
  const t = e.record;
  rules.summarise(e.app, t);
  if (t.get("approved")) {
    const missing = [];
    if (!(t.get("price") > 0)) missing.push("price");
    if (!(t.get("slots") || []).length) missing.push("slots");
    if (!(t.get("sports") || []).length) missing.push("sports");
    if (missing.length) throw new BadRequestError("A live turf needs a price, slots and sports - missing " + missing.join(", ") + ".");
  }
  e.next();
}, "turfs");

// A live venue may only offer complete pitches.
function checkPitch(e) {
  const rules = require(`${__hooks}/rules.js`);
  const venue = e.app.findRecordById("turfs", e.record.get("venue"));
  if (venue.get("approved") && !rules.pitchReady(e.record))
    throw new BadRequestError("Your venue is live, so each turf needs a price and at least one sport.");
  e.next();
}
onRecordCreateRequest(checkPitch, "pitches");
onRecordUpdateRequest(checkPitch, "pitches");

// Keep a turf with upcoming bookings, and keep a live venue bookable.
onRecordDeleteRequest((e) => {
  const rules = require(`${__hooks}/rules.js`);
  const p = e.record;
  const upcoming = e.app.findRecordsByFilter("bookings", "pitch = {:p} && date >= {:d} && status != 'rejected'", "", 1, 0,
    { p: p.id, d: rules.todayIST() });
  if (upcoming.length) throw new BadRequestError("This turf has upcoming bookings. Reject or finish them before deleting it.");
  const venue = e.app.findRecordById("turfs", p.get("venue"));
  if (venue.get("approved")) {
    const others = e.app.findRecordsByFilter("pitches", "venue = {:v} && id != {:p}", "", 0, 0, { v: venue.id, p: p.id }).filter(rules.pitchReady);
    if (!others.length) throw new BadRequestError("A live venue needs at least one bookable turf.");
  }
  e.next();
}, "pitches");

// Re-summarise the venue whenever its pitches change.
function syncVenue(e) {
  const rules = require(`${__hooks}/rules.js`);
  try {
    const venue = e.app.findRecordById("turfs", e.record.get("venue"));
    rules.summarise(e.app, venue);
    e.app.save(venue);
  } catch (_) {} // venue itself being deleted (cascade)
  e.next();
}
onRecordAfterCreateSuccess(syncVenue, "pitches");
onRecordAfterUpdateSuccess(syncVenue, "pitches");
onRecordAfterDeleteSuccess(syncVenue, "pitches");

// Customer creates a booking for one pitch: server decides venue/user/status/amount and validates the rest.
onRecordCreateRequest((e) => {
  const rules = require(`${__hooks}/rules.js`);
  const r = e.record;
  let pitch, turf;
  try {
    pitch = e.app.findRecordById("pitches", r.get("pitch"));
    turf = e.app.findRecordById("turfs", pitch.get("venue"));
  } catch (_) {
    throw new BadRequestError("Pick which turf you want to book.");
  }
  if (!turf.get("approved") || !rules.pitchReady(pitch)) throw new BadRequestError("This turf is not taking bookings.");
  r.set("turf", turf.id);

  const date = r.get("date");
  const err = rules.dateError(turf, date);
  if (err) throw new BadRequestError(err);
  if ((turf.get("slots") || []).indexOf(r.get("slot")) < 0) throw new BadRequestError("That time slot isn't offered.");
  if (rules.startedSlots([r.get("slot")], date).length) throw new BadRequestError("That slot has already started today. Pick a later one.");
  if ((pitch.get("sports") || []).indexOf(r.get("sport")) < 0) throw new BadRequestError("That sport isn't offered on this turf.");
  if (!/^\d{12}$/.test(r.get("upiRef") || "")) throw new BadRequestError("UPI reference must be 12 digits.");
  if (rules.takenSlots(e.app, pitch.id, date).indexOf(r.get("slot")) >= 0)
    throw new BadRequestError("Sorry, that slot was just booked. Pick another one.");

  r.set("user", e.auth.id);
  r.set("status", "pending");
  r.set("amount", pitch.get("price"));
  r.set("customerName", e.auth.get("name"));
  r.set("customerEmail", e.auth.email());
  r.set("customerPhone", e.auth.get("phone"));
  e.next(); // unique index still guards a race between the check above and the insert
}, "bookings");

// Owner updates a booking: only the status may change.
onRecordUpdateRequest((e) => {
  const before = e.record.original();
  for (const f of ["turf", "pitch", "user", "date", "slot", "sport", "amount", "upiRef", "customerName", "customerEmail", "customerPhone"]) {
    if (String(e.record.get(f)) !== String(before.get(f))) throw new BadRequestError("Only the booking status can be changed.");
  }
  if (before.get("status") === "rejected" && e.record.get("status") !== "rejected") {
    // the slot may have been re-booked after rejection
    const rules = require(`${__hooks}/rules.js`);
    if (rules.takenSlots(e.app, before.get("pitch"), before.get("date")).indexOf(before.get("slot")) >= 0)
      throw new BadRequestError("That slot has been booked by someone else since.");
  }
  e.next();
}, "bookings");

// GET /api/bmt/availability?pitch=ID&date=YYYY-MM-DD -> { date, slots, taken, started, open, reason }
// Lets customers see one turf's free slots without exposing other people's bookings.
routerAdd("GET", "/api/bmt/availability", (e) => {
  const rules = require(`${__hooks}/rules.js`);
  const q = e.request.url.query();
  const date = q.get("date");
  let pitch;
  try {
    pitch = e.app.findRecordById("pitches", q.get("pitch"));
  } catch (_) {
    throw new NotFoundError("Turf not found.");
  }
  const turf = rules.visibleVenue(e, pitch.get("venue"));
  const reason = rules.dateError(turf, date);
  return e.json(200, {
    date,
    slots: turf.get("slots") || [],
    taken: reason && !/^\d{4}-\d{2}-\d{2}$/.test(date || "") ? [] : rules.takenSlots(e.app, pitch.id, date),
    started: rules.startedSlots(turf.get("slots"), date), // already begun today: not bookable
    open: !reason,
    reason,
  });
}, $apis.requireAuth());

// GET /api/bmt/days?turf=ID -> next bookable dates (honours openDays), for the date picker.
routerAdd("GET", "/api/bmt/days", (e) => {
  const rules = require(`${__hooks}/rules.js`);
  const turf = rules.visibleVenue(e, e.request.url.query().get("turf"));
  const today = rules.todayIST();
  const days = [];
  for (let i = 0; i <= 14; i++) {
    const d = rules.addDays(today, i);
    if (!rules.dateError(turf, d)) days.push(d);
  }
  return e.json(200, { today, days });
}, $apis.requireAuth());
