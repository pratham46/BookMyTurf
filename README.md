# BookMyTurf

Book a sports turf from your phone: pick a venue, a pitch, a date and a time slot, pay the owner by UPI, and track the booking. Turf owners manage their venue, photos and bookings from their own app, and a web control panel approves venues before they go live.

| Folder | What |
|---|---|
| `BookMyTurf/` | **Customer app** (React Native, Expo SDK 58): browse and search venues, filter by sport, book a slot, pay by UPI, track bookings |
| `BookMyTurfAdmin/` | **Turf-owner app** (React Native, Expo SDK 58): venue details, several pitches per venue, photos, UPI details, confirm or reject bookings |
| `backend/` | **PocketBase** in Docker: auth, database, file storage, server-side booking rules, custom API |
| `backend/pb_public/dashboard/` | **Control panel** (web): approve venues, manage owners, customers and bookings |

Tech: React Native · Expo · React 19 · React Navigation 7 · PocketBase (Go + SQLite) · JavaScript server hooks · Docker · Traefik (HTTPS)

## How it fits together

```
customer app --(user login)--> PocketBase <--(owner login)-- owner app
      |  list approved venues              |  edit own venue, pitches, photos, UPI
      |  GET /api/bmt/days, /availability  |  list own venue's bookings
      |  create booking (pending)          |  set status paid / rejected
                                   ^
                                   |  superuser login
                            web control panel
```

1. A turf owner registers in the owner app. The server creates their venue with an empty pitch "Turf 1", hidden until a superuser approves it in the control panel.
2. A customer picks a venue, a pitch, then a date, slot and sport. Taken slots and slots that have already started are greyed out.
3. The customer pays the owner's UPI QR or ID, then enters the 12-digit UPI reference. This creates a **pending** booking. A unique index on `(pitch, date, slot)` means two people can't book the same slot.
4. The owner checks their UPI app, then marks the booking **Paid** or **Rejected**. Rejecting frees the slot. The customer sees the status in *My Bookings*.

## Run the apps

```bash
cd BookMyTurf        # or BookMyTurfAdmin
npm install
npx expo start       # scan the QR with Expo Go (Android / iPhone), or press a / w
```

The apps use the live backend by default (`API_URL` in each app's `auth.js`). To use a local backend:
`EXPO_PUBLIC_API_URL=http://<pc-ip>:8090 npx expo start`

## Backend

One Docker container: PocketBase 0.40.6 plus the BookMyTurf schema and booking rules.

| Path | Purpose |
|---|---|
| `Dockerfile`, `compose.yml` | Image and service, exposed over HTTPS through Traefik |
| `pb_migrations/` | Schema: `admins` auth collection, profile fields, `turfs`, `pitches`, `bookings` with the unique slot index |
| `pb_hooks/main.pb.js` | Server-side rules and custom routes |
| `pb_hooks/rules.js` | Shared date and slot helpers (IST) |
| `pb_public/dashboard/` | Control panel: one HTML file plus the vendored PocketBase SDK |
| `seed.mjs` | Demo data: 5 owners and venues (two with several pitches), 3 customers, bookings in every status (re-runnable) |
| `test-api.mjs` | End-to-end API rule check; creates and deletes throwaway accounts |

### Data model

- **users** (auth): customers. `name`, `phone`, `location`. Open sign-up.
- **admins** (auth): turf owners. `name`, `phone`, `location`, `address`. Open sign-up.
- **turfs** = a **venue** (one per owner): `name`, `area`, `phone`, `address`, `mapUrl`, `cover`, `gallery[]`, `slots[]`, `openDays[]`, `upiId`, `upiQr`, `approved`.
  `price` and `sports[]` are a server-kept summary of the venue's pitches (lowest price, all sports), used for the customer list.
- **pitches** = a **turf inside a venue**: `venue`, `name`, `sports[]`, `price`, `photos[]`.
- **bookings**: `turf`, `pitch`, `user`, `date`, `slot`, `sport`, `amount`, `upiRef`, `status` (pending / paid / rejected), plus a copy of the customer's contact details.

Customers see only approved venues and only their own bookings. Owners see and edit only their own venue and can change a booking's **status only**.

### Server rules

- A venue goes live only once it has at least one slot and one bookable pitch (price and sport). This applies to the superuser too.
- A pitch with upcoming bookings can't be deleted, and the last bookable pitch of a live venue can't be deleted.
- On booking create, the server fills in the venue, customer, amount (from the pitch price) and `pending` status, and rejects:
  unapproved venues, incomplete pitches, past dates or dates more than 30 days ahead, closed days, slots or sports not offered, today's slots that have already started, slots already taken, and bad UPI references.

### Custom API

| Route | Returns |
|---|---|
| `GET /api/bmt/days?turf=ID` | `{ today, days[] }`: bookable dates for the venue over the next 14 days |
| `GET /api/bmt/availability?pitch=ID&date=YYYY-MM-DD` | `{ slots, taken, started, open, reason }` for one pitch, without other customers' details |

Everything else is the standard PocketBase REST API (`/api/collections/<name>/records`).

### Run locally

```bash
cd backend
pocketbase serve --dir=./pb_data --migrationsDir=pb_migrations --hooksDir=pb_hooks --publicDir=pb_public
```

Hook handlers run isolated: a helper used inside a handler must live in `rules.js` and be `require()`d. On Windows, restart PocketBase after editing hooks.

### Deploy

```bash
tar czf - --exclude=pb_data backend | ssh <user>@<server> \
  'tar xzf - -C ~/bookmyturf --strip-components=1 && cd ~/bookmyturf && sudo docker compose up -d --build'
```

Migrations run on start. Data lives in `~/bookmyturf/pb_data` on the server; back it up before schema changes.

### Test

```bash
PB_URL=<backend-url> SU_EMAIL=... SU_PASS=... node backend/test-api.mjs   # -> ALL API CHECKS PASSED
```
