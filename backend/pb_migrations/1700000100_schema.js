/// <reference path="../pb_data/types.d.ts" />
// BookMyTurf schema: profile fields, turfs, bookings.
const SLOTS = [
  "9:00am-11:00am", "12:00pm-2:00pm", "1:00pm-3:00pm", "2:00pm-4:00pm", "3:00pm-5:00pm",
  "4:00pm-6:00pm", "5:00pm-7:00pm", "6:00pm-8:00pm", "7:00pm-9:00pm", "9:00pm-11:00pm", "11:00pm-1:00am",
];
const SPORTS = ["Football", "Cricket", "Basketball", "Tennis", "Volleyball"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const IMG = ["image/jpeg", "image/png", "image/webp", "image/heic"];

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new TextField({ name: "phone", max: 20 }));
  users.fields.add(new TextField({ name: "location", max: 80 }));
  app.save(users);

  const admins = app.findCollectionByNameOrId("admins");
  admins.createRule = ""; // owners can sign up; their turf stays hidden until approved
  admins.fields.add(new TextField({ name: "phone", max: 20 }));
  admins.fields.add(new TextField({ name: "location", max: 80 }));
  admins.fields.add(new TextField({ name: "address", max: 300 }));
  app.save(admins);

  const ownerRule = '@request.auth.collectionName = "admins" && owner = @request.auth.id';
  const turfs = new Collection({
    type: "base",
    name: "turfs",
    listRule: "approved = true || (" + ownerRule + ")",
    viewRule: "approved = true || (" + ownerRule + ")",
    createRule: null, // created by hook when an admin signs up
    updateRule: ownerRule + " && @request.body.approved:isset = false && @request.body.owner:isset = false",
    deleteRule: null,
    fields: [
      { name: "owner", type: "relation", collectionId: admins.id, maxSelect: 1, required: true, cascadeDelete: true },
      { name: "name", type: "text", required: true, max: 80 },
      { name: "area", type: "text", max: 80 },
      { name: "price", type: "number", min: 0, onlyInt: true },
      { name: "phone", type: "text", max: 20 },
      { name: "address", type: "text", max: 300 },
      { name: "mapUrl", type: "url" },
      { name: "cover", type: "file", maxSelect: 1, maxSize: 8 << 20, mimeTypes: IMG, thumbs: ["300x300", "800x450"] },
      { name: "gallery", type: "file", maxSelect: 30, maxSize: 8 << 20, mimeTypes: IMG, thumbs: ["800x450"] },
      { name: "sports", type: "select", maxSelect: SPORTS.length, values: SPORTS },
      { name: "slots", type: "select", maxSelect: SLOTS.length, values: SLOTS },
      { name: "openDays", type: "select", maxSelect: 7, values: DAYS },
      { name: "upiId", type: "text", max: 80 },
      { name: "upiQr", type: "file", maxSelect: 1, maxSize: 4 << 20, mimeTypes: IMG },
      { name: "approved", type: "bool" },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_turfs_owner ON turfs (owner)"],
  });
  app.save(turfs);

  const mine = '(@request.auth.collectionName = "users" && user = @request.auth.id)';
  const owned = '(@request.auth.collectionName = "admins" && turf.owner = @request.auth.id)';
  const bookings = new Collection({
    type: "base",
    name: "bookings",
    listRule: mine + " || " + owned,
    viewRule: mine + " || " + owned,
    createRule: '@request.auth.collectionName = "users"', // fields validated/filled by hook
    updateRule: owned, // hook allows only status changes
    deleteRule: null,
    fields: [
      { name: "turf", type: "relation", collectionId: turfs.id, maxSelect: 1, required: true, cascadeDelete: true },
      { name: "user", type: "relation", collectionId: users.id, maxSelect: 1, required: true, cascadeDelete: true },
      { name: "date", type: "text", required: true, pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
      { name: "slot", type: "text", required: true },
      { name: "sport", type: "text", required: true },
      { name: "amount", type: "number", min: 0, onlyInt: true },
      { name: "upiRef", type: "text", required: true, pattern: "^[0-9]{12}$" },
      { name: "status", type: "select", maxSelect: 1, required: true, values: ["pending", "paid", "rejected"] },
      { name: "customerName", type: "text" },
      { name: "customerEmail", type: "text" },
      { name: "customerPhone", type: "text" },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      // one live booking per turf/date/slot; rejecting frees the slot
      "CREATE UNIQUE INDEX idx_bookings_slot ON bookings (turf, date, slot) WHERE status != 'rejected'",
      "CREATE INDEX idx_bookings_user ON bookings (user)",
    ],
  });
  app.save(bookings);
}, (app) => {
  for (const n of ["bookings", "turfs"]) app.delete(app.findCollectionByNameOrId(n));
});
