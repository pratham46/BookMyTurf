// Shared booking rules. PocketBase handlers run isolated, so each one require()s this file.
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_DAYS_AHEAD = 30;

// "YYYY-MM-DD" in India time; turfs are local, so "today" is IST, not UTC.
function todayIST() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

function addDays(ymd, n) {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Returns an error message, or "" when the date is bookable for this turf.
function dateError(turf, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || isNaN(new Date(date + "T00:00:00Z"))) return "Pick a valid date.";
  const today = todayIST();
  if (date < today) return "That date is in the past.";
  if (date > addDays(today, MAX_DAYS_AHEAD)) return "Bookings open " + MAX_DAYS_AHEAD + " days ahead.";
  const open = turf.get("openDays") || [];
  const day = DAYS[new Date(date + "T00:00:00Z").getUTCDay()];
  if (open.length && open.indexOf(day) < 0) return "The turf is closed on " + day + ".";
  return "";
}

// "6:00pm-8:00pm" -> 1080 (minutes after midnight of the slot's start)
function slotStart(slot) {
  const m = /^(\d{1,2}):(\d{2})(am|pm)/i.exec(slot || "");
  if (!m) return -1;
  return ((+m[1] % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0)) * 60 + +m[2];
}

// Slots of `date` that have already started (only today has any).
function startedSlots(slots, date) {
  if (date !== todayIST()) return [];
  const now = new Date(Date.now() + 5.5 * 3600 * 1000);
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (slots || []).filter((s) => slotStart(s) <= mins);
}

// Slots of one pitch already held on `date` (each pitch in a venue is booked separately).
function takenSlots(app, pitchId, date) {
  return app
    .findRecordsByFilter("bookings", "pitch = {:p} && date = {:d} && status != 'rejected'", "", 0, 0, { p: pitchId, d: date })
    .map((b) => b.get("slot"));
}

// A pitch customers can book: has a price and at least one sport.
function pitchReady(p) {
  return p.get("price") > 0 && (p.get("sports") || []).length > 0;
}

// Venue summary from its bookable pitches: lowest price ("from") and every sport offered.
// Writes onto the venue record (caller saves). Used for the customer list and the "can go live" check.
function summarise(app, venue) {
  const ready = app.findRecordsByFilter("pitches", "venue = {:v}", "", 0, 0, { v: venue.id }).filter(pitchReady);
  const sports = [];
  for (const p of ready) for (const s of p.get("sports") || []) if (sports.indexOf(s) < 0) sports.push(s);
  venue.set("price", ready.length ? Math.min.apply(null, ready.map((p) => p.get("price"))) : 0);
  venue.set("sports", sports);
}

// Venue `id` if the caller may see it (live, or their own); 404 otherwise.
function visibleVenue(e, id) {
  let turf;
  try {
    turf = e.app.findRecordById("turfs", id);
  } catch (_) {
    throw new NotFoundError("Turf not found.");
  }
  const owner = e.auth && e.auth.collection().name === "admins" && turf.get("owner") === e.auth.id;
  if (!turf.get("approved") && !owner) throw new NotFoundError("Turf not found.");
  return turf;
}

module.exports = { visibleVenue, todayIST, addDays, dateError, takenSlots, startedSlots, slotStart, pitchReady, summarise, MAX_DAYS_AHEAD };
