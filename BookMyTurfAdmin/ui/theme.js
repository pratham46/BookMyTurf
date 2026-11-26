// "Floodlit pitch": turf green, chalk white, floodlight yellow.
export const C = {
  turf: '#0E4D33',
  turfDeep: '#093623',
  chalk: '#FFFFFF',
  flood: '#FFD23F',
  field: '#F1F4F0',
  ink: '#13201A',
  muted: '#5E6B64',
  line: '#DCE3DD',
  paid: '#1F7A45',
  pending: '#9A5B00',
  rejected: '#B3261E',
};

// Barlow for reading, Barlow Condensed (scoreboard) for names, prices and headings.
export const F = {
  body: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semi: 'Barlow_600SemiBold',
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
};

export const STATUS = {
  pending: { label: 'To verify', color: C.pending, bg: '#FFF1D6' },
  paid: { label: 'Paid', color: C.paid, bg: '#DDF2E5' },
  rejected: { label: 'Rejected', color: C.rejected, bg: '#FBE1DE' },
};

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
// "7:00pm-9:00pm" -> "7:00 – 9:00 pm" when both ends share am/pm
export function slotLabel(s) {
  const m = /^(.+?)(am|pm)-(.+?)(am|pm)$/.exec(s || '');
  if (!m) return s;
  return m[2] === m[4] ? `${m[1]} – ${m[3]} ${m[4]}` : `${m[1]} ${m[2]} – ${m[3]} ${m[4]}`;
}
// "2026-11-26" -> { dow: 'Thu', day: '26', month: 'Nov', long: 'Thu, 26 Nov' }
export function dateParts(ymd) {
  const d = new Date(ymd + 'T00:00:00Z');
  const o = (opt) => d.toLocaleDateString('en-IN', { ...opt, timeZone: 'UTC' });
  return { dow: o({ weekday: 'short' }), day: o({ day: 'numeric' }), month: o({ month: 'short' }), long: o({ weekday: 'short', day: 'numeric', month: 'short' }) };
}
