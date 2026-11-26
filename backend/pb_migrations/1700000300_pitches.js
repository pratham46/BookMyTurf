/// <reference path="../pb_data/types.d.ts" />
// Several turfs ("pitches") inside one venue (the turfs collection). Each pitch has its own name, sports, price
// and photos, and its own slot availability. The venue keeps address, slot timings, open days, UPI and approval;
// its price/sports become a summary of its pitches (kept in sync by pb_hooks).
const SPORTS = ["Football", "Cricket", "Basketball", "Tennis", "Volleyball"];
const IMG = ["image/jpeg", "image/png", "image/webp", "image/heic"];

migrate((app) => {
  const turfs = app.findCollectionByNameOrId("turfs");
  const owner = '@request.auth.collectionName = "admins" && venue.owner = @request.auth.id';
  const pitches = new Collection({
    type: "base",
    name: "pitches",
    listRule: "venue.approved = true || (" + owner + ")",
    viewRule: "venue.approved = true || (" + owner + ")",
    createRule: owner,
    updateRule: owner + " && @request.body.venue:isset = false",
    deleteRule: owner, // hook refuses while it has upcoming bookings
    fields: [
      { name: "venue", type: "relation", collectionId: turfs.id, maxSelect: 1, required: true, cascadeDelete: true },
      { name: "name", type: "text", required: true, max: 60 },
      { name: "sports", type: "select", maxSelect: SPORTS.length, values: SPORTS },
      { name: "price", type: "number", min: 0, onlyInt: true },
      { name: "photos", type: "file", maxSelect: 30, maxSize: 8 << 20, mimeTypes: IMG, thumbs: ["300x300", "800x450"] },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_pitches_name ON pitches (venue, name)"],
  });
  app.save(pitches);

  // not required at schema level: deleting a pitch keeps its past bookings (pitch emptied); the hook requires it on create
  const bookings = app.findCollectionByNameOrId("bookings");
  bookings.fields.add(new RelationField({ name: "pitch", collectionId: pitches.id, maxSelect: 1, cascadeDelete: false }));
  app.save(bookings);

  // every existing venue gets "Turf 1" from its current sports/price, and its bookings move onto it
  for (const t of app.findAllRecords("turfs")) {
    const p = new Record(pitches);
    p.set("venue", t.id);
    p.set("name", "Turf 1");
    p.set("sports", t.get("sports"));
    p.set("price", t.get("price"));
    app.save(p);
    for (const b of app.findRecordsByFilter("bookings", "turf = {:t}", "", 0, 0, { t: t.id })) {
      b.set("pitch", p.id);
      app.save(b);
    }
  }

  // one live booking per pitch/date/slot (was per venue)
  bookings.indexes = [
    "CREATE UNIQUE INDEX idx_bookings_slot ON bookings (pitch, date, slot) WHERE status != 'rejected'",
    "CREATE INDEX idx_bookings_user ON bookings (user)",
  ];
  app.save(bookings);
}, (app) => {
  const bookings = app.findCollectionByNameOrId("bookings");
  bookings.indexes = [
    "CREATE UNIQUE INDEX idx_bookings_slot ON bookings (turf, date, slot) WHERE status != 'rejected'",
    "CREATE INDEX idx_bookings_user ON bookings (user)",
  ];
  bookings.fields.removeByName("pitch");
  app.save(bookings);
  app.delete(app.findCollectionByNameOrId("pitches"));
});
